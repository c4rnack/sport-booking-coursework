import { Injectable } from '@nestjs/common';
import { BookingStatus, LoyaltyTier, PromotionTarget } from '@prisma/client';
import { NotificationManager } from '../patterns/observer/notification.observer';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFacilityDto,
  CreatePromotionDto,
  CreateSectionDto,
  CreateSlotDto,
  CreateTrainerDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationManager: NotificationManager,
  ) {}

  createFacility(dto: CreateFacilityDto) {
    return this.prisma.facility.create({ data: dto });
  }

  deleteFacility(id: string) {
    return this.prisma.facility.delete({ where: { id } });
  }

  createTrainer(dto: CreateTrainerDto) {
    return this.prisma.trainer.create({ data: dto });
  }

  deleteTrainer(id: string) {
    return this.prisma.trainer.delete({ where: { id } });
  }

  async createSection(dto: CreateSectionDto) {
    const section = await this.prisma.sportSection.create({
      data: dto,
      include: { facility: true, trainer: true },
    });

    await this.notificationManager.notify('PROMOTION_PUBLISHED', {
      broadcastAll: true,
      title: 'Нова спортивна секція!',
      message: `Відкрито запис на "${section.title}" (${section.sportType}) у ${section.facility.name}.`,
    });

    return section;
  }

  deleteSection(id: string) {
    return this.prisma.sportSection.delete({ where: { id } });
  }

  createSlot(dto: CreateSlotDto) {
    return this.prisma.scheduleSlot.create({
      data: {
        sectionId: dto.sectionId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        availableSpots: dto.availableSpots,
      },
    });
  }

  async publishPromotion(dto: CreatePromotionDto) {
    const promo = await this.prisma.promotion.create({
      data: {
        title: dto.title,
        description: dto.description,
        discountPercent: dto.discountPercent,
        validUntil: new Date(dto.validUntil),
        targetScope: dto.targetScope,
        targetSportType: dto.targetScope === PromotionTarget.SPORT_TYPE ? dto.targetSportType : null,
      },
    });

    await this.notificationManager.notify('PROMOTION_PUBLISHED', {
      broadcastAll: true,
      title: `Акція: ${promo.title} (-${promo.discountPercent}%)`,
      message: promo.description,
    });

    return promo;
  }

  getAllBookings() {
    return this.prisma.booking.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true, loyaltyTier: true } },
        section: true,
        slot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateBookingStatus(bookingId: string, status: BookingStatus) {
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        loyaltyTier: true,
        bonusPoints: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateUserLoyaltyTier(userId: string, loyaltyTier: LoyaltyTier) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { loyaltyTier },
      select: { id: true, fullName: true, email: true, loyaltyTier: true },
    });
  }
}