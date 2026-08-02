import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateServiceGroupDto {
  @ApiProperty({ description: 'Group name', example: 'AI Leadership Whitepaper 2026' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Group description', example: 'How modern leaders are adopting AI' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Group icon URL' })
  @IsString()
  @IsOptional()
  icon?: string;
}
