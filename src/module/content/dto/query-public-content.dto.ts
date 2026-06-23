import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class QueryPublicContentDto {
  @ApiPropertyOptional({ description: 'Search by title or excerpt', example: 'AI Trends' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category slug', example: 'technology' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  // 🔄 একাধিক Category ID দিয়ে ফিল্টার করার জন্য নতুন প্রোপার্টি
  @ApiPropertyOptional({
    description: 'Filter by one or more Category IDs (UUIDs)',
    type: [String],
    required: false,
    example: ['123e4567-e89b-12d3-a456-426614174001'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsArray()
  @IsUUID('all', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'Filter by tag slug', example: 'nest-js' })
  @IsOptional()
  @IsString()
  tagSlug?: string;

  // 🔄 একাধিক Tag ID দিয়ে ফিল্টার করার জন্য নতুন প্রোপার্টি
  @ApiPropertyOptional({
    description: 'Filter by one or more Tag IDs (UUIDs)',
    type: [String],
    required: false,
    example: ['123e4567-e89b-12d3-a456-426614174002'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsArray()
  @IsUUID('all', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter by one or more Content Type IDs (UUIDs)',
    type: [String],
    required: false,
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsArray()
  @IsUUID('all', { each: true })
  contentTypeIds?: string[];

  @ApiPropertyOptional({ default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}