import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserManagementService } from './user-management.service';
import { QueryUserManagementDto } from './dto/query-user-management.dto';
import { UpdateUserManagementDto } from './dto/update-user-management.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';

@ApiTags('SuperAdmin User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleCode.SUPER_ADMIN)
@Controller('admin/user-management')
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch all users with tabular mapping matching dashboard grid' })
  @ApiResponse({ status: 200, description: 'User grid list pulled successfully.' })
  async findAll(@Query() query: QueryUserManagementDto) {
    return this.userManagementService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View core comprehensive details of a target user profile' })
  async findOne(@Param('id') id: string) {
    return this.userManagementService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Trigger workflow actions like Suspend User or Edit Assigned Plan' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserManagementDto) {
    return this.userManagementService.update(id, dto);
  }
}