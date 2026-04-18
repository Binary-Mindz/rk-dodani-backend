import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  WebhookProcessingStatus,
  WebhookProvider,
} from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryWebhookLogDto {
  @ApiPropertyOptional({ enum: WebhookProvider })
  @IsOptional()
  @IsEnum(WebhookProvider)
  provider?: WebhookProvider;

  @ApiPropertyOptional({ enum: WebhookProcessingStatus })
  @IsOptional()
  @IsEnum(WebhookProcessingStatus)
  processingStatus?: WebhookProcessingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}