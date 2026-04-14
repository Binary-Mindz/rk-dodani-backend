import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class QueryPublicPageDto {
  @ApiPropertyOptional({ enum: PageType })
  @IsOptional()
  @IsEnum(PageType)
  pageType?: PageType;
}