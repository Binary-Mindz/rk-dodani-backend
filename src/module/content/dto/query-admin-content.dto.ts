import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ContentAccessModel,
  ContentVisibility,
  PublishStatus,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class QueryAdminContentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PublishStatus })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ApiPropertyOptional({ enum: ContentVisibility })
  @IsOptional()
  @IsEnum(ContentVisibility)
  visibility?: ContentVisibility;

  @ApiPropertyOptional({ enum: ContentAccessModel })
  @IsOptional()
  @IsEnum(ContentAccessModel)
  accessModel?: ContentAccessModel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contentTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}