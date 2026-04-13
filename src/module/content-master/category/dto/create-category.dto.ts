import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'AI Strategy' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'ai-strategy' })
  @IsString()
  @MaxLength(140)
  slug!: string;

  @ApiPropertyOptional({ example: 'Category for AI strategy related content' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 'a5f2f7a5-1d23-41c2-89c9-6877d5c2b121',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}