import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    example: 'd8ec1c19-70ad-4d19-b8f0-f12f3e2d8e11',
  })
  @IsUUID()
  planId!: string;

  @ApiProperty({
    example: 'http://localhost:3000/billing/success',
  })
  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @ApiProperty({
    example: 'http://localhost:3000/billing/cancel',
  })
  @IsOptional()
  @IsUrl()
  cancelUrl?: string;

  @ApiProperty({
    example: 'premium research checkout',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}