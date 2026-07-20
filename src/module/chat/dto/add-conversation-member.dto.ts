import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddConversationMemberDto {
  @ApiProperty({
    description: 'User ID to add to the conversation',
    example: 'user-id-1',
  })
  @IsString()
  userId: string;
}
