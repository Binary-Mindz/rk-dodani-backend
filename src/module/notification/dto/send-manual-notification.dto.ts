import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class SendManualNotificationDto {
  @ApiProperty({ description: 'Target user ID' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ example: 'Important Update' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Your account has been reviewed.' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({ example: { path: '/dashboard' } })
  @IsObject()
  @IsOptional()
  payload?: Record<string, unknown>;
}
