import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IndustryTarget,
  InsightContentType,
  InsightStatus,
  InsightVisibility,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryInsightDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'AI Leadership' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: InsightStatus })
  @IsOptional()
  @IsEnum(InsightStatus)
  status?: InsightStatus;

  @ApiPropertyOptional({ enum: InsightVisibility })
  @IsOptional()
  @IsEnum(InsightVisibility)
  visibility?: InsightVisibility;

  @ApiPropertyOptional({ enum: InsightContentType })
  @IsOptional()
  @IsEnum(InsightContentType)
  contentType?: InsightContentType;

  @ApiPropertyOptional({ enum: IndustryTarget })
  @IsOptional()
  @IsEnum(IndustryTarget)
  industry?: IndustryTarget;

  @ApiPropertyOptional({ example: 'uuid-category' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: '#AI2026' })
  @IsOptional()
  @IsString()
  tag?: string;
}
