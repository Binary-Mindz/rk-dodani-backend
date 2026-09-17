import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TeamRole } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateTeamMemberDto {
  @ApiProperty({
    description: 'Email of the team member to directly provision',
    example: 'maxwell@enterprise.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'First name of the team member',
    example: 'Maxwell',
  })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({
    description: 'Last name of the team member',
    example: 'Edison',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    enum: TeamRole,
    default: TeamRole.MEMBER,
    description: 'Team role: MEMBER (standard) or ADMIN (delegated manager)',
  })
  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;

  @ApiPropertyOptional({
    description: 'Initial password for the member. Auto-generated if omitted.',
    example: 'TempPass2026!',
  })
  @IsOptional()
  @IsString()
  password?: string;
}

export class BulkCreateTeamMembersDto {
  @ApiProperty({
    type: [CreateTeamMemberDto],
    description:
      'Array of team members to directly provision into enterprise workspace',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTeamMemberDto)
  members!: CreateTeamMemberDto[];
}
