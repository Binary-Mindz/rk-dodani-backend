import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleCode } from '@prisma/client';
import { Roles } from 'common/decorators/roles.decorator';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { UpdateNavLinkDto } from './dto/update-nav-link.dto';
import { NavLinkService } from './nav-link.service';

@ApiTags('Nav Links')
@Controller()
export class NavLinkController {
  constructor(private readonly service: NavLinkService) {}

  @Get('nav-links')
  @ApiOperation({ summary: 'Get nav link visibility config (Public)' })
  async get() {
    const data = await this.service.get();
    return { statusCode: 200, message: 'Nav links fetched successfully', data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Patch('admin/nav-links')
  @ApiOperation({ summary: 'Update nav link visibility config' })
  async update(@Body() dto: UpdateNavLinkDto) {
    const data = await this.service.update(dto);
    return { statusCode: 200, message: 'Nav links updated successfully', data };
  }
}
