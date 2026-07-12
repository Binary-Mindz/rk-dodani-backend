import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserManagementService } from './user-management.service';
import { QueryUserManagementDto } from './dto/query-user-management.dto';
import { UpdateUserManagementDto } from './dto/update-user-management.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ToggleSuspendDto } from './dto/suspend.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

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

@Post(':id/toggle-suspend')
  @ApiOperation({ summary: 'Toggle status between Suspended (BLOCKED) and ACTIVE with accountability logs' })
  @ApiResponse({ status: 200, description: 'User account status toggled successfully.' })
  async toggleSuspendUser(
    @Param('id') id: string,
    @Body() dto: ToggleSuspendDto,
    @CurrentUser('id') adminId: string,
  ) {
    const data = await this.userManagementService.toggleSuspendUser(id, dto, adminId);
    return {
      statusCode: 200,
      message: `User account status has been successfully changed to ${data.status}.`,
      data,
    };
  }

  @Patch('update-subscription/:id')
  @ApiOperation({ summary: 'Update user subscription plan and billing cycle' })
  @ApiResponse({ status: 200, description: 'User subscription updated successfully.' })
  @ApiParam({
    name:"id",
    example:"6913b56c-1455-4e3f-821f-89234b051c59"
  })
  async updateSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
    @CurrentUser('id') adminId: string,
  ) {
    const data = await this.userManagementService.updateUserSubscription(id, dto, adminId);
    return {
      statusCode: 200,
      message: 'User subscription updated successfully.',
      data,
    };
  }
}