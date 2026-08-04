import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PrimaryFocusArea, ServiceSubmissionStatus } from '@prisma/client';

export class QueryServiceSubmissionDto {
  @ApiPropertyOptional({ description: 'Search terms for name, email, or message' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by submission status', enum: ServiceSubmissionStatus })
  @IsEnum(ServiceSubmissionStatus)
  @IsOptional()
  status?: ServiceSubmissionStatus;

  @ApiPropertyOptional({
    description: 'Filter by primary focus area',
    enum: PrimaryFocusArea,
  })
  @IsEnum(PrimaryFocusArea)
  @IsOptional()
  primaryFocusArea?: PrimaryFocusArea;

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
