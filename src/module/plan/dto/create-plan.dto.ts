import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BillingInterval,
  BillingProvider,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @ApiProperty({
    example: 'PREMIUM_MONTHLY',
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({
    example: 'Premium Monthly',
  })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    example: 'Access to premium research and subscriber-only insights',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    enum: BillingProvider,
    default: BillingProvider.STRIPE,
  })
  @IsOptional()
  @IsEnum(BillingProvider)
  billingProvider?: BillingProvider;

  @ApiPropertyOptional({
    example: 'prod_ABC123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  stripeProductId?: string;

  @ApiPropertyOptional({
    example: 'price_ABC123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  stripePriceId?: string;

  @ApiProperty({
    enum: BillingInterval,
    example: BillingInterval.MONTHLY,
  })
  @IsEnum(BillingInterval)
  billingInterval!: BillingInterval;

  @ApiProperty({
    example: 'USD',
  })
  @IsString()
  @MaxLength(10)
  currency!: string;

  @ApiProperty({
    example: 29.99,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceAmount!: number;

  @ApiPropertyOptional({
    example: 7,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    example: [
      'Premium research access',
      'Whitepapers and reports',
      'Subscriber-only insights',
    ],
  })
  @IsOptional()
  features?: any;

  @ApiPropertyOptional({
    example: {
      badge: 'Most Popular',
      theme: 'dark',
    },
  })
  @IsOptional()
  metadata?: any;
}