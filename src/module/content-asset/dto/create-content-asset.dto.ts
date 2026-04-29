import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentAccessModel, ContentAssetRole } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateContentAssetDto {
  @ApiProperty({
    example: '6f0ac663-3b19-4b79-8aa5-a98cd7f55001',
  })
  @IsUUID()
  contentItemId!: string;

  @ApiProperty({
    example: 'https://your-bucket.s3.amazonaws.com/content/whitepaper.pdf',
  })
  @IsUrl()
  fileUrl!: string;

  @ApiPropertyOptional({
    example: 'ai-leadership-whitepaper.pdf',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional({
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;

  @ApiPropertyOptional({
    example: 2457600,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  size?: number;

  @ApiProperty({
    enum: ContentAssetRole,
    example: ContentAssetRole.PRIMARY_DOCUMENT,
  })
  @IsEnum(ContentAssetRole)
  assetRole!: ContentAssetRole;

  @ApiPropertyOptional({
    example: 'Full Whitepaper PDF',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    example: 'Downloadable PDF version of the whitepaper',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isDownloadable?: boolean;

  @ApiPropertyOptional({
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPreviewOnly?: boolean;

  @ApiPropertyOptional({
    enum: ContentAccessModel,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(ContentAccessModel)
  accessOverride?: ContentAccessModel;
}