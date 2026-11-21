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

@Module({
  providers: [
    LoyaltyCardFactory,
    MembershipFactory,
    InAppNotifier,
    EmailReminderNotifier,
    BonusAccrualObserver,
    NotificationManager,
    BookingFacade,
  ],
  exports: [
    LoyaltyCardFactory,
    MembershipFactory,
    NotificationManager,
    BookingFacade,
  ],
})
export class PatternsModule {}