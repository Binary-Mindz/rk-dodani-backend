import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// create content type
export class CreateContentTypeDto {
  @ApiProperty({
    example: 'PODCAST',
    description: 'Unique dynamic code for the content type (e.g. PODCAST, INFOGRAPHIC, WEBINAR)',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  code: string;

  @ApiProperty({ example: 'Podcasts & Audio Shows' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Audio podcasts, interviews and episodes' })
  @IsString()
  @IsOptional()
  description?: string;
}

// update content type
export class UpdateContentTypeDto extends PartialType(CreateContentTypeDto) {}

