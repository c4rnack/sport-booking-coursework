import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, MembershipType } from '@prisma/client';
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

    const loyaltyCard = this.loyaltyCardFactory.createCard(user.loyaltyTier);

    const addons = req.addons ?? [];
    let component: IBookingComponent = new BaseBookingComponent(
      slot.section.basePrice,
      slot.section.title,
    );

    if (addons.includes('equipment')) {
      component = new EquipmentRentalDecorator(component);
    }
    if (addons.includes('pool')) {
      component = new PoolAccessDecorator(component, loyaltyCard.hasFreePoolAccess());
    }
    if (addons.includes('trainer')) {
      component = new PersonalTrainerDecorator(component);
    }

    const strategy = loyaltyCard.getPricingStrategy();
    const rawPrice = component.getCost();
    const totalPrice = strategy.calculateFinalPrice(rawPrice);
    const earnedPoints = strategy.calculateBonusPoints(totalPrice);

    const booking = await this.prisma.$transaction(async (tx) => {
      await tx.scheduleSlot.update({
        where: { id: slot.id },
        data: { availableSpots: { decrement: 1 } },
      });

      return tx.booking.create({
        data: {
          userId: user.id,
          sectionId: slot.sectionId,
          slotId: slot.id,
          totalPrice,
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
      message: `${component.getDescription()} на ${slot.startTime.toISOString()}. Оплачено: ${totalPrice} грн.`,
      earnedPoints,
    });

    return {
      booking,
      breakdown: {
        description: component.getDescription(),
        rawPrice,
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

    const saved = await this.prisma.membership.create({
      data: {
        userId,
        type: membershipObj.getType(),
        price: membershipObj.getPrice(),
        visitsLeft: meta.visitsLeft,
        expiresAt: meta.expiresAt,
        companyName: meta.companyName,
        maxEmployees: meta.maxEmployees,
      },
    });

    await this.notificationManager.notify('MEMBERSHIP_PURCHASED', {
      userId,
      title: 'Абонемент активовано',
      message: `Оформлено абонемент типу ${saved.type} вартістю ${saved.price} грн.`,
    });

    return saved;
  }
}