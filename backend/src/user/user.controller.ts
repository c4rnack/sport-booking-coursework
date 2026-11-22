import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `avatar-${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Дозволені лише зображення (PNG, JPG, WEBP)'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 3 * 1024 * 1024 }, // до 3 МБ
    }),
  )
  uploadAvatar(@CurrentUser() user: JwtUserPayload, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не передано');
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateProfile(user.userId, { avatarUrl });
  }
}