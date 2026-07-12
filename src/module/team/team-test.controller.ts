import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'prisma/prisma.service';
import { CreateRandomMembersDto } from './dto/create-random-members.dto';

import * as bcrypt from 'bcrypt';
import { UserStatus, TeamRole, Prisma } from '@prisma/client';

@ApiTags('Team Management - Testing')
@Controller('team-test')
export class TeamTestController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('random-members')
  @ApiOperation({ summary: 'Create random team members for a given parent user' })
  async createRandomMembers(@Body() dto: CreateRandomMembersDto) {
    const { parentUserId, count = 5 } = dto;

    const parentUser = await this.prisma.user.findUnique({
      where: { id: parentUserId },
    });

    if (!parentUser) {
      return {
        statusCode: 404,
        message: 'Parent user not found',
      };
    }

    const defaultPassword = await bcrypt.hash('Password@123', 10);
    const newUsers: Prisma.UserCreateManyInput[] = [];

    for (let i = 0; i < count; i++) {
      const randomId = Math.floor(Math.random() * 1000000);
      const firstName = `TestUser${randomId}`;
      const lastName = `Member${i}`;
      const email = `testuser${randomId}_${i}@test-team.com`;

      newUsers.push({
        email,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        passwordHash: defaultPassword,
        status: UserStatus.ACTIVE,
        teamRole: TeamRole.MEMBER,
        parentUserId,
        avatarUrl: `https://ui-avatars.com/api/?name=${firstName}+${lastName}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await this.prisma.user.createMany({
      data: newUsers,
    });

    return {
      statusCode: 201,
      message: `Successfully created ${count} random team members for parent user ${parentUserId}`,
      data: newUsers,
    };
  }
}
