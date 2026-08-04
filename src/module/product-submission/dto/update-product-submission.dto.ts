import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductSubmissionStatus, TargetDeployTimeline } from '@prisma/client';

export class UpdateProductSubmissionDto {
  @ApiPropertyOptional({ description: 'Full name of the requester' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Corporate email address' })
  @IsEmail()
  @IsOptional()
  corporateEmail?: string;

  @ApiPropertyOptional({ description: 'Company / institution name' })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ description: 'Target deploy timeline', enum: TargetDeployTimeline })
  @IsEnum(TargetDeployTimeline)
  @IsOptional()
  targetDeployTimeline?: TargetDeployTimeline;

  @ApiPropertyOptional({ description: 'Use case / architectural requirements' })
  @IsString()
  @IsOptional()
  useCase?: string;

  @ApiPropertyOptional({ description: 'Submission status', enum: ProductSubmissionStatus })
  @IsOptional()
  status?: ProductSubmissionStatus;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
