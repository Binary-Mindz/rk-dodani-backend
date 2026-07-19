import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppSettingService } from './app-setting.service';
import { UpsertAppSettingDto } from './dto/upsert-app-setting.dto';
import { QueryAppSettingDto } from './dto/query-app-setting.dto';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { PermissionGuard } from 'common/guards/permission.guard';
import { PermissionSettings } from 'common/decorators/permission-settings.decorator';

@ApiTags('App Settings')
@Controller()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleCode.SUPER_ADMIN)
export class AppSettingController {
  constructor(private readonly service: AppSettingService) {}

  @Put('admin/settings')
  @UseGuards(PermissionGuard)
  @PermissionSettings('settings:manage')
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
  @UseGuards(PermissionGuard)
  @PermissionSettings('settings:manage')
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

  @Get('settings/public')
  @ApiOperation({ summary: 'Get public app settings' })
  async findPublicAll(@Query() query: QueryAppSettingDto) {
    const data = await this.service.findPublicAll(query);
    return { statusCode: 200, message: 'Public app settings fetched successfully', data };
  }
}
