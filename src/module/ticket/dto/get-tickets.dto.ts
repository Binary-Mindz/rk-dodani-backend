import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { InquiryStatus, InquiryPriority } from '@prisma/client';

export class GetTicketsDto {
  @ApiPropertyOptional({ 
    description: 'Page number for pagination', 
    default: 1,
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ 
    description: 'Number of items per page', 
    default: 10,
    example: 10 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ 
    description: 'Search filter by User Name, Email, or Ticket Subject',
    example: 'Sarah Chen'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    enum: InquiryStatus, 
    description: 'Filter tickets by database status enum',
    example: InquiryStatus.NEW // অথবা 'NEW', 'REVIEWED', 'CLOSED' ইত্যাদি
  })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;

  @ApiPropertyOptional({ 
    enum: InquiryPriority, 
    description: 'Filter tickets by priority level',
    example: InquiryPriority.HIGH // 'LOW', 'NORMAL', 'HIGH', 'URGENT'
  })
  @IsOptional()
  @IsEnum(InquiryPriority)
  priority?: InquiryPriority;
}