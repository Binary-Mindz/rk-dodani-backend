import { ApiProperty } from '@nestjs/swagger';
import { InsightStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateInsightStatusDto {
  @ApiProperty({ enum: InsightStatus })
  @IsEnum(InsightStatus)
  status!: InsightStatus;
}
