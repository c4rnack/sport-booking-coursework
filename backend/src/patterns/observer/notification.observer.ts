import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface NotificationPayload {
  userId?: string;
  email?: string;
  title: string;
  message: string;
  earnedPoints?: number;
  broadcastAll?: boolean;
}

export interface IObserver {
  update(event: string, payload: NotificationPayload): Promise<void>;
}

export interface ISubject {
  subscribe(event: string, observer: IObserver): void;
  unsubscribe(event: string, observer: IObserver): void;
  notify(event: string, payload: NotificationPayload): Promise<void>;
}

@Injectable()
export class InAppNotifier implements IObserver {
  constructor(private readonly prisma: PrismaService) {}

  async update(event: string, payload: NotificationPayload): Promise<void> {
    if (payload.broadcastAll) {
      const users = await this.prisma.user.findMany({ select: { id: true } });
      await this.prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          eventType: event,
          title: payload.title,
          message: payload.message,
        })),
      });
      return;
    }

    if (payload.userId) {
      await this.prisma.notification.create({
        data: {
          userId: payload.userId,
          eventType: event,
          title: payload.title,
          message: payload.message,
        },
      });
    }
  }
}

@Injectable()
export class EmailReminderNotifier implements IObserver {
  private readonly logger = new Logger(EmailReminderNotifier.name);

  async update(event: string, payload: NotificationPayload): Promise<void> {
    const recipient = payload.broadcastAll ? 'ALL_SUBSCRIBERS' : payload.email ?? payload.userId;
    this.logger.log(`[EMAIL -> ${recipient}] (${event}) ${payload.title}: ${payload.message}`);
  }
}

@Injectable()
export class BonusAccrualObserver implements IObserver {
  constructor(private readonly prisma: PrismaService) {}

  async update(event: string, payload: NotificationPayload): Promise<void> {
    if (event !== 'BOOKING_CONFIRMED' || !payload.userId || !payload.earnedPoints) return;

    await this.prisma.user.update({
      where: { id: payload.userId },
      data: { bonusPoints: { increment: payload.earnedPoints } },
    });

    await this.prisma.notification.create({
      data: {
        userId: payload.userId,
        eventType: 'BONUS_ACCRUED',
        title: 'Нараховано бонусні бали',
        message: `Ви отримали +${payload.earnedPoints} бонусних балів за бронювання!`,
      },
    });
  }
}

@Injectable()
export class NotificationManager implements ISubject, OnModuleInit {
  private readonly listeners = new Map<string, IObserver[]>();

  constructor(
    private readonly inAppNotifier: InAppNotifier,
    private readonly emailReminderNotifier: EmailReminderNotifier,
    private readonly bonusAccrualObserver: BonusAccrualObserver,
  ) {}

  onModuleInit() {
    this.subscribe('BOOKING_CONFIRMED', this.inAppNotifier);
    this.subscribe('BOOKING_CONFIRMED', this.emailReminderNotifier);
    this.subscribe('BOOKING_CONFIRMED', this.bonusAccrualObserver);

    this.subscribe('BOOKING_CANCELLED', this.inAppNotifier);
    this.subscribe('MEMBERSHIP_PURCHASED', this.inAppNotifier);

    this.subscribe('PROMOTION_PUBLISHED', this.inAppNotifier);
    this.subscribe('PROMOTION_PUBLISHED', this.emailReminderNotifier);
  }

  subscribe(event: string, observer: IObserver): void {
    const list = this.listeners.get(event) ?? [];
    if (!list.includes(observer)) {
      list.push(observer);
      this.listeners.set(event, list);
    }
  }

  unsubscribe(event: string, observer: IObserver): void {
    const list = this.listeners.get(event) ?? [];
    this.listeners.set(event, list.filter((obs) => obs !== observer));
  }

  async notify(event: string, payload: NotificationPayload): Promise<void> {
    const observers = this.listeners.get(event) ?? [];
    await Promise.all(observers.map((obs) => obs.update(event, payload)));
  }
}