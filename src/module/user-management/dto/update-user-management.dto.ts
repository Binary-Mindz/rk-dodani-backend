import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class UpdateUserManagementDto {
  @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.BLOCKED })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Assign a new subscription plan ID directly', example: 'new-plan-uuid' })
  @IsOptional()
  @IsUUID()
  planId?: string;
}