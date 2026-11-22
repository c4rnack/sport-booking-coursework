import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, LoyaltyTier, MembershipStatus, MembershipType } from '@prisma/client';
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
}

@Injectable()
export class BookingFacade {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyCardFactory: LoyaltyCardFactory,
    private readonly membershipFactory: MembershipFactory,
    private readonly notificationManager: NotificationManager,
  ) {}

  async createAndPayBooking(userId: string, req: BookingRequestInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const slot = await this.prisma.scheduleSlot.findUnique({
      where: { id: req.slotId },
      include: { section: true },
    });
    if (!slot) throw new NotFoundException('Schedule slot not found');
    if (slot.availableSpots <= 0) throw new BadRequestException('No available spots left');

    // Перевірка опції басейну: дозволена лише для секцій плавання
    const addons = req.addons ?? [];
    const isSwimming = slot.section.sportType.toLowerCase() === 'swimming';
    if (addons.includes('pool') && !isSwimming) {
      throw new BadRequestException('Доступ до басейну доступний лише для секцій плавання');
    }

    // 1. Factory Method: отримуємо картку лояльності клієнта
    const loyaltyCard = this.loyaltyCardFactory.createCard(user.loyaltyTier);

    // 2. Decorator: динамічно накладаємо додаткові послуги
    let component: IBookingComponent = new BaseBookingComponent(
      slot.section.basePrice,
      slot.section.title,
    );

    if (addons.includes('equipment')) {
      component = new EquipmentRentalDecorator(component);
    }
    if (addons.includes('pool') && isSwimming) {
      component = new PoolAccessDecorator(component, loyaltyCard.hasFreePoolAccess());
    }
    if (addons.includes('trainer')) {
      component = new PersonalTrainerDecorator(component);
    }

    // 3. Strategy: ціна зі знижкою картки лояльності
    const strategy = loyaltyCard.getPricingStrategy();
    const rawPrice = component.getCost();
    const priceAfterTier = strategy.calculateFinalPrice(rawPrice);

    // Списання накопичених бонусів (1 бал = 1 грн, максимум 50% вартості)
    let bonusPointsUsed = 0;
    if (req.useBonusPoints && user.bonusPoints > 0) {
      const maxRedeemable = Math.floor(priceAfterTier * 0.5);
      bonusPointsUsed = Math.min(user.bonusPoints, maxRedeemable);
    }

    const totalPrice = Number((priceAfterTier - bonusPointsUsed).toFixed(2));
    const earnedPoints = strategy.calculateBonusPoints(totalPrice);

    // 4. Транзакція: резервуємо місце, списуємо бонуси (якщо обрано) і створюємо бронювання
    const booking = await this.prisma.$transaction(async (tx) => {
      await tx.scheduleSlot.update({
        where: { id: slot.id },
        data: { availableSpots: { decrement: 1 } },
      });

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
          bonusPointsUsed,
          appliedAddons: addons,
          status: BookingStatus.CONFIRMED,
        },
        include: { section: true, slot: true },
      });
    });

    // 5. Observer: сповіщення клієнта + нарахування бонусів (та автоапгрейд до PREMIUM)
    await this.notificationManager.notify('BOOKING_CONFIRMED', {
      userId: user.id,
      email: user.email,
      title: 'Бронювання підтверджено',
      message: `${component.getDescription()} на ${slot.startTime.toLocaleString('uk-UA')}. Оплачено: ${totalPrice} грн.`,
      earnedPoints,
    });

    return {
      booking,
      breakdown: {
        description: component.getDescription(),
        rawPrice,
        priceAfterTier,
        bonusPointsUsed,
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
    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.scheduleSlot.update({
        where: { id: booking.slotId },
        data: { availableSpots: { increment: 1 } },
      });

      // Повертаємо бонуси, якщо клієнт списував їх при цьому бронюванні
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

    const saved = await this.prisma.$transaction(async (tx) => {
      const created = await tx.membership.create({
        data: {
          userId,
          type: membershipObj.getType(),
          status: MembershipStatus.ACTIVE,
          price: membershipObj.getPrice(),
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
      message: `Оформлено абонемент типу ${saved.type} вартістю ${saved.price} грн.`,
    });

    return saved;
  }

  async cancelMembership(membershipId: string, userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, userId },
    });
    if (!membership) throw new NotFoundException('Абонемент не знайдено');
    if (membership.status === MembershipStatus.CANCELLED) {
      throw new BadRequestException('Абонемент уже скасовано');
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

    // Factory Method створює конфігурацію нового рівня абонемента
    const upgradedObj = this.membershipFactory.createMembership(targetType, companyName);
    const meta = upgradedObj.getMetadata();
    const extraToPay = Math.max(0, upgradedObj.getPrice() - current.price);

    const updated = await this.prisma.$transaction(async (tx) => {
      const m = await tx.membership.update({
        where: { id: current.id },
        data: {
          type: upgradedObj.getType(),
          price: upgradedObj.getPrice(),
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
      message: `Тариф оновлено з ${current.type} до ${targetType}. Доплата склала ${extraToPay} грн.`,
    });

    return { membership: updated, extraToPay };
  }
}