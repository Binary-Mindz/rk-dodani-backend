import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsEnum, IsOptional, ArrayMinSize } from 'class-validator';

export class CreateConversationDto {
  @ApiPropertyOptional({ 
    description: 'Name of the conversation (Required for GROUP, optional for DIRECT)', 
    example: 'Study Group A' 
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    enum: ['DIRECT', 'GROUP'], 
    description: 'Type of conversation', 
    example: 'DIRECT' 
  })
  @IsEnum(['DIRECT', 'GROUP'])
  type: 'DIRECT' | 'GROUP';

  @ApiProperty({ 
    type: [String], 
    description: 'Array of user IDs to include in the conversation', 
    example: ['user-id-1', 'user-id-2'] 
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participantIds: string[];
}
