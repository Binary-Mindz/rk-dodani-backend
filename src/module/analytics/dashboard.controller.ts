import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { TeamService } from 'module/team/team.service';

@ApiTags('Analytics - Dashboard')
@Controller('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly teamService: TeamService) {}

  @Get('dashboard')
  @Roles(UserRoleCode.ENTERPRISE)
  @ApiOperation({ summary: 'Get aggregated data for CTO dashboard page' })
  async getCTODashboardPageData(@CurrentUser('id') userId: string) {
    const data = await this.teamService.getCTODashboardPageData(userId);
    return {
      statusCode: 200,
      message: 'CTO dashboard page data fetched successfully',
      data,
    };
  }

  @Get('member-dashboard')
  @Roles(UserRoleCode.STUDENT, UserRoleCode.ENTERPRISE, UserRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get aggregated dashboard data for a team member' })
  async getMemberDashboardPageData(@CurrentUser('id') userId: string) {
    const data = await this.teamService.getMemberDashboardPageData(userId);
    return {
      statusCode: 200,
      message: 'Team member dashboard data fetched successfully',
      data,
    };
  }
}
