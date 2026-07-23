import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { UpdateDeepPointDto } from './update-deep-point.dto';

export class UpdateServiceDto {
  @ApiPropertyOptional({ description: 'Service title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Service main heading' })
  @IsString()
  @IsOptional()
  heading?: string;

  @ApiPropertyOptional({ description: 'Service detailed description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [UpdateDeepPointDto], description: 'Updated list of deep points' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDeepPointDto)
  @IsOptional()
  deepPoints?: UpdateDeepPointDto[];
}