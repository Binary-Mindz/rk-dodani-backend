import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateDeepPointDto } from './create-deep-point.dto';

export class CreateServiceDto {
  @ApiProperty({ description: 'Service title', example: 'AI Strategy Consulting' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Service main heading', example: 'Transform your enterprise with tailored AI models' })
  @IsString()
  @IsNotEmpty()
  heading: string;

  @ApiPropertyOptional({ description: 'Service detailed description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [CreateDeepPointDto], description: 'List of deep points for this service' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeepPointDto)
  @IsOptional()
  deepPoints?: CreateDeepPointDto[];
}