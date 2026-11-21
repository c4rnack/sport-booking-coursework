import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/auth.decorators';
import type { JwtUserPayload } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { BookingFacade } from '../patterns/facade/booking.facade';
import { CreateBookingDto, PurchaseMembershipDto } from './dto/booking.dto';

@ApiTags('Bookings & Memberships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingFacade: BookingFacade) {}

  @Post()
  createAndPayBooking(@CurrentUser() user: JwtUserPayload, @Body() dto: CreateBookingDto) {
    return this.bookingFacade.createAndPayBooking(user.userId, dto);
  }

  @Patch(':id/cancel')
  cancelBooking(@CurrentUser() user: JwtUserPayload, @Param('id') bookingId: string) {
    return this.bookingFacade.cancelBooking(bookingId, user.userId);
  }

  @Post('memberships')
  purchaseMembership(@CurrentUser() user: JwtUserPayload, @Body() dto: PurchaseMembershipDto) {
    return this.bookingFacade.purchaseMembership(user.userId, dto.type, dto.companyName);
  }
}