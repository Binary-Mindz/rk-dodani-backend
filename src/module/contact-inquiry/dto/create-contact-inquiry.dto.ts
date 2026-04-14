import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  InquiryPriority,
  InquiryType,
} from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateContactInquiryDto {
  @ApiProperty({ example: 'Rana Ahmed' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'rana@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'AgentArum Labs' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  company?: string;

  @ApiPropertyOptional({ example: 'CTO' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Bangladesh' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: 'Need AI strategy workshop' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiProperty({
    example:
      'We want to discuss AI strategy advisory for our leadership team.',
  })
  @IsString()
  @MaxLength(5000)
  message!: string;

  @ApiProperty({ enum: InquiryType, example: InquiryType.CONSULTING })
  @IsEnum(InquiryType)
  inquiryType!: InquiryType;

  @ApiPropertyOptional({ example: 'contact-page' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;

  @ApiPropertyOptional({
    enum: InquiryPriority,
    default: InquiryPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(InquiryPriority)
  priority?: InquiryPriority;
}