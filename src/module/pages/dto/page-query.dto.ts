import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageType, PublishStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, Min } from 'class-validator';

export class PageQueryDto {
  @ApiPropertyOptional({ enum: PageType })
  @IsOptional()
  @IsEnum(PageType)
  pageType?: PageType;

  @ApiPropertyOptional({ enum: PublishStatus })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;
}