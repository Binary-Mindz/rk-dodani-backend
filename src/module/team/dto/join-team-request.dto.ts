import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class JoinTeamRequestDto {
  @ApiProperty({
    description: 'The User ID of the CTO/Admin owning the B2B team',
    example: 'cto-uuid-here',
  })
  @IsUUID(4, { message: 'CTO User ID must be a valid UUID' })
  @IsNotEmpty()
  ctoUserId!: string;
}
