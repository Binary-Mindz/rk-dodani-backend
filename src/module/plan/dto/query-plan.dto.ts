import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { BillingProvider, BillingInterval, PlanAudience } from '@prisma/client';
import { Transform } from 'class-transformer';

export class QueryPlanDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PlanAudience)
  targetAudience?: PlanAudience; // Allows filtering by B2C or B2B

  @IsOptional()
  @IsEnum(BillingProvider)
  billingProvider?: BillingProvider;

  @IsOptional()
  @IsEnum(BillingInterval)
  billingInterval?: BillingInterval;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;
}