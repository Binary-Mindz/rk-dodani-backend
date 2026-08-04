import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { PrimaryFocusArea, ServiceSubmissionStatus } from '@prisma/client';

export class UpdateServiceSubmissionDto {
  @ApiPropertyOptional({ description: 'Requester full name' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Corporate email for contact' })
  @IsEmail()
  @IsOptional()
  corporateEmail?: string;

  @ApiPropertyOptional({ description: 'Primary focus area', enum: PrimaryFocusArea })
  @IsEnum(PrimaryFocusArea)
  @IsOptional()
  primaryFocusArea?: PrimaryFocusArea;

  @ApiPropertyOptional({ description: 'Optional request message' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ description: 'Submission status', enum: ServiceSubmissionStatus })
  @IsEnum(ServiceSubmissionStatus)
  @IsOptional()
  status?: ServiceSubmissionStatus;

  @ApiPropertyOptional({ description: 'Admin notes for the submission' })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
