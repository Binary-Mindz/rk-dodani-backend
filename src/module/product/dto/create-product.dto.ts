import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRoleCode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateTargetClientDto } from './create-target-client.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'Core Banking Intelligence Platform' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Decision intelligence for financial operations' })
  @IsString()
  @IsNotEmpty()
  subTitle: string;

  @ApiPropertyOptional({
    enum: UserRoleCode,
    default: UserRoleCode.STUDENT,
    example: UserRoleCode.STUDENT,
  })
  @IsEnum(UserRoleCode)
  @IsOptional()
  role?: UserRoleCode;

  @ApiPropertyOptional({ example: 'Banking AI Suite' })
  @IsString()
  @IsOptional()
  module?: string;

  @ApiProperty({ example: 'A platform for improving banking workflows.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'Legacy core to composable platform' })
  @IsString()
  @IsOptional()
  migrationVector?: string;

  @ApiPropertyOptional({ example: 'Reduced onboarding time by 40%' })
  @IsString()
  @IsOptional()
  scaleValueImpact?: string;

  @ApiPropertyOptional({ type: [CreateTargetClientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTargetClientDto)
  @IsOptional()
  targetClient?: CreateTargetClientDto[];
}
