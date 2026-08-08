import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PrimaryFocusArea } from '@prisma/client';

export class CreateServiceSubmissionDto {
  @ApiProperty({ description: 'Full name of the requester', example: 'Sarah Connor' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ description: 'Corporate email for contact', example: 's.connor@cyberdyne.com' })
  @IsEmail()
  corporateEmail!: string;

  @ApiProperty({
    description: 'Primary focus area for the service request',
    enum: PrimaryFocusArea,
    example: PrimaryFocusArea.ENGINEERING_TO_WIN_WORKSHOPS,
  })
  @IsEnum(PrimaryFocusArea)
  primaryFocusArea!: PrimaryFocusArea;

  @ApiPropertyOptional({ description: 'Optional request details or message' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({ description: 'ID of the service being requested', example: 'service-uuid' })
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

}
