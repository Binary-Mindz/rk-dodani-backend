import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { UserRoleCode } from '@prisma/client';
import { Roles } from 'common/decorators/roles.decorator';

@ApiTags('Audit Logs')
@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN )
  @Get()
  @ApiOperation({ summary: 'Get audit logs' })
  async findAll(@Query() query: QueryAuditLogDto) {
    const data = await this.service.findAll(query);

    return {
      statusCode: 200,
      message: 'Audit logs fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN )
  @Get(':id')
  @ApiOperation({ summary: 'Get audit log details' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);

    return {
      statusCode: 200,
      message: 'Audit log fetched successfully',
      data,
    };
  }
}