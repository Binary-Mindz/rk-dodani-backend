import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateMaintenanceDto {
  @ApiProperty({
    description: 'Set maintenance mode enabled (true) or disabled (false)',
    example: true,
  })
  @IsBoolean()
  isUnderMaintenance!: boolean;

  @ApiProperty({
    description: 'Message to display to users during maintenance',
    example:
      'We are currently performing scheduled maintenance. Please check back soon.',
  })
  @IsNotEmpty()
  @IsString()
  message!: string;

  @ApiPropertyOptional({
    description: 'Expected end time of the maintenance window (ISO 8601)',
    example: '2026-07-25T20:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;
}
