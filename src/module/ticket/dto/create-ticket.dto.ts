import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { InquiryPriority } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty({ description: 'User Name', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'User Email', example: 'john@email.com' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Issue Title or Subject', example: 'Payment failed while subscribing' })
  @IsNotEmpty()
  @IsString()
  subject!: string;

  @ApiProperty({ description: 'Detailed Issue Description', example: 'Tried paying via Stripe but got a timeout error.' })
  @IsNotEmpty()
  @IsString()
  message!: string;

  @ApiPropertyOptional({ enum: InquiryPriority, default: InquiryPriority.NORMAL, example: InquiryPriority.HIGH })
  @IsOptional()
  @IsEnum(InquiryPriority)
  priority?: InquiryPriority;

  @ApiPropertyOptional({ description: 'Existing User ID if registered', example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  @IsOptional()
  @IsUUID()
  relatedUserId?: string;
}