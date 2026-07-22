import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppSettingService } from './app-setting.service';
import { UpsertAppSettingDto } from './dto/upsert-app-setting.dto';
import { QueryAppSettingDto } from './dto/query-app-setting.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';

@ApiTags('App Settings')
@Controller()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleCode.SUPER_ADMIN)
export class AppSettingController {
  constructor(private readonly service: AppSettingService) {}

  @Patch('admin/settings/maintenance')
  @ApiOperation({
    summary: 'Update global maintenance mode (Only Admin)',
    description:
      'Enables or disables system maintenance mode. Automatically broadcasts alerts and notifications to all users.',
  })
  async updateMaintenance(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMaintenanceDto,
  ) {
    const data = await this.service.updateMaintenanceStatus(userId, dto);
    return {
      statusCode: 200,
      message: dto.isUnderMaintenance
        ? 'Website set under maintenance successfully and alerts sent to all users.'
        : 'Website maintenance mode disabled successfully and alerts sent to all users.',
      data,
    };
  }

  @Put('admin/settings')
  @ApiOperation({ summary: 'Create or update app setting' })
  async upsert(
    @CurrentUser('id') userId: string,
    @Body() dto: UpsertAppSettingDto,
  ) {
    const data = await this.service.upsert(userId, dto);
    return { statusCode: 200, message: 'App setting saved successfully', data };
  }

  @Get('admin/settings')
  @ApiOperation({ summary: 'Get admin app settings' })
  async findAdminAll(@Query() query: QueryAppSettingDto) {
    const data = await this.service.findAdminAll(query);
    return { statusCode: 200, message: 'App settings fetched successfully', data };
  }

  @Get('admin/settings/:groupName/:key')
  @ApiOperation({ summary: 'Get single app setting' })
  async findOne(
    @Param('groupName') groupName: string,
    @Param('key') key: string,
  ) {
    const data = await this.service.findOne(groupName, key);
    return { statusCode: 200, message: 'App setting fetched successfully', data };
  }

  @Delete('admin/settings/:groupName/:key')
  @ApiOperation({ summary: 'Delete app setting' })
  async remove(
    @Param('groupName') groupName: string,
    @Param('key') key: string,
  ) {
    const data = await this.service.remove(groupName, key);
    return { statusCode: 200, message: 'App setting deleted successfully', data };
  }
}

@ApiTags('App Settings')
@Controller()
export class AppSettingPublicController {
  constructor(private readonly service: AppSettingService) {}

  @Get('settings/maintenance')
  @ApiOperation({
    summary: 'Get global maintenance mode status (Public)',
    description: 'Check if website is currently under maintenance.',
  })
  async getMaintenanceStatus() {
    const data = await this.service.getMaintenanceStatus();
    return {
      statusCode: 200,
      message: 'Maintenance status fetched successfully',
      data,
    };
  }

  @Get('settings/public')
  @ApiOperation({ summary: 'Get public app settings' })
  async findPublicAll(@Query() query: QueryAppSettingDto) {
    const data = await this.service.findPublicAll(query);
    return { statusCode: 200, message: 'Public app settings fetched successfully', data };
  }
}
