import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser('id') userId: string) {
    return {
      message: 'Current user profile retrieved successfully',
      data: await this.usersService.getProfile(userId),
    };
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateProfileDto })
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return {
      message: 'Profile updated successfully',
      data: await this.usersService.updateProfile(userId, updateProfileDto),
    };
  }

  @Post('change-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change user password by validating old password' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(userId, changePasswordDto);
    return {
      message: 'Password changed successfully',
    };
  }
}
