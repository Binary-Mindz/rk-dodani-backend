import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserManagementService } from './user-management.service';
import { QueryUserManagementDto } from './dto/query-user-management.dto';
import { UpdateUserManagementDto } from './dto/update-user-management.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('SuperAdmin User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleCode.SUPER_ADMIN)
@Controller('admin/user-management')
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) { }

  @Get()
  @ApiOperation({ summary: 'Fetch all users with tabular mapping matching dashboard grid' })
  async findAll(@Query() query: QueryUserManagementDto) {
    return this.userManagementService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View core comprehensive details of a target user profile (Mapped for detail grid side drawer)' })
  async findOne(@Param('id') id: string) {
    return this.userManagementService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit Assigned Plan, change Billing Cycles & update core profile properties' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserManagementDto,
    @CurrentUser('id') userId: string
  ) {
    const data = await this.userManagementService.update(id, dto, userId);
    return {
      statusCode: 200,
      message: 'User profile tracking and plan schema updated successfully',
      data,
    };
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Trigger workflow action to Suspend User Account immediately' })
  @ApiResponse({ status: 200, description: 'User profile suspended and all Active sessions/subscriptions revoked.' })
  async suspendUser(@Param('id') id: string,  @CurrentUser('id') userId: string) {
    const data = await this.userManagementService.suspendUser(id, userId);
    return {
      statusCode: 200,
      message: 'User account has been suspended and notification email queued.',
      data,
    };
  }
}