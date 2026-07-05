import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'First name of the user',
    example: 'Joe',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'Smith',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'URL of the user avatar image',
    example: 'https://example.com/avatars/joe-smith.png',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}