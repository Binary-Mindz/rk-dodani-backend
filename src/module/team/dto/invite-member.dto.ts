import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { TeamRole } from '@prisma/client';

export class InviteMemberDto {
  @ApiProperty({
    description: 'Email address of the team member to invite.',
    example: 'member@company.com',
    required: true,
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email!: string;

  @ApiProperty({
    description: 'Role for the invited user in the team (ADMIN or MEMBER).',
    enum: TeamRole,
    example: TeamRole.MEMBER,
    required: true,
  })
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(TeamRole)
  role!: TeamRole;
}

