import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ToggleSuspendDto {
  @ApiProperty({
    description: 'The explicit reason for suspending or unsuspending the user account',
    example: 'Violation of Terms of Service section 4B (Spamming comments).',
    required: true,
    minLength: 5,
    type: String
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5, { message: 'Reason must be at least 5 characters long' })
  reason?: string;
}