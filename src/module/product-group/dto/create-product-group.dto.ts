import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductGroupDto {
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

  @ApiPropertyOptional({ description: 'Order of the group', example: 1 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  order?: number;
}
