import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IndustryTarget,
  InsightContentType,
  InsightFileType,
  InsightStatus,
  InsightVisibility,
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

export class CreateInsightDto {
  @ApiProperty({ example: 'AI Leadership in 2026' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'How modern leaders adopt AI' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @ApiPropertyOptional({ example: 'A concise overview of AI adoption trends.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiPropertyOptional({
    example: 'This insight explores how AI transforms leadership.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(0)
  readingTimeMinutes?: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.jpg' })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/external-article' })
  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @ApiPropertyOptional({ enum: InsightStatus, default: InsightStatus.DRAFT })
  @IsOptional()
  @IsEnum(InsightStatus)
  status?: InsightStatus;

  @ApiPropertyOptional({
    enum: InsightVisibility,
    default: InsightVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(InsightVisibility)
  visibility?: InsightVisibility;

  @ApiPropertyOptional({ example: '2026-06-30T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean;

  @ApiPropertyOptional({
    enum: InsightContentType,
    default: InsightContentType.ARTICLE,
  })
  @IsOptional()
  @IsEnum(InsightContentType)
  contentType?: InsightContentType;

  @ApiPropertyOptional({ enum: InsightFileType })
  @IsOptional()
  @IsEnum(InsightFileType)
  fileType?: InsightFileType;

  @ApiPropertyOptional({
    enum: IndustryTarget,
    isArray: true,
    example: [IndustryTarget.BANKING],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(IndustryTarget, { each: true })
  industryTargets?: IndustryTarget[];

  @ApiPropertyOptional({ type: [String], example: ['uuid-category-1'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String], example: ['#AI2026', '#Governance'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
