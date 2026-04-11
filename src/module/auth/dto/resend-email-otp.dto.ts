import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendEmailOtpDto {
  @ApiProperty({ example: 'rana@example.com' })
  @IsEmail()
  email!: string;
}