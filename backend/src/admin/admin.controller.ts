import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guards';
import { TrainingReminderService } from '../patterns/observer/training-reminder.service';
import { AdminService } from './admin.service';
import {
  CreateFacilityDto,
  CreatePromotionDto,
  CreateSectionDto,
  CreateSlotDto,
  CreateTrainerDto,
  UpdateBookingStatusDto,
  UpdateFacilityDto,
  UpdatePromotionDto,
  UpdateSectionDto,
  UpdateSlotDto,
  UpdateTrainerDto,
  UpdateUserLoyaltyDto,
} from './dto/admin.dto';

@ApiTags('Admin Panel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly trainingReminderService: TrainingReminderService,
  ) {}

  @Post('facilities')
  createFacility(@Body() dto: CreateFacilityDto) {
    return this.adminService.createFacility(dto);
  }

  @Patch('facilities/:id')
  updateFacility(@Param('id') id: string, @Body() dto: UpdateFacilityDto) {
    return this.adminService.updateFacility(id, dto);
  }

  @Delete('facilities/:id')
  deleteFacility(@Param('id') id: string) {
    return this.adminService.deleteFacility(id);
  }

  @Post('trainers')
  createTrainer(@Body() dto: CreateTrainerDto) {
    return this.adminService.createTrainer(dto);
  }

  @Patch('trainers/:id')
  updateTrainer(@Param('id') id: string, @Body() dto: UpdateTrainerDto) {
    return this.adminService.updateTrainer(id, dto);
  }

  @Delete('trainers/:id')
  deleteTrainer(@Param('id') id: string) {
    return this.adminService.deleteTrainer(id);
  }

  @Post('sections')
  createSection(@Body() dto: CreateSectionDto) {
    return this.adminService.createSection(dto);
  }

  @Patch('sections/:id')
  updateSection(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.adminService.updateSection(id, dto);
  }

  @Delete('sections/:id')
  deleteSection(@Param('id') id: string) {
    return this.adminService.deleteSection(id);
  }

  @Get('slots')
  getAllSlots() {
    return this.adminService.getAllSlots();
  }

  @Post('slots')
  createSlot(@Body() dto: CreateSlotDto) {
    return this.adminService.createSlot(dto);
  }

  @Patch('slots/:id')
  updateSlot(@Param('id') id: string, @Body() dto: UpdateSlotDto) {
    return this.adminService.updateSlot(id, dto);
  }

  @Delete('slots/:id')
  deleteSlot(@Param('id') id: string) {
    return this.adminService.deleteSlot(id);
  }

  @Get('promotions')
  getAllPromotions() {
    return this.adminService.getAllPromotions();
  }

  @Post('promotions')
  publishPromotion(@Body() dto: CreatePromotionDto) {
    return this.adminService.publishPromotion(dto);
  }

  @Patch('promotions/:id')
  updatePromotion(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.adminService.updatePromotion(id, dto);
  }

  @Delete('promotions/:id')
  deletePromotion(@Param('id') id: string) {
    return this.adminService.deletePromotion(id);
  }

  @Post('reminders/trigger')
  triggerReminders() {
    return this.trainingReminderService.sendUpcomingReminders();
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