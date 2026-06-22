import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsEnum, IsString, IsInt, Min, IsUUID } from 'class-validator';

export class QueryUserManagementDto {
  @ApiPropertyOptional({ description: 'Search by user name or email', example: 'Sarah Chen' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by specific plan ID', example: 'plan-uuid-here' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({ enum: UserStatus, description: 'Filter by user status', example: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Pagination page number', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of records per page', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}