import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InquiryDto {
  @ApiProperty({
    description: 'The name of the company',
    example: 'Pope and Mccoy Plc',
    required: false,
  })
  @IsOptional()
  @IsString()
  company: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'Brian Byrd',
    required: true,
  })
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  @Length(2, 50, { message: 'Full name must be between 2 and 50 characters' })
  fullName: string;

  @ApiProperty({
    description: 'Type of the inquiry (e.g., strategy, support, sales)',
    example: 'strategy',
    required: true,
  })
  @IsNotEmpty({ message: 'Inquiry type is required' })
  @IsString()
  inquiryType: string;

  @ApiProperty({
    description: 'The detailed message or challenge description',
    example: 'Et asperiores deleni',
    required: true,
  })
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @IsString()
  @Length(10, 1000, { message: 'Message must be between 10 and 1000 characters' })
  message: string;

  @ApiProperty({
    description: 'Professional or work email address of the user',
    example: 'deqojyrug@mailinator.com',
    required: true,
  })
  @IsNotEmpty({ message: 'Work email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  workEmail: string;
}