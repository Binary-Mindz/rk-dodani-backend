import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class TitleDescriptionDto {
  @ApiProperty({ example: 'Operational Efficiency' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Reduces operational overhead by 40% across departments' })
  @IsString()
  @IsNotEmpty()
  description!: string;
}

export class SectorFeatureDto {
  @ApiProperty({ example: 'Retail Banking' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Retail banking specialized solutions and workflows' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    example: ['Automated Loan Processing', 'Real-time Fraud Detection', 'Customer 360 View'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyFeatures?: string[];
}

export class CreateProductDto {
  @ApiProperty({ example: 'AI Leadership Platform' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Accelerate Enterprise Decision-Making' })
  @IsString()
  @IsNotEmpty()
  subTitle!: string;

  @ApiProperty({ example: 'Core Architecture' })
  @IsString()
  @IsNotEmpty()
  module!: string;

  @ApiProperty({ example: 'Comprehensive AI transformation platform designed for large organizations.' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ type: TitleDescriptionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TitleDescriptionDto)
  scaleValueImpact?: TitleDescriptionDto;

  @ApiPropertyOptional({ type: TitleDescriptionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TitleDescriptionDto)
  mitigationVector?: TitleDescriptionDto;

  @ApiPropertyOptional({ type: TitleDescriptionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TitleDescriptionDto)
  platformCapabilitiesDescriptor?: TitleDescriptionDto;

  @ApiPropertyOptional({ type: SectorFeatureDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SectorFeatureDto)
  retailBanking?: SectorFeatureDto;

  @ApiPropertyOptional({ type: SectorFeatureDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SectorFeatureDto)
  capitalMarkets?: SectorFeatureDto;

  @ApiPropertyOptional({ type: SectorFeatureDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SectorFeatureDto)
  wealthAndAsset?: SectorFeatureDto;
}
