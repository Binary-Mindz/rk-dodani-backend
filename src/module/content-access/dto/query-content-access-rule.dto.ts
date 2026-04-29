import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  AccessRuleType,
} from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class QueryContentAccessRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contentItemId?: string;

  @ApiPropertyOptional({ enum: AccessRuleType })
  @IsOptional()
  @IsEnum(AccessRuleType)
  ruleType?: AccessRuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;
}