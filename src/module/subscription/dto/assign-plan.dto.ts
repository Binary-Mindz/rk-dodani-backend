import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

export class AssignPlanDto {
  @ApiProperty({
    description: 'The User ID of the target subscriber (CTO/Enterprise user)',
    example: 'user-uuid-here',
  })
  @IsUUID(4, { message: 'Target User ID must be a valid UUID' })
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'The Plan ID to assign to the user',
    example: 'plan-uuid-here',
  })
  @IsUUID(4, { message: 'Plan ID must be a valid UUID' })
  @IsNotEmpty()
  planId!: string;

  @ApiPropertyOptional({
    description: 'Number of seats to assign (only applicable/required for B2B plans)',
    example: 10,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  seats?: number;
}
