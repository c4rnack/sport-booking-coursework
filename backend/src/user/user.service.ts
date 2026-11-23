import { Injectable, NotFoundException } from '@nestjs/common';
import { LoyaltyCardFactory } from '../patterns/factory/loyalty-card.factory';
import { MembershipFactory } from '../patterns/factory/membership.factory';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyCardFactory: LoyaltyCardFactory,
    private readonly membershipFactory: MembershipFactory,
) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        preferences: true,
        bonusPoints: true,
        role: true,
        loyaltyTier: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const card = this.loyaltyCardFactory.createCard(user.loyaltyTier);
    const now = new Date();
    const activeList = await this.prisma.membership.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { price: 'desc' },
    });
    const activeRec = activeList.find((m) => m.type !== 'SINGLE' || (m.visitsLeft ?? 0) > 0) ?? null;
    const activeModel = activeRec ? this.membershipFactory.createMembership(activeRec.type) : null;

    return {
      ...user,
      loyaltyBenefits: {
        tierName: card.getTierName(),
        freePoolAccess: card.hasFreePoolAccess(),
      },
      activeMembership: activeRec && activeModel
        ? {
            id: activeRec.id,
            type: activeRec.type,
            visitsLeft: activeRec.visitsLeft,
            expiresAt: activeRec.expiresAt,
            coversBaseSession: activeModel.coversBaseSession(),
            coversEquipment: activeModel.coversEquipment(),
            coversPool: activeModel.coversPool(),
            benefits: activeModel.getBenefits(),
          }
        : null,
    };
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        preferences: true,
        bonusPoints: true,
        loyaltyTier: true,
      },
    });
  }

  getBookingHistory(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        section: { include: { facility: true, trainer: true } },
        slot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getMemberships(userId: string) {
    return this.prisma.membership.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markNotificationRead(userId: string, notificationId: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notif) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
}