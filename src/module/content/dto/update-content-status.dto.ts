import { ApiProperty } from '@nestjs/swagger';
import { PublishStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateContentStatusDto {
  @ApiProperty({ enum: PublishStatus })
  @IsEnum(PublishStatus)
  status!: PublishStatus;
}