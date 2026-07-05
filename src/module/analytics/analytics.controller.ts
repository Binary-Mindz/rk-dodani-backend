import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'common/decorators/current-user.decorator';

@ApiTags('Analytics')
@Controller('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('usage-summary')
  @ApiOperation({ summary: 'Get key usage metrics for the dashboard' })
  async getUsageSummary(@CurrentUser('id') userId: string) {
    const data = await this.analyticsService.getUsageSummary(userId);
    return { statusCode: 200, data };
  }

  @Get('consumption-patterns')
  @ApiOperation({ summary: 'Get daily consumption data for the bar chart' })
  async getConsumptionPatterns(
    @CurrentUser('id') userId: string,
    @Query('period') period?: string,
  ) {
    const data = await this.analyticsService.getConsumptionPatterns(userId, period || '7d');
    return { statusCode: 200, data };
  }
}
