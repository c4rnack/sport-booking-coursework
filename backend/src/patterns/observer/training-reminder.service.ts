import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationManager } from './notification.observer';

@Injectable()
export class TrainingReminderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationManager: NotificationManager,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendUpcomingReminders() {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcoming = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        reminderSent: false,
        slot: { startTime: { gte: now, lte: in24Hours } },
      },
      include: { user: true, section: { include: { facility: true } }, slot: true },
    });

    for (const b of upcoming) {
      await this.notificationManager.notify('TRAINING_REMINDER', {
        userId: b.userId,
        email: b.user.email,
        title: 'Нагадування про майбутнє тренування',
        message: `Вже скоро "${b.section.title}" у ${b.section.facility.name} (${b.slot.startTime.toLocaleString('uk-UA')}).`,
      });

      await this.prisma.booking.update({
        where: { id: b.id },
        data: { reminderSent: true },
      });
    }

    return { sentCount: upcoming.length };
  }
}