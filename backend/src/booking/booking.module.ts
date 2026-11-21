import { Module } from '@nestjs/common';
import { PatternsModule } from '../patterns/patterns.module';
import { BookingController } from './booking.controller';

@Module({
  imports: [PatternsModule],
  controllers: [BookingController],
})
export class BookingModule {}