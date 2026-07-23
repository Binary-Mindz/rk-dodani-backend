import { Controller, Get, Param, UseGuards, Patch, Delete, Body, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { TeamService } from './team.service';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { GetTeamMembersDto } from './dto/get-team-members.dto';

@ApiTags('Team Management - Dashboard')
@Controller('team')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleCode.ENTERPRISE, UserRoleCode.SUPER_ADMIN)
export class TeamDashboardController {
  constructor(private readonly teamService: TeamService) {}

  @ApiBearerAuth()
  @Get('users')
  @ApiOperation({ summary: 'Get list of users' })
  async getUsers(@Query() query: GetTeamMembersDto) {
    const data = await this.teamService.getUsers(query);
    return {
      statusCode: 200,
      message: 'Users fetched successfully',
      data,
    };
  }


  @ApiBearerAuth()
  @Get('metrics')
  @ApiOperation({ summary: 'Get B2B team metrics (seat utilization, active sessions)' })
  async getMetrics(@CurrentUser('id') userId: string) {
    const data = await this.teamService.getTeamMetrics(userId);
    return {
      statusCode: 200,
      message: 'Team metrics fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Get('members')
  @ApiOperation({ summary: 'Get list of B2B team members' })
  async getMembers(
    @CurrentUser('id') userId: string,
    @Query() query: GetTeamMembersDto,
  ) {
    const data = await this.teamService.getTeamMembers(userId, query);
    return {
      statusCode: 200,
      message: 'Team members fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Get('activity-feedback')
  @ApiOperation({ summary: 'Get last rated maximum 10 content items for enterprise team members (Team Member Activity & Feedback)' })
  async getTeamActivityFeedback(
    @CurrentUser('id') userId: string,
    @Query() query: GetTeamMembersDto,
  ) {
    const data = await this.teamService.getTeamActivityFeedback(userId, query);
    return {
      statusCode: 200,
      message: 'Team member activity & feedback fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Get('members/:userId/activity')
  @ApiOperation({ summary: 'Get detailed interaction and activity logs for a specific team member' })
  async getMemberActivity(
    @CurrentUser('id') userId: string,
    @Param('userId') targetUserId: string,
  ) {
    const data = await this.teamService.getTeamMemberActivityData(userId, targetUserId);
    return {
      statusCode: 200,
      message: 'Team member activity details fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Patch('members/:userId/role')
  @ApiOperation({ summary: 'Update a team member\'s role' })
  async updateMemberRole(
    @CurrentUser('id') userId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const data = await this.teamService.updateTeamMemberRole(userId, targetUserId, dto.role);
    return {
      statusCode: 200,
      message: 'Team member role updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Delete('members/:userId')
  @ApiOperation({ summary: 'Remove a user from the team' })
  async removeMember(
    @CurrentUser('id') userId: string,
    @Param('userId') targetUserId: string,
  ) {
    const data = await this.teamService.removeTeamMember(userId, targetUserId);
    return {
      statusCode: 200,
      message: 'Team member removed successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Get('all-ctos')
  @ApiOperation({ summary: 'Get all CTOs (Enterprise plan users)' })
  async getAllCtos() {
    const data = await this.teamService.getAllCtos();
    return {
      statusCode: 200,
      message: 'All CTOs fetched successfully',
      data,
    };
  }
}
