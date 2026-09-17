import { ApiProperty } from '@nestjs/swagger';
import { PublishStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateServiceStatusDto {
  @ApiProperty({
    enum: PublishStatus,
    description: 'Status of the service',
    example: PublishStatus.PUBLISHED,
  })
  @IsEnum(PublishStatus)
  @IsNotEmpty()
  status!: PublishStatus;
}
