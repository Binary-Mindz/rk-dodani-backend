import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BlockConversationMemberDto {
  @ApiPropertyOptional({
    description: 'Optional reason for blocking the conversation member',
    example: 'Spam or policy violation',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
