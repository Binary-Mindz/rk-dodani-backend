import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { UserRoleCode } from '@prisma/client';
import { Roles } from 'common/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

 @Get('me')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: { userId: string }) {
    return {
      message: 'Current user profile retrieved successfully',
      data: await this.usersService.getProfile(user.userId),
    };
  }

}