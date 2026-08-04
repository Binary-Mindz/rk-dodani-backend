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
import { ServiceSubmissionService } from './service-submission.service';
import { CreateServiceSubmissionDto } from './dto/create-service-submission.dto';
import { UpdateServiceSubmissionDto } from './dto/update-service-submission.dto';
import { QueryServiceSubmissionDto } from './dto/query-service-submission.dto';

@ApiTags('Service Submissions')
@Controller()
export class ServiceSubmissionController {
  constructor(private readonly serviceSubmissionService: ServiceSubmissionService) {}

  @Post('service-submissions')
  @ApiOperation({ summary: 'Submit a new service request' })
  async create(@Body() dto: CreateServiceSubmissionDto) {
    const data = await this.serviceSubmissionService.create(dto);
    return {
      statusCode: 201,
      message: 'Service submission created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Get('admin/service-submissions')
  @ApiOperation({ summary: 'Get all submitted service requests (Admin)' })
  async findAll(@Query() query: QueryServiceSubmissionDto) {
    const data = await this.serviceSubmissionService.findAll(query);
    return {
      statusCode: 200,
      message: 'Service submissions fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Get('admin/service-submissions/:id')
  @ApiOperation({ summary: 'Get service submission details by ID (Admin)' })
  async findOne(@Param('id') id: string) {
    const data = await this.serviceSubmissionService.findOne(id);
    return {
      statusCode: 200,
      message: 'Service submission fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Patch('admin/service-submissions/:id')
  @ApiOperation({ summary: 'Update a service submission (Admin)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceSubmissionDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.serviceSubmissionService.update(userId, id, dto);
    return {
      statusCode: 200,
      message: 'Service submission updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Delete('admin/service-submissions/:id')
  @ApiOperation({ summary: 'Delete a service submission (Admin)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.serviceSubmissionService.remove(userId, id);
    return {
      statusCode: 200,
      message: 'Service submission deleted successfully',
      data,
    };
  }
}
