import { Module } from '@nestjs/common';
import { LoyaltyCardFactory } from './factory/loyalty-card.factory';
import { MembershipFactory } from './factory/membership.factory';
import {
  BonusAccrualObserver,
  EmailReminderNotifier,
  InAppNotifier,
  NotificationManager,
} from './observer/notification.observer';
import { BookingFacade } from './facade/booking.facade';
import { TrainingReminderService } from './observer/training-reminder.service';

@Module({
  providers: [
    LoyaltyCardFactory,
    MembershipFactory,
    InAppNotifier,
    EmailReminderNotifier,
    BonusAccrualObserver,
    NotificationManager,
    TrainingReminderService,
    BookingFacade,
  ],
  exports: [
    LoyaltyCardFactory,
    MembershipFactory,
    NotificationManager,
    TrainingReminderService,
    BookingFacade,
  ],
})
export class PatternsModule {}