import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({
    description: 'Rating score from 1 to 5 stars',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot be more than 5' })
  rating!: number;

  @ApiPropertyOptional({
    description: 'Optional written review comment',
    example: 'Great read, very detailed information on AI.',
  })
  @IsOptional()
  @IsString({ message: 'Review must be a string' })
  review?: string;
}
