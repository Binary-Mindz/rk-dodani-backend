import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebhookLogService } from './webhook-log.service';
import { QueryWebhookLogDto } from './dto/query-webhook-log.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { UserRoleCode } from '@prisma/client';
import { Roles } from 'common/decorators/roles.decorator';


@ApiTags('Webhook Logs')
@Controller('admin/webhook-logs')
export class WebhookLogController {
  constructor(private readonly service: WebhookLogService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get webhook logs' })
  async findAll(@Query() query: QueryWebhookLogDto) {
    const data = await this.service.findAll(query);

    return {
      statusCode: 200,
      message: 'Webhook logs fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get webhook log details' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);

    return {
      statusCode: 200,
      message: 'Webhook log fetched successfully',
      data,
    };
  }
}