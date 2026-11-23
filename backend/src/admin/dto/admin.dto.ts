import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus, LoyaltyTier, PromotionTarget } from '@prisma/client';
import {
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateFacilityDto {
  @ApiProperty({ example: 'Олімпійський Басейн' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'вул. Спортивна, 14' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'swimming' })
  @IsString()
  sportType: string;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({ example: 450 })
  @IsNumber()
  @Min(0)
  baseHourlyRate: number;
}

export class CreateTrainerDto {
  @ApiProperty({ example: 'Дмитро Бондар' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'Плавання / Кросфіт' })
  @IsString()
  specialization: string;

  @ApiProperty({ example: 4.8 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
}

export class CreateSectionDto {
  @ApiProperty({ example: 'Ранкове плавання' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'swimming' })
  @IsString()
  sportType: string;

  @ApiProperty({ example: 'beginner' })
  @IsString()
  skillLevel: string;

  @ApiProperty({ example: 'adult' })
  @IsString()
  ageCategory: string;

  @ApiProperty({ example: 400 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty()
  @IsUUID()
  facilityId: string;

  @ApiProperty()
  @IsUUID()
  trainerId: string;
}

export class CreateSlotDto {
  @ApiProperty()
  @IsUUID()
  sectionId: string;

  @ApiProperty({ example: '2026-11-25T10:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-11-25T11:30:00.000Z' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(1)
  availableSpots: number;
}

export class CreatePromotionDto {
  @ApiProperty({ example: 'Зимова знижка на йогу' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Отримайте -20% на всі вечірні тренування до кінця місяця!' })
  @IsString()
  description: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(1)
  @Max(90)
  discountPercent: number;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z' })
  @IsDateString()
  validUntil: string;

  @ApiProperty({ enum: PromotionTarget, example: PromotionTarget.SPORT_TYPE })
  @IsEnum(PromotionTarget)
  targetScope: PromotionTarget;

  @ApiPropertyOptional({ example: 'swimming' })
  @IsOptional()
  @IsString()
  targetSportType?: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}

export class UpdateUserLoyaltyDto {
  @ApiProperty({ enum: LoyaltyTier })
  @IsEnum(LoyaltyTier)
  loyaltyTier: LoyaltyTier;
}