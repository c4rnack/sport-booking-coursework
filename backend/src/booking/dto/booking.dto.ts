import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipType } from '@prisma/client';
import { IsArray, IsEnum, IsIn, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ description: 'UUID часового слота' })
  @IsUUID()
  slotId: string;

  @ApiPropertyOptional({
    example: ['equipment', 'pool'],
    isArray: true,
    enum: ['equipment', 'pool', 'trainer'],
  })
  @IsOptional()
  @IsArray()
  @IsIn(['equipment', 'pool', 'trainer'], { each: true })
  addons?: ('equipment' | 'pool' | 'trainer')[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  useBonusPoints?: boolean;
}

export class PurchaseMembershipDto {
  @ApiProperty({ enum: MembershipType, example: MembershipType.MONTHLY })
  @IsEnum(MembershipType)
  type: MembershipType;

  @ApiPropertyOptional({ example: 'TechCorp Lviv' })
  @IsOptional()
  @IsString()
  companyName?: string;
}