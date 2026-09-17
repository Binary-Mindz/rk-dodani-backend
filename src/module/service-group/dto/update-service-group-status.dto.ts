import { ApiProperty } from '@nestjs/swagger';
import { PublishStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateServiceGroupStatusDto {
  @ApiProperty({
    enum: PublishStatus,
    description: 'Status of the service group (DRAFT or PUBLISHED)',
    example: PublishStatus.PUBLISHED,
  })
  @IsEnum(PublishStatus)
  @IsNotEmpty()
  status!: PublishStatus;
}
