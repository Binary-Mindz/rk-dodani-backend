import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ContentAccessModel,
  ContentVisibility,
  PublishStatus,
} from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateContentDto {
  @ApiProperty()
  @IsUUID()
  contentTypeId!: string;

  @ApiProperty({ example: 'ai-leadership-whitepaper-2026' })
  @IsString()
  @MaxLength(180)
  slug!: string;

  @ApiProperty({ example: 'AI Leadership Whitepaper 2026' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @ApiPropertyOptional({
    example: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
  })
  @IsOptional()
  body?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plainTextBody?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  authorDisplayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  primaryAuthorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ enum: PublishStatus, default: PublishStatus.DRAFT })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ApiPropertyOptional({
    enum: ContentVisibility,
    default: ContentVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(ContentVisibility)
  visibility?: ContentVisibility;

  @ApiPropertyOptional({
    enum: ContentAccessModel,
    default: ContentAccessModel.PUBLIC,
  })
  @IsOptional()
  @IsEnum(ContentAccessModel)
  accessModel?: ContentAccessModel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contentFormat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalEmbedCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  readingTimeMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  downloadRequiresAcceptance?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termsText?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}