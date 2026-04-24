import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { ContactInquiryService } from './contact-inquiry.service';
import { CreateContactInquiryDto } from './dto/create-contact-inquiry.dto';
import { QueryAdminContactInquiryDto } from './dto/query-admin-contact-inquiry.dto';
import { UpdateInquiryStatusDto } from './dto/update-inquiry-status.dto';
import { AssignInquiryDto } from './dto/assign-inquiry.dto';
import { AddInquiryNoteDto } from './dto/add-inquiry-note.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { RolesGuard } from 'common/guards/roles.guard';


@ApiTags('Contact Inquiries')
@Controller()
export class ContactInquiryController {
  constructor(private readonly service: ContactInquiryService) {}

  @Post('contact/inquiries')
  @ApiOperation({ summary: 'Submit public contact inquiry' })
  async createPublic(
    @Body() dto: CreateContactInquiryDto,
    @Req() req: Request,
  ) {
    const data = await this.service.createPublic(dto, {
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      relatedUserId: null,
    });

    return {
      statusCode: 201,
      message: 'Inquiry submitted successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.SUPPORT)
  @Get('admin/inquiries')
  @ApiOperation({ summary: 'Get admin inquiry list' })
  async findAdminAll(@Query() query: QueryAdminContactInquiryDto) {
    const data = await this.service.findAdminAll(query);

    return {
      statusCode: 200,
      message: 'Inquiries fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.SUPPORT)
  @Get('admin/inquiries/:id')
  @ApiOperation({ summary: 'Get inquiry details' })
  async findAdminOne(@Param('id') id: string) {
    const data = await this.service.findAdminOne(id);

    return {
      statusCode: 200,
      message: 'Inquiry fetched successfully',
      data,
    };
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.SUPPORT)
  @Patch('admin/inquiries/:id/assign')
  @ApiOperation({ summary: 'Assign inquiry to a user' })
  async assign(@Param('id') id: string, @Body() dto: AssignInquiryDto) {
    const data = await this.service.assign(id, null, dto);

    return {
      statusCode: 200,
      message: 'Inquiry assigned successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.SUPPORT)
  @Patch('admin/inquiries/:id/status')
  @ApiOperation({ summary: 'Update inquiry status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInquiryStatusDto,
  ) {
    const data = await this.service.updateStatus(id, null, dto);

    return {
      statusCode: 200,
      message: 'Inquiry status updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.SUPPORT)
  @Post('admin/inquiries/:id/note')
  @ApiOperation({ summary: 'Add note to inquiry' })
  async addNote(@Param('id') id: string, @Body() dto: AddInquiryNoteDto) {
    const data = await this.service.addNote(id, null, dto);

    return {
      statusCode: 200,
      message: 'Inquiry note added successfully',
      data,
    };
  }
}
