import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ContentAccessModel,
  ContentFileFormat,
  ContentTypeCode,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export enum BookmarkSortBy {
  BOOKMARKED_AT = 'bookmarkedAt',
  PUBLISHED_AT = 'publishedAt',
  CREATED_AT = 'createdAt',
  TITLE = 'title',
}

export enum BookmarkSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryBookmarksDto {
  @ApiPropertyOptional({
    description: 'Search in bookmarked content title, excerpt, or summary',
    example: 'AI Trends',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category slug',
    example: 'technology',
  })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({
    description: 'Filter by one or more Category IDs (UUIDs)',
    type: [String],
    required: false,
    example: ['123e4567-e89b-12d3-a456-426614174001'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsArray()
  @IsUUID('all', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter by tag slug',
    example: 'nest-js',
  })
  @IsOptional()
  @IsString()
  tagSlug?: string;

  @ApiPropertyOptional({
    description: 'Filter by one or more Tag IDs (UUIDs)',
    type: [String],
    required: false,
    example: ['123e4567-e89b-12d3-a456-426614174002'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsArray()
  @IsUUID('all', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter by Content Type ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  contentTypeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by one or more Content Type IDs (UUIDs)',
    type: [String],
    required: false,
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsArray()
  @IsUUID('all', { each: true })
  contentTypeIds?: string[];

  @ApiPropertyOptional({
    enum: ContentTypeCode,
    description: 'Filter by content type code',
    example: ContentTypeCode.ARTICLE,
  })
  @IsOptional()
  @IsEnum(ContentTypeCode)
  contentTypeCode?: ContentTypeCode;

  @ApiPropertyOptional({
    enum: ContentFileFormat,
    description: 'Filter by content file format',
  })
  @IsOptional()
  @IsEnum(ContentFileFormat)
  contentFormat?: ContentFileFormat;

  @ApiPropertyOptional({
    enum: ContentAccessModel,
    description: 'Filter by access model',
  })
  @IsOptional()
  @IsEnum(ContentAccessModel)
  accessModel?: ContentAccessModel;

  @ApiPropertyOptional({
    description: 'Filter by featured content',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    enum: BookmarkSortBy,
    default: BookmarkSortBy.BOOKMARKED_AT,
    description: 'Sort by field',
  })
  @IsOptional()
  @IsEnum(BookmarkSortBy)
  sortBy?: BookmarkSortBy = BookmarkSortBy.BOOKMARKED_AT;

  @ApiPropertyOptional({
    enum: BookmarkSortOrder,
    default: BookmarkSortOrder.DESC,
    description: 'Sort order',
  })
  @IsOptional()
  @IsEnum(BookmarkSortOrder)
  sortOrder?: BookmarkSortOrder = BookmarkSortOrder.DESC;

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
  @Max(100)
  limit?: number = 10;
}

