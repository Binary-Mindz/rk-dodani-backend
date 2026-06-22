import { ApiPropertyOptional } from '@nestjs/swagger';
import { BillingProvider, BillingInterval, PlanAudience } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsEnum, IsString, IsBoolean, IsInt, Min } from 'class-validator';

export class QueryPlanDto {
  @ApiPropertyOptional({
    description: 'Search by plan name, code, or description',
    example: 'Premium',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter plans by target audience (B2C for students, B2B for enterprises)',
    enum: PlanAudience,
    example: PlanAudience.B2C,
  })
  @IsOptional()
  @IsEnum(PlanAudience)
  targetAudience?: PlanAudience;

  @ApiPropertyOptional({
    description: 'Filter plans by billing infrastructure provider',
    enum: BillingProvider,
    example: BillingProvider.STRIPE,
  })
  @IsOptional()
  @IsEnum(BillingProvider)
  billingProvider?: BillingProvider;

  @ApiPropertyOptional({
    description: 'Filter plans by recurrence interval',
    enum: BillingInterval,
    example: BillingInterval.MONTHLY,
  })
  @IsOptional()
  @IsEnum(BillingInterval)
  billingInterval?: BillingInterval;

  @ApiPropertyOptional({
    description: 'Filter by visibility status (true for public plans, false for hidden/custom tiers)',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by operational status (active vs deactivated plans)',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Pagination page number',
    type: Number,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    type: Number,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}