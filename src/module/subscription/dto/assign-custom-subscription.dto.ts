import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingInterval, EntitlementType, PlanAudience } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AssignCustomSubscriptionDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({
    description: 'Display title of the custom plan',
    example: 'Enterprise Starter',
  })
  @IsString()
  @IsOptional()
  planTitle?: string;

  @ApiPropertyOptional({
    enum: BillingInterval,
    default: BillingInterval.MONTHLY,
    description: 'Billing interval for the custom plan',
  })
  @IsEnum(BillingInterval)
  @IsOptional()
  billingInterval?: BillingInterval;

  @ApiPropertyOptional({
    description: 'Custom price (for record only)',
    example: 49.99,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  customPrice?: number;

  @ApiPropertyOptional({ description: 'Custom currency', example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Trial period in days for the custom plan',
    example: 14,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  trialDays?: number;

  @ApiPropertyOptional({
    description: 'Whether the custom plan should auto-renew',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional({
    enum: EntitlementType,
    default: EntitlementType.PREMIUM_ACCESS,
  })
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

  @ApiPropertyOptional({
    description: 'Admin note for this custom assignment',
    example: 'Special client - 3 month deal',
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    description: 'Number of seats',
    example: 1,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  seats?: number;
}
