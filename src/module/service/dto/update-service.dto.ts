import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateServiceDto {
  @ApiPropertyOptional({ description: 'Service name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Service detailed description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Service group ID' })
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

  @ApiPropertyOptional({ description: 'Hard tangible deliverables', example: ['Strategy playbook', 'Operating model', 'Implementation roadmap'], isArray: true, type: String })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hardTangibleDeliverables?: string[];
}
