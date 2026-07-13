import { ApiProperty } from '@nestjs/swagger';
import { AlertType, AlertMethod } from '@prisma/client';

export class AlertResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AlertType })
  alertType: AlertType;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: AlertMethod })
  alertMethod: AlertMethod;

  @ApiProperty()
  isEdited: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}