import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'AI Leadership Whitepaper 2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Product description', example: 'How modern leaders are adopting AI' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Product group ID', example: '#154' })
  @IsString()
  @IsOptional()
  productGroupId?: string | null;

  @ApiPropertyOptional({ example: 'Athenion Solution Architecture Blueprint' })
  @IsString()
  @IsOptional()
  architectureBlueprint?: string;

  @ApiPropertyOptional({ description: 'Retail banking sector copy' })
  @IsString()
  @IsOptional()
  retailBanking?: string;

  @ApiPropertyOptional({ description: 'Capital markets sector copy' })
  @IsString()
  @IsOptional()
  capitalMarkets?: string;

  @ApiPropertyOptional({ description: 'Wealth and asset sector copy' })
  @IsString()
  @IsOptional()
  wealthAndAsset?: string;

  @ApiPropertyOptional({ description: 'Initiate Athenion discussion copy' })
  @IsString()
  @IsOptional()
  initiateAthenionDiscussion?: string;
}
