import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ActivityActionType, ContentProgressStatus } from '@prisma/client';

export class TrackProgressDto {
  @ApiProperty({ description: 'Duration spent in seconds' })
  @IsNumber()
  durationSec: number;

  @ApiProperty({ description: 'Progress percentage (0-100)', required: false })
  @IsNumber()
  @IsOptional()
  progressPercentage?: number;

  @ApiProperty({ enum: ContentProgressStatus, required: false })
  @IsEnum(ContentProgressStatus)
  @IsOptional()
  status?: ContentProgressStatus;

  @ApiProperty({ enum: ActivityActionType, required: false })
  @IsEnum(ActivityActionType)
  @IsOptional()
  actionType?: ActivityActionType;
}
