import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAuditLogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorUserId?: string;

  @ApiProperty({ example: 'CONTENT_ITEM' })
  @IsString()
  @MaxLength(100)
  entityType!: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityId?: string;

  @ApiProperty({ enum: AuditAction })
  @IsEnum(AuditAction)
  action!: AuditAction;

  @ApiPropertyOptional()
  @IsOptional()
  oldValues?: any;

  @ApiPropertyOptional()
  @IsOptional()
  newValues?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  userAgent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  requestId?: string;
}