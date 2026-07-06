import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleCode } from '@prisma/client';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { SuperAdminOverviewService } from './super-admin-overview.service';

@ApiTags('SuperAdmin Overview')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleCode.SUPER_ADMIN)
@Controller('admin/overview')
export class SuperAdminOverviewController {
  constructor(private readonly overviewService: SuperAdminOverviewService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get Super Admin overview dashboard key metrics (MRR, Active Paid Users, Conversion Rate, Open Tickets) and growth stats' })
  async getDashboardMetrics() {
    const data = await this.overviewService.getDashboardMetrics();
    return { statusCode: 200, data };
  }

  @Get('content-engagement')
  @ApiOperation({ summary: 'Get top 5 published content items by engagement (downloads or views count)' })
  async getContentEngagement() {
    const data = await this.overviewService.getContentEngagement();
    return { statusCode: 200, data };
  }

  @Get('subscription-retention')
  @ApiOperation({ summary: 'Get cohort subscription retention percentages over the last 6 months' })
  async getSubscriptionRetention() {
    const data = await this.overviewService.getSubscriptionRetention();
    return { statusCode: 200, data };
  }
}
