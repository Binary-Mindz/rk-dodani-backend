import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateMaintenanceDto {
  @ApiProperty({
    description: 'Set maintenance mode enabled (true) or disabled (false)',
    example: true,
  })
  @IsBoolean()
  isUnderMaintenance!: boolean;
}
