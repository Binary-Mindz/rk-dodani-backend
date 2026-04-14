import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageType, PublishStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreatePageDto {
  @ApiProperty({
    example: 'about',
  })
  @IsString()
  @MaxLength(150)
  slug!: string;

  @ApiProperty({
    example: 'About AgentArum',
  })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    example: 'Learn about our AI leadership mission',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @ApiProperty({
    enum: PageType,
    example: PageType.ABOUT,
  })
  @IsEnum(PageType)
  pageType!: PageType;

  @ApiPropertyOptional({
    enum: PublishStatus,
    default: PublishStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ApiPropertyOptional({
    example: 'AI Leadership for Modern Organizations',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  heroTitle?: string;

  @ApiPropertyOptional({
    example: 'Strategy, insight, and execution support',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  heroSubtitle?: string;

  @ApiPropertyOptional({
    example: 'https://your-bucket.s3.amazonaws.com/pages/about-hero.png',
  })
  @IsOptional()
  @IsUrl()
  heroImageUrl?: string;

  @ApiPropertyOptional({
    example: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Welcome to AgentArum' }],
        },
      ],
    },
  })
  @IsOptional()
  body?: any;

  @ApiPropertyOptional({
    example: '2026-04-20T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}