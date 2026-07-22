import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdatePlatformInfoDto {
  @ApiPropertyOptional({
    description: 'Name of the platform',
    example: 'AgentArum',
  })
  @IsOptional()
  @IsString()
  platformName?: string;

  @ApiPropertyOptional({
    description: 'Support email address for the platform',
    example: 'support@agentarum.io',
  })
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @ApiPropertyOptional({
    description: 'Platform default timezone',
    example: 'UTC+0 London',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Platform default language',
    example: 'English',
  })
  @IsOptional()
  @IsString()
  language?: string;
}
