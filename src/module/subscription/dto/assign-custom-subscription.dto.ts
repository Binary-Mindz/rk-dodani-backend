import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntitlementType, PlanAudience } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AssignCustomSubscriptionDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'Custom price (for record only)', example: 49.99 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  customPrice?: number;

  @ApiPropertyOptional({ description: 'Custom currency', example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Subscription end date', example: '2025-12-31' })
  @IsDateString()
  endsAt: string;

  @ApiPropertyOptional({ enum: EntitlementType, default: EntitlementType.PREMIUM_ACCESS })
  @IsEnum(EntitlementType)
  @IsOptional()
  entitlementType?: EntitlementType;

  @ApiPropertyOptional({
    enum: PlanAudience,
    default: PlanAudience.B2C,
    description: 'B2C → STUDENT role, B2B → ENTERPRISE role',
  })
  @IsEnum(PlanAudience)
  @IsOptional()
  targetAudience?: PlanAudience;

  @ApiPropertyOptional({ description: 'Admin note for this custom assignment', example: 'Special client - 3 month deal' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ description: 'Number of seats', example: 1, default: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  seats?: number;
}
