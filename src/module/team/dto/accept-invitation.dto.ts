import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Invitation token received via email link',
    example: 'abcdef1234567890...',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
