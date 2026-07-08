import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingInterval, BillingProvider, PlanAudience } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsNumber,
  IsNotEmpty,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @ApiProperty({
    description: 'Unique identifier code for the plan. System prevents duplicate creation.',
    example: 'SOLO_PROF_MONTHLY',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({
    description: 'Name of the plan displayed on the pricing cards.',
    example: 'Solo Professional Plan',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    description: 'Subtitle or brief description context.',
    example: 'For Independent Professionals & Researchers',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    enum: PlanAudience,
    description: 'Target segment: B2C (Student, Solo Prof) or B2B (SMB, Enterprise)',
    default: PlanAudience.B2C,
    example: PlanAudience.B2C,
  })
  @IsOptional()
  @IsEnum(PlanAudience)
  targetAudience?: PlanAudience;

  @ApiPropertyOptional({
    enum: BillingProvider,
    default: BillingProvider.STRIPE,
  })
  @IsOptional()
  @IsEnum(BillingProvider)
  billingProvider?: BillingProvider;

  @ApiProperty({
    enum: BillingInterval,
    example: BillingInterval.MONTHLY,
  })
  @IsEnum(BillingInterval)
  billingInterval!: BillingInterval;

  @ApiProperty({
    description: 'Currency code ISO.',
    example: 'USD',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  currency!: string;

  @ApiProperty({
    description: 'Exact retail price of the plan.',
    example: 29.99,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceAmount!: number;

  @ApiPropertyOptional({
    description: 'Determines if the tier is priced flat-rate or dynamically scaled per workspace seat.',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPerUser?: boolean;

  @ApiPropertyOptional({
    description: 'Trial period days context.',
    default: 14,
    example: 14,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Applies "Most Popular" or special highlighted CSS wrapper tags on UI client.',
    default: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'List of feature benefits bundled inside the plan.',
    type: [String],
    example: [
      'Premium Whitepapers & Reports',
      'Research Library Access',
      'Personal Analytics Dashboard',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    example: { badge: 'Most Popular', theme: 'premium' },
  })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({
    description: 'Maximum user capacity for B2B seats.',
    default: 1,
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @ApiPropertyOptional({
    description: 'Subtitle context description.',
    example: 'Ideal for teams',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @ApiPropertyOptional({
    description: 'Optional separate price for monthly subscription choice.',
    example: 19.99,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceAmountMonthly?: number;

  @ApiPropertyOptional({
    description: 'Optional separate price for yearly subscription choice.',
    example: 199.99,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceAmountYearly?: number;
}