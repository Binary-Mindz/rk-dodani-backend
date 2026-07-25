import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateBlockStatusDto {
  @ApiProperty({
    description: 'Blocked status of the activity feedback',
    example: true,
  })
  @IsBoolean()
  isBlocked!: boolean;
}
