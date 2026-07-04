import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'The current password of the user',
    example: 'OldPassword123!',
  })
  @IsNotEmpty()
  @IsString()
  oldPassword!: string;

  @ApiProperty({
    description: 'The new password to set (minimum 6 characters)',
    example: 'NewSecurePass2026$',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword!: string;
}