import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentAssetRole } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class QueryContentAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contentItemId?: string;

  @ApiPropertyOptional({ enum: ContentAssetRole })
  @IsOptional()
  @IsEnum(ContentAssetRole)
  assetRole?: ContentAssetRole;
}