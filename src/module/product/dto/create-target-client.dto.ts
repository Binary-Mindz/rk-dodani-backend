import { TargetType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTargetClientDto {
  @ApiPropertyOptional({
    enum: TargetType,
    default: TargetType.RETAIL_BANKING,
  })
  @IsEnum(TargetType)
  @IsOptional()
  type?: TargetType;

  @ApiProperty({ example: 'Retail banking leaders' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Banks modernizing customer journeys' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.png' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Personalized onboarding', 'Digital service automation'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keyFeature?: string[];
}
