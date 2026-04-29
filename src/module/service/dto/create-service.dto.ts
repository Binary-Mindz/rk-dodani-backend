import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublishStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    example: 'ai-strategy-advisory',
  })
  @IsString()
  @MaxLength(160)
  slug!: string;

  @ApiProperty({
    example: 'AI Strategy Advisory',
  })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    example: 'Strategic guidance for AI adoption and transformation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @ApiPropertyOptional({
    example:
      'We help leadership teams define AI strategy, governance, and adoption roadmaps.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://your-bucket.s3.amazonaws.com/services/icon-ai.png',
  })
  @IsOptional()
  @IsUrl()
  iconUrl?: string;

  @ApiPropertyOptional({
    example: 'https://your-bucket.s3.amazonaws.com/services/cover-ai.png',
  })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    enum: PublishStatus,
    default: PublishStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ApiPropertyOptional({
    example: 'Book a Call',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ctaLabel?: string;

  @ApiPropertyOptional({
    example: 'https://agentarum.com/contact',
  })
  @IsOptional()
  @IsUrl()
  ctaUrl?: string;

  @ApiPropertyOptional({
    example: '2026-04-20T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}