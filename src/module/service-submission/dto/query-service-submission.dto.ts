import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Filter by service ID' })
  @IsUUID()
  @IsOptional()
  serviceId?: string;

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
