import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ProductSubmissionStatus, TargetDeployTimeline } from '@prisma/client';

export class QueryProductSubmissionDto {
  @ApiPropertyOptional({
    description: 'Search terms for name, email, company, or use case',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by submission status',
    enum: ProductSubmissionStatus,
  })
  @IsEnum(ProductSubmissionStatus)
  @IsOptional()
  status?: ProductSubmissionStatus;

  @ApiPropertyOptional({
    description: 'Filter by target deploy timeline',
    enum: TargetDeployTimeline,
  })
  @IsEnum(TargetDeployTimeline)
  @IsOptional()
  targetDeployTimeline?: TargetDeployTimeline;

  @ApiPropertyOptional({ description: 'Filter by product ID' })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
