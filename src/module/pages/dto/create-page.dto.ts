import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageType, PublishStatus } from '@prisma/client';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePageDto {
  @ApiProperty({ example: 'home' })
  @IsString()
  @MaxLength(255)
  slug!: string;

  @ApiProperty({ example: 'Home Page' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'Welcome to AgentArum' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @ApiProperty({ enum: PageType, example: PageType.HOME })
  @IsEnum(PageType)
  pageType!: PageType;

  @ApiPropertyOptional({ enum: PublishStatus, example: PublishStatus.DRAFT })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ApiPropertyOptional({ example: 'Lead the AI future' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  heroTitle?: string;

  @ApiPropertyOptional({ example: 'We help leaders drive AI transformation' })
  @IsOptional()
  @IsString()
  heroSubtitle?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  heroImageFileId?: string;

  @ApiPropertyOptional({ example: { sections: [] } })
  @IsOptional()
  @IsObject()
  body?: Record<string, any>;
}