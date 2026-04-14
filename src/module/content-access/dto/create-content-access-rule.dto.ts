import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AccessRuleOperator,
  AccessRuleType,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateContentAccessRuleDto {
  @ApiProperty()
  @IsUUID()
  contentItemId!: string;

  @ApiProperty({ enum: AccessRuleType })
  @IsEnum(AccessRuleType)
  ruleType!: AccessRuleType;

  @ApiProperty({ enum: AccessRuleOperator })
  @IsEnum(AccessRuleOperator)
  operator!: AccessRuleOperator;

  @ApiProperty({
    example: { value: 'ACTIVE' },
    description: 'Flexible JSON rule value',
  })
  ruleValue: any;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowAccess?: boolean;

  @ApiPropertyOptional({
    example: 'Premium subscription required to access this content',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}