import { ApiProperty } from '@nestjs/swagger';
import { AlertMethod, AlertType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAlertDto {
    @ApiProperty({ enum: AlertType, default: AlertType.INFO })
    @IsEnum(AlertType)
    @IsOptional()
    alertType?: AlertType;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    message: string;

    @ApiProperty({ enum: AlertMethod, default: AlertMethod.PUSH })
    @IsEnum(AlertMethod)
    @IsOptional()
    alertMethod?: AlertMethod;
}