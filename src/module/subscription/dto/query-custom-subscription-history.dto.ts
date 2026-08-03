import { ApiPropertyOptional } from '@nestjs/swagger';
import { BillingInterval, CustomSubscriptionAssignmentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryCustomSubscriptionHistoryDto {
  @ApiPropertyOptional({ description: 'Search by user email/name, plan name, checkout session, or note' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: BillingInterval })
  @IsEnum(BillingInterval)
  @IsOptional()
  billingInterval?: BillingInterval;

  @ApiPropertyOptional({ enum: CustomSubscriptionAssignmentStatus })
  @IsEnum(CustomSubscriptionAssignmentStatus)
  @IsOptional()
  status?: CustomSubscriptionAssignmentStatus;

  @ApiPropertyOptional({ description: 'Assigned user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Admin user ID who assigned the custom subscription' })
  @IsString()
  @IsOptional()
  assignedBy?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
