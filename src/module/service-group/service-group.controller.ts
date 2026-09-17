import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleCode } from '@prisma/client';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { CreateServiceGroupDto } from './dto/create-service-group.dto';
import { QueryServiceGroupDto } from './dto/query-service-group.dto';
import { UpdateServiceGroupDto } from './dto/update-service-group.dto';
import { UpdateServiceGroupStatusDto } from './dto/update-service-group-status.dto';
import { ServiceGroupService } from './service-group.service';

@ApiTags('Service Groups')
@Controller()
export class ServiceGroupController {
  constructor(private readonly service: ServiceGroupService) {}

  @Get('service-groups')
  @ApiOperation({ summary: 'Get all published service groups (Public)' })
  async findAllPublic(@Query() query: QueryServiceGroupDto) {
    const data = await this.service.findAll(query, true);
    return {
      statusCode: 200,
      message: 'Service groups fetched successfully',
      data,
    };
  }

  @Get('service-groups/:id')
  @ApiOperation({ summary: 'Get published service group by ID (Public)' })
  async findOnePublic(@Param('id') id: string) {
    const data = await this.service.findOne(id, true);
    return {
      statusCode: 200,
      message: 'Service group fetched successfully',
      data,
    };
  }

  @Post('admin/service-groups')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create service group' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateServiceGroupDto,
  ) {
    const data = await this.service.create(userId, dto);
    return {
      statusCode: 201,
      message: 'Service group created successfully',
      data,
    };
  }

  @Get('admin/service-groups')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all service groups for admin' })
  async findAll(@Query() query: QueryServiceGroupDto) {
    const data = await this.service.findAll(query, false);
    return {
      statusCode: 200,
      message: 'Service groups fetched successfully',
      data,
    };
  }

  @Get('admin/service-groups/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get service group by ID for admin' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id, false);
    return {
      statusCode: 200,
      message: 'Service group fetched successfully',
      data,
    };
  }

  @Patch('admin/service-groups/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update service group' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceGroupDto,
  ) {
    const data = await this.service.update(userId, id, dto);
    return {
      statusCode: 200,
      message: 'Service group updated successfully',
      data,
    };
  }

  @Patch('admin/service-groups/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update service group status (DRAFT, PUBLISHED, etc.)',
  })
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceGroupStatusDto,
  ) {
    const data = await this.service.updateStatus(userId, id, dto.status);
    return {
      statusCode: 200,
      message: 'Service group status updated successfully',
      data,
    };
  }

  @Delete('admin/service-groups/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete service group' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const data = await this.service.remove(userId, id);
    return {
      statusCode: 200,
      message: 'Service group deleted successfully',
      data,
    };
  }
}
