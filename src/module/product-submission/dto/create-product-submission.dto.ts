import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TargetDeployTimeline } from '@prisma/client';

export class CreateProductSubmissionDto {
  @ApiProperty({
    description: 'Full name of the requester',
    example: 'Yonas Yohannes',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({
    description: 'Corporate email address',
    example: 'yohan@athenion.com',
  })
  @IsEmail()
  corporateEmail!: string;

  @ApiPropertyOptional({
    description: 'Company / institution name',
    example: 'Athenion Systems',
  })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiProperty({
    description: 'Target deploy timeline',
    enum: TargetDeployTimeline,
    example: TargetDeployTimeline.IMMEDIATE_PILOT_14_DAYS,
  })
  @IsEnum(TargetDeployTimeline)
  targetDeployTimeline!: TargetDeployTimeline;

  @ApiPropertyOptional({ description: 'Use case / architectural requirements' })
  @IsString()
  @IsOptional()
  useCase?: string;

  @ApiPropertyOptional({
    description: 'ID of the product this submission is for',
  })
  @IsUUID()
  @IsOptional()
  productId?: string;
}
