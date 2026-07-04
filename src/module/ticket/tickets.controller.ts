import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { UserRoleCode } from '@prisma/client';

import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator'; // আপনার প্রোজেক্টের ডেকোরেটর পাথ অনুযায়ী পরিবর্তন করবেন
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { GetTicketsDto } from './dto/get-tickets.dto';

@ApiTags('SuperAdmin - Support Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleCode.SUPER_ADMIN)
@Controller('superadmin/tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new support ticket (Admin Only)' })
    async createTicket(@Body() createTicketDto: CreateTicketDto, @CurrentUser('id') adminId: string) {
        return {
            message: 'Ticket created successfully',
            data: await this.ticketsService.createTicket(createTicketDto, adminId),
        };
    }

    @Get('dashboard-stats')
    @ApiOperation({ summary: 'Get total, open, in-progress, and closed ticket counter stats' })
    async getDashboardStats() {
        return {
            message: 'Dashboard stats retrieved successfully',
            data: await this.ticketsService.getDashboardStats(),
        };
    }

    @Get()
    @ApiOperation({ summary: 'Get all support tickets with pagination and filters' })
    async getAllTickets(@Query() query: GetTicketsDto) { 
        return this.ticketsService.getAllTickets(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get ticket details by ID' })
    async getTicketDetail(@Param('id') id: string) {
        return {
            message: 'Ticket details retrieved successfully',
            data: await this.ticketsService.getTicketById(id),
        };
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update ticket status, priority, tags, or add a reply' })
    async updateTicket(
        @Param('id') id: string,
        @Body() updateTicketDto: UpdateTicketDto,
        @CurrentUser('id') adminId: string,
    ) {
        return {
            message: 'Ticket updated successfully',
            data: await this.ticketsService.updateTicket(id, updateTicketDto, adminId),
        };
    }
}