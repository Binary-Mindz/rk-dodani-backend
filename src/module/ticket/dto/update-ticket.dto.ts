import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { InquiryStatus, InquiryPriority } from '@prisma/client';

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: InquiryStatus, example: InquiryStatus.REVIEWED })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;

  @ApiPropertyOptional({ enum: InquiryPriority, example: InquiryPriority.HIGH })
  @IsOptional()
  @IsEnum(InquiryPriority)
  priority?: InquiryPriority;

  @ApiPropertyOptional({ description: 'Admin reply or resolution message', example: 'We have resolved the gateway issue.' })
  @IsOptional()
  @IsString()
  replyMessage?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization', example: ['Billing Issue', 'Tier 1'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}