import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { TeamService } from './team.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JoinTeamRequestDto } from './dto/join-team-request.dto';

@ApiTags('Team Management - Onboarding')
@Controller('team')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamOnboardingController {
  constructor(private readonly teamService: TeamService) {}

  @ApiBearerAuth()
  @Roles(UserRoleCode.ENTERPRISE, UserRoleCode.SUPER_ADMIN)
  @Post('invitations')
  @ApiOperation({ summary: 'Invite a new member to the team' })
  async inviteMember(
    @CurrentUser('id') userId: string,
    @Body() dto: InviteMemberDto,
  ) {
    const data = await this.teamService.inviteMember(userId, dto);
    return {
      statusCode: 201,
      message: 'Team member invited successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Roles(UserRoleCode.STUDENT, UserRoleCode.ENTERPRISE, UserRoleCode.SUPER_ADMIN)
  @Post('invitations/accept')
  @ApiOperation({ summary: 'Accept a B2B team invitation' })
  async acceptInvitation(
    @CurrentUser('id') userId: string,
    @Body() dto: AcceptInvitationDto,
  ) {
    const data = await this.teamService.acceptInvitation(userId, dto.token);
    return {
      statusCode: 200,
      message: 'Invitation accepted successfully and joined the B2B team',
      data,
    };
  }

  @ApiBearerAuth()
  @Roles(UserRoleCode.ENTERPRISE, UserRoleCode.SUPER_ADMIN)
  @Post("bulk-approve")
  @ApiOperation({summary:"Accept all pending members"})
  async bulkApprove(@CurrentUser('id') userId:string){
    const data = await this.teamService.bulkApprove(userId);
    return {
      statusCode: 200,
      message: 'Team members approved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Roles(UserRoleCode.STUDENT, UserRoleCode.ENTERPRISE, UserRoleCode.SUPER_ADMIN)
  @Get('discover')
  @ApiOperation({ summary: 'Discover active B2B teams/CTOs matching the user\'s email domain suffix' })
  async discoverTeams(
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.teamService.discoverOrganizationTeams(userId);
    return {
      statusCode: 200,
      message: 'Active organization B2B teams fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Roles(UserRoleCode.STUDENT, UserRoleCode.ENTERPRISE, UserRoleCode.SUPER_ADMIN)
  @Post('join')
  @ApiOperation({ summary: 'Request to join a specific organization B2B team' })
  async requestToJoinTeam(
    @CurrentUser('id') userId: string,
    @Body() dto: JoinTeamRequestDto,
  ) {
    const data = await this.teamService.requestToJoinTeam(userId, dto.ctoUserId);
    return {
      statusCode: 200,
      message: 'Join request submitted successfully. Waiting for admin approval.',
      data,
    };
  }
}
