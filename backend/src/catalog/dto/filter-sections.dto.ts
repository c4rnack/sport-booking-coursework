import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterSectionsDto {
  @ApiPropertyOptional({ example: 'yoga' })
  @IsOptional()
  @IsString()
  sportType?: string;

  @ApiPropertyOptional({ example: 'beginner' })
  @IsOptional()
  @IsString()
  skillLevel?: string;

  @ApiPropertyOptional({ example: 'adult' })
  @IsOptional()
  @IsString()
  ageCategory?: string;
}