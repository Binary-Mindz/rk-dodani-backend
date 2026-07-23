import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeepPointDto {
  @ApiProperty({ description: 'Title of the deep point', example: 'System Architecture' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Description of the deep point' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Critical friction detail' })
  @IsString()
  @IsOptional()
  criticalFriction?: string;

  @ApiPropertyOptional({ description: 'Paradigm shift or details' })
  @IsString()
  @IsOptional()
  paradigm?: string;

  @ApiPropertyOptional({ description: 'Key features list', type: [String], example: ['Feature A', 'Feature B'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keyFeatures?: string[];
}
