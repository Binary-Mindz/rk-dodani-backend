import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { TeamService } from './team.service';

@ApiTags('Team Management - Usage & Engagement')
@Controller('team')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleCode.ENTERPRISE, UserRoleCode.SUPER_ADMIN)
export class UsageEngagementController {
  constructor(private readonly teamService: TeamService) {}

  @ApiBearerAuth()
  @Get('usage-engagement')
  @ApiOperation({ summary: 'Get usage and engagement analytics data (self activity or team metrics)' })
  @ApiQuery({
    name: 'mode',
    required: false,
    enum: ['self', 'team'],
    description: 'Filter analytics to either "self" (personal activity) or "team" (overall team interactions)',
  })
  async getUsageEngagementData(
    @CurrentUser('id') userId: string,
    @Query('mode') mode?: 'self' | 'team',
  ) {
    const data = await this.teamService.getUsageEngagementData(userId, mode || 'team');
    return {
      statusCode: 200,
      message: 'Usage & engagement analytics data fetched successfully',
      data,
    };
  }
}
