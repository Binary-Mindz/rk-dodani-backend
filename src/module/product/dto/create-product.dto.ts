import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductSectorDto } from './product-sector.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'AI Leadership Platform' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'How modern leaders are adopting AI' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ example: 'uuid-of-product-group' })
  @IsString()
  @IsOptional()
  productGroupId?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/product.jpg' })
  @IsString()
  @IsOptional()
  productImage?: string;

  @ApiPropertyOptional({ example: 'Athenion Solution Architecture Blueprint' })
  @IsString()
  @IsOptional()
  architectureBlueprint?: string;

  @ApiPropertyOptional({ example: 'Initiate Athenion discussion copy' })
  @IsString()
  @IsOptional()
  initiateAthenionDiscussion?: string;

  @ApiPropertyOptional({ type: [ProductSectorDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSectorDto)
  sectors?: ProductSectorDto[];
}
