import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ProductSubmissionStatus, TargetDeployTimeline } from '@prisma/client';

export class QueryProductSubmissionDto {
  @ApiPropertyOptional({ description: 'Search terms for name, email, company, or use case' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by submission status', enum: ProductSubmissionStatus })
  @IsEnum(ProductSubmissionStatus)
  @IsOptional()
  status?: ProductSubmissionStatus;

  @ApiPropertyOptional({ description: 'Filter by target deploy timeline', enum: TargetDeployTimeline })
  @IsEnum(TargetDeployTimeline)
  @IsOptional()
  targetDeployTimeline?: TargetDeployTimeline;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
