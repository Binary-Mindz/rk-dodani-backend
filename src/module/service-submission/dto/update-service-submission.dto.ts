import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ServiceSubmissionStatus } from '@prisma/client';

export class UpdateServiceSubmissionDto {
  @ApiPropertyOptional({
    description: 'Submission status',
    enum: ServiceSubmissionStatus,
  })
  @IsEnum(ServiceSubmissionStatus)
  @IsOptional()
  status?: ServiceSubmissionStatus;

  @ApiPropertyOptional({ description: 'Admin notes for the submission' })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
