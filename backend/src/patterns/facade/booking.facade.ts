import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  BookingStatus,
  LoyaltyTier,
  MembershipStatus,
  MembershipType,
  PromotionTarget,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BaseBookingComponent,
  EquipmentRentalDecorator,
  IBookingComponent,
  PersonalTrainerDecorator,
  PoolAccessDecorator,
} from '../decorator/booking.decorator';
import { LoyaltyCardFactory } from '../factory/loyalty-card.factory';
import { MembershipFactory } from '../factory/membership.factory';
import { NotificationManager } from '../observer/notification.observer';

export interface BookingRequestInput {
  slotId: string;
  addons?: ('equipment' | 'pool' | 'trainer')[];
  useBonusPoints?: boolean;
  useMembership?: boolean;
}

@Injectable()
export class BookingFacade {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyCardFactory: LoyaltyCardFactory,
    private readonly membershipFactory: MembershipFactory,
    private readonly notificationManager: NotificationManager,
  ) {}

  private async getBestSectionPromo(sportType: string) {
    const now = new Date();
    const promos = await this.prisma.promotion.findMany({
      where: {
        validUntil: { gte: now },
        OR: [
          { targetScope: PromotionTarget.ALL_SECTIONS },
          {
            targetScope: PromotionTarget.SPORT_TYPE,
            targetSportType: { equals: sportType, mode: 'insensitive' },
          },
        ],
      },
      orderBy: { discountPercent: 'desc' },
    });
    return promos[0] ?? null;
  }

  private async getBestMembershipPromo() {
    const now = new Date();
    const promos = await this.prisma.promotion.findMany({
      where: {
        validUntil: { gte: now },
        targetScope: PromotionTarget.MEMBERSHIPS,
      },
      orderBy: { discountPercent: 'desc' },
    });
    return promos[0] ?? null;
  }

  private async getActiveValidMembership(userId: string) {
    const now = new Date();
    const list = await this.prisma.membership.findMany({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { price: 'desc' },
    });
    return list.find((m) => m.type !== MembershipType.SINGLE || (m.visitsLeft ?? 0) > 0) ?? null;
  }

  async createAndPayBooking(userId: string, req: BookingRequestInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const slot = await this.prisma.scheduleSlot.findUnique({
      where: { id: req.slotId },
      include: { section: true },
    });
    if (!slot) throw new NotFoundException('Schedule slot not found');
    if (slot.availableSpots <= 0) throw new BadRequestException('No available spots left');

    const addons = req.addons ?? [];
    const isSwimming = slot.section.sportType.toLowerCase() === 'swimming';
    if (addons.includes('pool') && !isSwimming) {
      throw new BadRequestException('Доступ до басейну доступний лише для секцій плавання');
    }

    const loyaltyCard = this.loyaltyCardFactory.createCard(user.loyaltyTier);
    const activeMembershipRecord =
      req.useMembership === true
      ? await this.getActiveValidMembership(user.id)
      : null;
    const membershipModel = activeMembershipRecord
      ? this.membershipFactory.createMembership(activeMembershipRecord.type)
      : null;

    const basePrice = membershipModel?.coversBaseSession() ? 0 : slot.section.basePrice;
    const baseTitle = membershipModel
      ? `${slot.section.title} (Абонемент ${membershipModel.getType()})`
      : slot.section.title;

    let component: IBookingComponent = new BaseBookingComponent(basePrice, baseTitle);

    if (addons.includes('equipment')) {
      component = new EquipmentRentalDecorator(component, Boolean(membershipModel?.coversEquipment()));
    }
    if (addons.includes('pool') && isSwimming) {
      const freeByPoolMembership = Boolean(membershipModel?.coversPool());
      const freeByPremium = loyaltyCard.hasFreePoolAccess();
      const reason = freeByPoolMembership ? `Абонемент ${membershipModel!.getType()}` : 'Картка PREMIUM';
      component = new PoolAccessDecorator(component, freeByPoolMembership || freeByPremium, reason);
    }
    if (addons.includes('trainer')) {
      component = new PersonalTrainerDecorator(component);
    }
  
    const rawPrice = component.getCost();
    const activePromo = await this.getBestSectionPromo(slot.section.sportType);
    const promoDiscountPercent = activePromo ? activePromo.discountPercent : 0;
    const priceAfterPromo = Number((rawPrice * (1 - promoDiscountPercent / 100)).toFixed(2));

    const strategy = loyaltyCard.getPricingStrategy();
    const priceAfterTier = strategy.calculateFinalPrice(priceAfterPromo);

    let bonusPointsUsed = 0;
    if (req.useBonusPoints && user.bonusPoints > 0 && priceAfterTier > 0) {
      const maxRedeemable = Math.floor(priceAfterTier * 0.5);
      bonusPointsUsed = Math.min(user.bonusPoints, maxRedeemable);
    }

    const totalPrice = Number((priceAfterTier - bonusPointsUsed).toFixed(2));
    const earnedPoints = totalPrice > 0 ? strategy.calculateBonusPoints(totalPrice) : 0;

    const booking = await this.prisma.$transaction(async (tx) => {
      await tx.scheduleSlot.update({
        where: { id: slot.id },
        data: { availableSpots: { decrement: 1 } },
      });

      if (activeMembershipRecord?.type === MembershipType.SINGLE) {
        const nextVisits = (activeMembershipRecord.visitsLeft ?? 1) - 1;
        await tx.membership.update({
          where: { id: activeMembershipRecord.id },
          data: {
            visitsLeft: nextVisits,
            status: nextVisits <= 0 ? MembershipStatus.USED : MembershipStatus.ACTIVE,
          },
        });
      }

      if (bonusPointsUsed > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: { bonusPoints: { decrement: bonusPointsUsed } },
        });
      }

      return tx.booking.create({
        data: {
          userId: user.id,
          sectionId: slot.sectionId,
          slotId: slot.id,
          totalPrice,
          promoDiscountPercent,
          usedMembershipType: activeMembershipRecord?.type ?? null,
          bonusPointsUsed,
          appliedAddons: addons,
          status: BookingStatus.CONFIRMED,
        },
        include: { section: true, slot: true },
      });
    });

    await this.notificationManager.notify('BOOKING_CONFIRMED', {
      userId: user.id,
      email: user.email,
      title: 'Бронювання підтверджено',
      message: `${component.getDescription()} на ${slot.startTime.toLocaleString('uk-UA')}. До сплати: ${totalPrice} грн.`,
      earnedPoints,
    });

    return {
      booking,
      breakdown: {
        description: component.getDescription(),
        rawPrice,
        promoTitle: activePromo?.title ?? null,
        promoDiscountPercent,
        priceAfterPromo,
        priceAfterTier,
        bonusPointsUsed,
        usedMembershipType: activeMembershipRecord?.type ?? null,
        finalPrice: totalPrice,
        loyaltyTier: loyaltyCard.getTierName(),
        earnedPoints,
      },
    };
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, section: true },
    });
    if (!booking || booking.userId !== userId) throw new NotFoundException('Booking not found');
    if (booking.status === BookingStatus.CANCELLED) throw new BadRequestException('Booking is already cancelled');

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.scheduleSlot.update({
        where: { id: booking.slotId },
        data: { availableSpots: { increment: 1 } },
      });

      if (booking.bonusPointsUsed > 0) {
        await tx.user.update({
          where: { id: booking.userId },
          data: { bonusPoints: { increment: booking.bonusPointsUsed } },
        });
      }

      return tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CANCELLED },
      });
    });

    await this.notificationManager.notify('BOOKING_CANCELLED', {
      userId: booking.userId,
      email: booking.user.email,
      title: 'Бронювання скасовано',
      message: `Ваше бронювання "${booking.section.title}" скасовано, місце повернено у розклад.`,
    });

    return updated;
  }

  async purchaseMembership(userId: string, type: MembershipType, companyName?: string) {
    const membershipObj = this.membershipFactory.createMembership(type, companyName);
    const meta = membershipObj.getMetadata();

    const promo = await this.getBestMembershipPromo();
    const discountPct = promo ? promo.discountPercent : 0;
    const finalPrice = Number((membershipObj.getPrice() * (1 - discountPct / 100)).toFixed(2));

    const saved = await this.prisma.$transaction(async (tx) => {
      const created = await tx.membership.create({
        data: {
          userId,
          type: membershipObj.getType(),
          status: MembershipStatus.ACTIVE,
          price: finalPrice,
          visitsLeft: meta.visitsLeft ?? null,
          expiresAt: meta.expiresAt,
          companyName: meta.companyName ?? null,
          maxEmployees: meta.maxEmployees ?? null,
        },
      });

      if (type === MembershipType.CORPORATE) {
        await tx.user.update({
          where: { id: userId },
          data: { loyaltyTier: LoyaltyTier.CORPORATE },
        });
      }

      return created;
    });

    await this.notificationManager.notify('MEMBERSHIP_PURCHASED', {
      userId,
      title: 'Абонемент активовано',
      message: `Оформлено абонемент ${saved.type} за ${saved.price} грн${discountPct ? ` (з урахуванням акції -${discountPct}%)` : ''}.`,
    });

    return saved;
  }

  async cancelMembership(membershipId: string, userId: string) {
    const membership = await this.prisma.membership.findFirst({ where: { id: membershipId, userId } });
    if (!membership) throw new NotFoundException('Абонемент не знайдено');
    if (membership.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException('Скасувати можна лише активний абонемент');
    }

    const updated = await this.prisma.membership.update({
      where: { id: membership.id },
      data: { status: MembershipStatus.CANCELLED },
    });

    await this.notificationManager.notify('MEMBERSHIP_UPDATED', {
      userId,
      title: 'Абонемент скасовано',
      message: `Ваш абонемент ${membership.type} було скасовано.`,
    });

    return updated;
  }

  async upgradeMembership(
    membershipId: string,
    userId: string,
    targetType: MembershipType,
    companyName?: string,
  ) {
    const rank: Record<MembershipType, number> = {
      [MembershipType.SINGLE]: 1,
      [MembershipType.MONTHLY]: 2,
      [MembershipType.CORPORATE]: 3,
    };

    const current = await this.prisma.membership.findFirst({
      where: { id: membershipId, userId, status: MembershipStatus.ACTIVE },
    });
    if (!current) throw new NotFoundException('Активний абонемент не знайдено');
    if (rank[targetType] <= rank[current.type]) {
      throw new BadRequestException('Можна підвищити лише до вищого тарифу (SINGLE → MONTHLY → CORPORATE)');
    }

    const upgradedObj = this.membershipFactory.createMembership(targetType, companyName);
    const meta = upgradedObj.getMetadata();

    const promo = await this.getBestMembershipPromo();
    const discountPct = promo ? promo.discountPercent : 0;
    const targetFinalPrice = Number((upgradedObj.getPrice() * (1 - discountPct / 100)).toFixed(2));
    const extraToPay = Math.max(0, Number((targetFinalPrice - current.price).toFixed(2)));

    const updated = await this.prisma.$transaction(async (tx) => {
      const m = await tx.membership.update({
        where: { id: current.id },
        data: {
          type: upgradedObj.getType(),
          price: targetFinalPrice,
          visitsLeft: meta.visitsLeft ?? null,
          expiresAt: meta.expiresAt,
          companyName: meta.companyName ?? null,
          maxEmployees: meta.maxEmployees ?? null,
        },
      });

      if (targetType === MembershipType.CORPORATE) {
        await tx.user.update({
          where: { id: userId },
          data: { loyaltyTier: LoyaltyTier.CORPORATE },
        });
      }

      return m;
    });

    await this.notificationManager.notify('MEMBERSHIP_UPDATED', {
      userId,
      title: `Абонемент підвищено до ${targetType}`,
      message: `Тариф оновлено з ${current.type} до ${targetType}. Доплата: ${extraToPay} грн.`,
    });

    return { membership: updated, extraToPay };
  }
}