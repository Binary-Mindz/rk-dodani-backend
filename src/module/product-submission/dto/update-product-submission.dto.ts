import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductSubmissionStatus } from '@prisma/client';

export class UpdateProductSubmissionDto {
  @ApiPropertyOptional({ description: 'Submission status', enum: ProductSubmissionStatus })
  @IsOptional()
  status?: ProductSubmissionStatus;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
