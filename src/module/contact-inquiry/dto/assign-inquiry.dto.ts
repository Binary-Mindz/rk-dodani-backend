import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AssignInquiryDto {
  @ApiProperty({ example: '6f0ac663-3b19-4b79-8aa5-a98cd7f55001' })
  @IsUUID()
  assignedToId!: string;

  @ApiPropertyOptional({ example: 'Assigned to support lead' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}