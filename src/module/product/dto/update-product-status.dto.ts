import { ApiProperty } from '@nestjs/swagger';
import { PublishStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateProductStatusDto {
  @ApiProperty({
    enum: PublishStatus,
    description: 'Publish status for the product',
    example: PublishStatus.PUBLISHED,
  })
  @IsEnum(PublishStatus)
  @IsNotEmpty()
  status!: PublishStatus;
}
