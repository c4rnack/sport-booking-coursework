import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/auth.decorators';
import type { JwtUserPayload } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

@ApiTags('User Cabinet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get('me')
  getProfile(@CurrentUser() user: JwtUserPayload) {
    return this.usersService.getProfile(user.userId);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: JwtUserPayload, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Get('me/bookings')
  getBookings(@CurrentUser() user: JwtUserPayload) {
    return this.usersService.getBookingHistory(user.userId);
  }

  @Get('me/memberships')
  getMemberships(@CurrentUser() user: JwtUserPayload) {
    return this.usersService.getMemberships(user.userId);
  }

  @Get('me/notifications')
  getNotifications(@CurrentUser() user: JwtUserPayload) {
    return this.usersService.getNotifications(user.userId);
  }

  @Patch('me/notifications/:id/read')
  markRead(@CurrentUser() user: JwtUserPayload, @Param('id') id: string) {
    return this.usersService.markNotificationRead(user.userId, id);
  }
}