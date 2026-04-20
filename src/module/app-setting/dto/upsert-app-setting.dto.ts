import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDefined,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpsertAppSettingDto {
  @ApiProperty({ example: 'branding' })
  @IsString()
  @MaxLength(100)
  groupName!: string;

  @ApiProperty({ example: 'site_name' })
  @IsString()
  @MaxLength(100)
  key!: string;

  @ApiProperty({
    example: 'AgentArum',
    description: 'Can be string, boolean, number, object, or array',
  })
  @IsDefined()
  value!: unknown;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: 'Public website name' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}