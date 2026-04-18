import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class QueryAppSettingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPublic?: boolean;
}