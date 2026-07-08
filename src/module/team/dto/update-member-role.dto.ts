import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TeamRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @ApiProperty({
    enum: TeamRole,
    description: 'Role inside the team (ADMIN or MEMBER)',
    example: 'MEMBER',
  })
  @IsEnum(TeamRole, { message: 'Role must be either ADMIN or MEMBER' })
  role!: TeamRole;
}
