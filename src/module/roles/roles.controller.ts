import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { PermissionGuard } from 'common/guards/permission.guard';
import { PermissionSettings } from 'common/decorators/permission-settings.decorator';

@ApiTags('Role Permissions')
@Controller('admin/roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles(UserRoleCode.SUPER_ADMIN)
@PermissionSettings('settings:manage')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles and their permissions' })
  async getRoles() {
    const data = await this.rolesService.getRoles();
    return {
      statusCode: 200,
      message: 'Roles fetched successfully',
      data,
    };
  }

  @Get(':roleId/permissions')
  @ApiOperation({ summary: 'Get role admin permissions' })
  @ApiParam({ name: 'roleId', example: '6913b56c-1455-4e3f-821f-89234b051c59' })
  async getRolePermissions(@Param('roleId') roleId: string) {
    const data = await this.rolesService.getRolePermissions(roleId);
    return {
      statusCode: 200,
      message: 'Role permissions fetched successfully',
      data,
    };
  }

  @Put(':roleId/permissions')
  @ApiOperation({ summary: 'Update role admin permissions' })
  @ApiParam({ name: 'roleId', example: '6913b56c-1455-4e3f-821f-89234b051c59' })
  async updateRolePermissions(
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    const data = await this.rolesService.updateRolePermissions(roleId, dto);
    return {
      statusCode: 200,
      message: 'Role permissions updated successfully',
      data,
    };
  }
}
