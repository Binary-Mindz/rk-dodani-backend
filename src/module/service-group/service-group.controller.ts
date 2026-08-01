import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleCode } from '@prisma/client';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { CreateServiceGroupDto } from './dto/create-service-group.dto';
import { QueryServiceGroupDto } from './dto/query-service-group.dto';
import { UpdateServiceGroupDto } from './dto/update-service-group.dto';
import { ServiceGroupService } from './service-group.service';

@ApiTags('Service Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleCode.SUPER_ADMIN)
@Controller('admin/service-groups')
export class ServiceGroupController {
  constructor(private readonly service: ServiceGroupService) {}

  @Post()
  @ApiOperation({ summary: 'Create service group' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateServiceGroupDto) {
    const data = await this.service.create(userId, dto);
    return { statusCode: 201, message: 'Service group created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Get service groups' })
  async findAll(@Query() query: QueryServiceGroupDto) {
    const data = await this.service.findAll(query);
    return { statusCode: 200, message: 'Service groups fetched successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service group by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return { statusCode: 200, message: 'Service group fetched successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service group' })
  async update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateServiceGroupDto) {
    const data = await this.service.update(userId, id, dto);
    return { statusCode: 200, message: 'Service group updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service group' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const data = await this.service.remove(userId, id);
    return { statusCode: 200, message: 'Service group deleted successfully', data };
  }
}
