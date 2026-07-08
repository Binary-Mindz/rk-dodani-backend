import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsInt, Min } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({
    description: 'The unique database ID of the plan the user wants to subscribe to.',
    example: 'a6b8c1d2-e3f4-5a6b-7c8d-9e0f1a2b3c4d',
    required: true,
  })
  @IsNotEmpty({ message: 'Plan ID cannot be empty' })
  @IsString({ message: 'Plan ID must be a valid string' })
  @IsUUID('4', { message: 'Plan ID must be a valid UUID v4 format' })
  planId!: string;

  @ApiProperty({
    description: 'The number of seats (users) for B2B plans.',
    example: 25,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  seats?: number;
}