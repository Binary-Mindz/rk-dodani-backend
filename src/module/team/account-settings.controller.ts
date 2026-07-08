import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { TeamService } from './team.service';

@ApiTags('Team Management - Account Settings')
@Controller('team')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleCode.ENTERPRISE, UserRoleCode.SUPER_ADMIN)
export class AccountSettingsController {
  constructor(private readonly teamService: TeamService) {}

  @ApiBearerAuth()
  @Get('account-settings')
  @ApiOperation({ summary: 'Get aggregated data for Account Settings dashboard page (stats and pending domain registrations)' })
  async getAccountSettingsPageData(@CurrentUser('id') userId: string) {
    const data = await this.teamService.getAccountSettingsPageData(userId);
    return {
      statusCode: 200,
      message: 'Account settings page data fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Get('pending-registrations')
  @ApiOperation({ summary: 'Get pending registrations matching the company domain suffix' })
  async getPendingRegistrations(@CurrentUser('id') userId: string) {
    const data = await this.teamService.getPendingRegistrations(userId);
    return {
      statusCode: 200,
      message: 'Pending domain registrations fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Post('registrations/:userId/approve')
  @ApiOperation({ summary: 'Approve pending registration and add user to team' })
  async approveMember(
    @CurrentUser('id') userId: string,
    @Param('userId') targetUserId: string,
  ) {
    const data = await this.teamService.approveTeamMember(userId, targetUserId);
    return {
      statusCode: 200,
      message: 'Team member approved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Post('registrations/:userId/reject')
  @ApiOperation({ summary: 'Reject pending registration or remove user from team' })
  async rejectMember(
    @CurrentUser('id') userId: string,
    @Param('userId') targetUserId: string,
  ) {
    const data = await this.teamService.rejectTeamMember(userId, targetUserId);
    return {
      statusCode: 200,
      message: 'Team member removed/rejected successfully',
      data,
    };
  }
}
