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
  @ApiProperty({
    description: 'Content type ID',
    example: '3f8b9b5d-7c6a-4e20-9db5-8a4f5e1b2c77',
  })
  @IsUUID()
  contentTypeId!: string;

  @ApiProperty({
    description: 'Unique slug for the content',
    example: 'ai-leadership-whitepaper-2026',
  })
  @IsString()
  @MaxLength(180)
  slug!: string;

  @ApiProperty({
    description: 'Main title of the content',
    example: 'AI Leadership Whitepaper 2026',
  })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    description: 'Subtitle of the content',
    example: 'How modern leaders are adopting AI in 2026',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @ApiPropertyOptional({
    description: 'Short excerpt for listing page',
    example: 'A concise overview of AI adoption trends among business leaders.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiPropertyOptional({
    description: 'Short summary of the content',
    example:
      'This whitepaper explores how AI is transforming leadership strategy, operations, and decision-making.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @ApiPropertyOptional({
    description: 'Plain text version of the content body',
    example:
      'This whitepaper explores the adoption of AI in leadership and business strategy.',
  })
  @IsOptional()
  @IsString()
  plainTextBody?: string;

  @ApiPropertyOptional({
    description: 'Display name of the author',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  authorDisplayName?: string;

  @ApiPropertyOptional({
    description: 'Primary author user ID',
    example: '7f61db8b-fb35-4d7d-a7df-8e8d4d88e021',
  })
  @IsOptional()
  @IsUUID()
  primaryAuthorId?: string;

  @ApiPropertyOptional({
    description: 'Cover image URL',
    example: 'https://cdn.example.com/content/cover-ai-whitepaper.jpg',
  })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Thumbnail image URL',
    example: 'https://cdn.example.com/content/thumb-ai-whitepaper.jpg',
  })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: 'Publishing status',
    enum: PublishStatus,
    default: PublishStatus.DRAFT,
    example: PublishStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ApiPropertyOptional({
    description: 'Visibility of the content',
    enum: ContentVisibility,
    default: ContentVisibility.PUBLIC,
    example: ContentVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(ContentVisibility)
  visibility?: ContentVisibility;

  @ApiPropertyOptional({
    description: 'Access model of the content',
    enum: ContentAccessModel,
    default: ContentAccessModel.PUBLIC,
    example: ContentAccessModel.PUBLIC,
  })
  @IsOptional()
  @IsEnum(ContentAccessModel)
  accessModel?: ContentAccessModel;

  @ApiPropertyOptional({
    description: 'Format of the content',
    example: 'PDF',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contentFormat?: string;

  @ApiPropertyOptional({
    description: 'External source URL if content is hosted elsewhere',
    example: 'https://example.com/whitepapers/ai-leadership-2026',
  })
  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @ApiPropertyOptional({
    description: 'External embed code for video, iframe, etc.',
    example: '<iframe src="https://example.com/embed/123"></iframe>',
  })
  @IsOptional()
  @IsString()
  externalEmbedCode?: string;

  @ApiPropertyOptional({
    description: 'Estimated reading time in minutes',
    example: 12,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  readingTimeMinutes?: number;

  @ApiPropertyOptional({
    description: 'Scheduled publish date/time',
    example: '2026-04-20T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: 'Whether the content is featured',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the content is pinned',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({
    description: 'Whether comments are allowed',
    default: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiPropertyOptional({
    description: 'Whether downloading is allowed',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean;

  @ApiPropertyOptional({
    description: 'Whether download requires acceptance of terms',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  downloadRequiresAcceptance?: boolean;

  @ApiPropertyOptional({
    description: 'Terms text for acceptance before download',
    example:
      'By downloading this file, you agree not to redistribute it without permission.',
  })
  @IsOptional()
  @IsString()
  termsText?: string;

  @ApiPropertyOptional({
    description: 'Sorting order for displaying content',
    default: 0,
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'List of category IDs',
    type: [String],
    example: [
      'd290f1ee-6c54-4b01-90e6-d701748f0851',
      '5b8f1e4f-cd9d-4d90-a6ff-9d55d2cbf123',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: 'List of tag IDs',
    type: [String],
    example: [
      'c5a0f0e2-8d46-4a56-a527-77d9b2a15c11',
      '3c8f0c43-1c9a-4b4f-95a1-faf2f2a8ef22',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
