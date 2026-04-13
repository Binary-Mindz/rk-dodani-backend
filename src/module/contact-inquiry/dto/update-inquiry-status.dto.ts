import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InquiryStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateInquiryStatusDto {
  @ApiProperty({ enum: InquiryStatus })
  @IsEnum(InquiryStatus)
  status!: InquiryStatus;

  @ApiPropertyOptional({ example: 'Marked as qualified after review' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}