import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentAccessModel, ContentVisibility, PublishStatus } from '@prisma/client';
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
    description: 'Main title of the content',
    example: 'AI Leadership Whitepaper 2026',
  })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ description: 'Subtitle of the content', example: 'How modern leaders adopt AI' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Short excerpt for listing page', example: 'Concise overview of AI adoption trends.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiPropertyOptional({ description: 'Short summary of the content', example: 'This whitepaper explores how AI transforms leadership strategy.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @ApiPropertyOptional({ description: 'Plain text version of the content body', example: 'Full article plain text goes here...' })
  @IsOptional()
  @IsString()
  plainTextBody?: string;

  @ApiPropertyOptional({ description: 'Display name of the author', example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  authorDisplayName?: string;

  @ApiPropertyOptional({ description: 'Cover image URL', example: 'https://cdn.example.com/cover.jpg' })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Thumbnail image URL', example: 'https://cdn.example.com/thumb.jpg' })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ enum: PublishStatus, default: PublishStatus.DRAFT, example: PublishStatus.DRAFT })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ApiPropertyOptional({ enum: ContentVisibility, default: ContentVisibility.PUBLIC, example: ContentVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(ContentVisibility)
  visibility?: ContentVisibility;

  @ApiPropertyOptional({ enum: ContentAccessModel, default: ContentAccessModel.PUBLIC, example: ContentAccessModel.PUBLIC })
  @IsOptional()
  @IsEnum(ContentAccessModel)
  accessModel?: ContentAccessModel;

  @ApiPropertyOptional({ description: 'Format of the content', example: 'PDF' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contentFormat?: string;

  @ApiPropertyOptional({ description: 'External source URL if content is hosted elsewhere', example: 'https://example.com/external' })
  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @ApiPropertyOptional({ description: 'External embed code for iframe/video', example: '<iframe src="..."></iframe>' })
  @IsOptional()
  @IsString()
  externalEmbedCode?: string;

  @ApiPropertyOptional({ description: 'Estimated reading time in minutes', example: 12 })
  @IsOptional()
  @IsInt()
  @Min(0)
  readingTimeMinutes?: number;

  @ApiPropertyOptional({ description: 'Scheduled publish date/time', example: '2026-06-30T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ default: false, example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: false, example: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ default: false, example: true })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  // 📂 Merged Asset Fields From ContentAsset Table
  @ApiPropertyOptional({ description: 'Primary asset attachment URL (Merged Field)', example: 'https://cdn.example.com/files/ai-whitepaper.pdf' })
  @IsOptional()
  @IsUrl()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'Whether asset downloading is allowed', default: true, example: true })
  @IsOptional()
  @IsBoolean()
  isDownloadable?: boolean;

  @ApiPropertyOptional({ description: 'Whether downloading requires terms acceptance', default: false, example: false })
  @IsOptional()
  @IsBoolean()
  downloadRequiresAcceptance?: boolean;

  @ApiPropertyOptional({ description: 'Terms text for acceptance', example: 'By downloading, you agree to our terms.' })
  @IsOptional()
  @IsString()
  termsText?: string;

  @ApiPropertyOptional({ type: [String], example: ['d290f1ee-6c54-4b01-90e6-d701748f0851'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String], example: ['c5a0f0e2-8d46-4a56-a527-77d9b2a15c11'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}