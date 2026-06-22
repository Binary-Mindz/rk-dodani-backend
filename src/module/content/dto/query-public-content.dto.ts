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

  @ApiPropertyOptional({ description: 'Filter by tag slug', example: 'nest-js' })
  @IsOptional()
  @IsString()
  tagSlug?: string;

  // 🔄 contentTypeCode এর পরিবর্তে একাধিক contentTypeId নেওয়ার জন্য আপডেট
  @ApiPropertyOptional({
    description: 'Filter by one or more Content Type IDs (UUIDs)',
    type: [String],
    required: false,
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    // যদি কুয়েরি স্ট্রিং কমা দিয়ে আসে (e.g., id1,id2) অথবা মাল্টিপল ফিল্ড হিসেবে আসে
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsArray()
  @IsUUID('all', { each: true }) // অ্যারের ভেতরের প্রতিটি ভ্যালু UUID কিনা চেক করবে
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