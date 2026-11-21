import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guards';
import { AdminService } from './admin.service';
import {
  CreateFacilityDto,
  CreatePromotionDto,
  CreateSectionDto,
  CreateSlotDto,
  CreateTrainerDto,
  UpdateBookingStatusDto,
  UpdateUserLoyaltyDto,
} from './dto/admin.dto';

@ApiTags('Admin Panel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('facilities')
  createFacility(@Body() dto: CreateFacilityDto) {
    return this.adminService.createFacility(dto);
  }

  @Delete('facilities/:id')
  deleteFacility(@Param('id') id: string) {
    return this.adminService.deleteFacility(id);
  }

  @Post('trainers')
  createTrainer(@Body() dto: CreateTrainerDto) {
    return this.adminService.createTrainer(dto);
  }

  @Delete('trainers/:id')
  deleteTrainer(@Param('id') id: string) {
    return this.adminService.deleteTrainer(id);
  }

  @Post('sections')
  createSection(@Body() dto: CreateSectionDto) {
    return this.adminService.createSection(dto);
  }

  @Delete('sections/:id')
  deleteSection(@Param('id') id: string) {
    return this.adminService.deleteSection(id);
  }

  @Post('slots')
  createSlot(@Body() dto: CreateSlotDto) {
    return this.adminService.createSlot(dto);
  }

  @Post('promotions')
  publishPromotion(@Body() dto: CreatePromotionDto) {
    return this.adminService.publishPromotion(dto);
  }

  @Get('bookings')
  getAllBookings() {
    return this.adminService.getAllBookings();
  }

  @Patch('bookings/:id/status')
  updateBookingStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.adminService.updateBookingStatus(id, dto.status);
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/loyalty')
  updateUserLoyalty(@Param('id') id: string, @Body() dto: UpdateUserLoyaltyDto) {
    return this.adminService.updateUserLoyaltyTier(id, dto.loyaltyTier);
  }
}