import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateDeepPointDto } from './create-deep-point.dto';

export class UpdateDeepPointDto extends PartialType(CreateDeepPointDto) {
  @ApiPropertyOptional({ description: 'ID of existing deep point (if updating existing)' })
  @IsString()
  @IsOptional()
  id?: string;
}
