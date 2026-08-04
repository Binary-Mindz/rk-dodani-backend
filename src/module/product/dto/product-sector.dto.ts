import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductSectorType } from '@prisma/client';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProductSectorDto {
  @ApiProperty({ enum: ProductSectorType, example: ProductSectorType.RETAIL_BANKING })
  @IsEnum(ProductSectorType)
  sectorType!: ProductSectorType;

  @ApiProperty({ example: 'Retail Banking' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'AI-driven solutions for retail banking.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String], example: ['Real-time fraud detection', 'Personalized offers'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyFeatures?: string[];
}
