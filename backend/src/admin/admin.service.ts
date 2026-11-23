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
  UpdateFacilityDto,
  UpdatePromotionDto,
  UpdateSectionDto,
  UpdateSlotDto,
  UpdateTrainerDto,
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

  updateFacility(id: string, dto: UpdateFacilityDto) {
    return this.prisma.facility.update({ where: { id }, data: dto });
  }

  deleteFacility(id: string) {
    return this.prisma.facility.delete({ where: { id } });
  }

  createTrainer(dto: CreateTrainerDto) {
    return this.prisma.trainer.create({ data: dto });
  }

  updateTrainer(id: string, dto: UpdateTrainerDto) {
    return this.prisma.trainer.update({ where: { id }, data: dto });
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

  updateSection(id: string, dto: UpdateSectionDto) {
    return this.prisma.sportSection.update({
      where: { id },
      data: dto,
      include: { facility: true, trainer: true },
    });
  }

  deleteSection(id: string) {
    return this.prisma.sportSection.delete({ where: { id } });
  }

  getAllSlots() {
    return this.prisma.scheduleSlot.findMany({
      include: {
        section: { select: { id: true, title: true } },
      },
      orderBy: { startTime: 'asc' },
    });
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

  updateSlot(id: string, dto: UpdateSlotDto) {
    return this.prisma.scheduleSlot.update({
      where: { id },
      data: {
        sectionId: dto.sectionId,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        availableSpots: dto.availableSpots,
      },
    });
  }

  deleteSlot(id: string) {
    return this.prisma.scheduleSlot.delete({ where: { id } });
  }

  getAllPromotions() {
    return this.prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async publishPromotion(dto: CreatePromotionDto) {
    const promo = await this.prisma.promotion.create({
      data: {
        title: dto.title,
        description: dto.description,
        discountPercent: dto.discountPercent,
        targetScope: dto.targetScope,
        targetSportType: dto.targetScope === PromotionTarget.SPORT_TYPE ? dto.targetSportType : null,
        validUntil: new Date(dto.validUntil),
      },
    });

    await this.notificationManager.notify('PROMOTION_PUBLISHED', {
      broadcastAll: true,
      title: `Акція: ${promo.title} (-${promo.discountPercent}%)`,
      message: promo.description,
    });

    return promo;
  }

  updatePromotion(id: string, dto: UpdatePromotionDto) {
    return this.prisma.promotion.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        discountPercent: dto.discountPercent,
        targetScope: dto.targetScope,
        targetSportType:
          dto.targetScope !== undefined
            ? dto.targetScope === PromotionTarget.SPORT_TYPE
              ? dto.targetSportType ?? null
              : null
            : dto.targetSportType,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
    });
  }

  deletePromotion(id: string) {
    return this.prisma.promotion.delete({ where: { id } });
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