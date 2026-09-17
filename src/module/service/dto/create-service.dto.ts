import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublishStatus } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Service name',
    example: 'AI Leadership Whitepaper 2026',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'How modern leaders are adopting AI',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Service group ID', example: '#154' })
  @IsString()
  @IsOptional()
  serviceGroupId?: string | null;

  @ApiPropertyOptional({ description: 'The critical friction' })
  @IsString()
  @IsOptional()
  criticalFriction?: string;

  @ApiPropertyOptional({ description: 'The Agentarum paradigm' })
  @IsString()
  @IsOptional()
  agentarumParadigm?: string;

  @ApiPropertyOptional({
    description: 'Hard tangible deliverables',
    example: ['Strategy playbook', 'Operating model', 'Implementation roadmap'],
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hardTangibleDeliverables?: string[];

  @ApiPropertyOptional({
    enum: PublishStatus,
    default: PublishStatus.DRAFT,
    description: 'Status of the service (DRAFT or PUBLISHED)',
    example: PublishStatus.DRAFT,
  })
  @IsEnum(PublishStatus)
  @IsOptional()
  status?: PublishStatus;
}
