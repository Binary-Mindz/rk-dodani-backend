import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { InquiryType, InquiryActivityType, InquiryStatus, InquiryPriority } from '@prisma/client';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { GetTicketsDto } from './dto/get-tickets.dto';

@Injectable()
export class TicketsService {
    constructor(private readonly prisma: PrismaService) { }

    async createTicket(dto: CreateTicketDto, adminId: string) {
        return this.prisma.$transaction(async (tx) => {
            const ticket = await tx.contactInquiry.create({
                data: {
                    name: dto.name,
                    email: dto.email,
                    subject: dto.subject,
                    message: dto.message,
                    inquiryType: InquiryType.SUPPORT,
                    priority: dto.priority || InquiryPriority.NORMAL,
                    status: InquiryStatus.NEW,
                    assignedToId: adminId,
                    relatedUserId: dto.relatedUserId || null,
                },
            });
            await tx.inquiryActivity.create({
                data: {
                    inquiryId: ticket.id,
                    actionType: InquiryActivityType.CREATED,
                    note: 'Ticket created by SuperAdmin',
                    performedById: adminId,
                },
            });

            return ticket;
        });
    }

    async getDashboardStats() {
        const counts = await this.prisma.contactInquiry.groupBy({
            by: ['status'],
            where: { inquiryType: InquiryType.SUPPORT },
            _count: { id: true },
        });

        let total = 0;
        let open = 0;
        let inProgress = 0;
        let closed = 0;

        counts.forEach((item) => {
            total += item._count.id;
            if (item.status === InquiryStatus.NEW) open += item._count.id;
            if (item.status === InquiryStatus.REVIEWED || item.status === InquiryStatus.CONTACTED || item.status === InquiryStatus.QUALIFIED) {
                inProgress += item._count.id;
            }
            if (item.status === InquiryStatus.CLOSED) closed += item._count.id;
        });

        return { total, open, inProgress, closed };
    }

    async getAllTickets(filters: GetTicketsDto) { 
        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || 10;
        const skip = (page - 1) * limit;

        const whereClause: any = {
            inquiryType: InquiryType.SUPPORT,
        };

        if (filters.status) whereClause.status = filters.status;
        if (filters.priority) whereClause.priority = filters.priority;
        if (filters.search) {
            whereClause.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { subject: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const [totalItems, tickets] = await this.prisma.$transaction([
            this.prisma.contactInquiry.count({ where: whereClause }),
            this.prisma.contactInquiry.findMany({
                where: whereClause,
                include: {
                    relatedUser: {
                        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
        ]);

        return {
            meta: {
                totalItems,
                itemCount: tickets.length,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
            },
            items: tickets,
        };
    }

    async getTicketById(id: string) {
        const ticket = await this.prisma.contactInquiry.findUnique({
            where: { id },
            include: {
                relatedUser: true,
                activities: {
                    include: { performedBy: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!ticket) throw new NotFoundException('Ticket not found');
        return ticket;
    }

    async updateTicket(id: string, dto: UpdateTicketDto, adminId: string) {
        const existingTicket = await this.getTicketById(id);

        return this.prisma.$transaction(async (tx) => {
            const updatedTicket = await tx.contactInquiry.update({
                where: { id },
                data: {
                    status: dto.status ?? existingTicket.status,
                    priority: dto.priority ?? existingTicket.priority,

                    tags: dto.tags !== undefined ? dto.tags : (existingTicket.tags as any),

                    adminNotes: dto.replyMessage ? dto.replyMessage : existingTicket.adminNotes,
                    respondedAt: dto.replyMessage ? new Date() : existingTicket.respondedAt,
                    closedAt: dto.status === InquiryStatus.CLOSED ? new Date() : existingTicket.closedAt,
                },
            });

            if (dto.status && dto.status !== existingTicket.status) {
                await tx.inquiryActivity.create({
                    data: {
                        inquiryId: id,
                        actionType: InquiryActivityType.STATUS_CHANGED,
                        oldValue: { status: existingTicket.status },
                        newValue: { status: dto.status },
                        performedById: adminId,
                    },
                });
            }
            if (dto.replyMessage) {
                await tx.inquiryActivity.create({
                    data: {
                        inquiryId: id,
                        actionType: InquiryActivityType.RESPONDED,
                        note: dto.replyMessage,
                        performedById: adminId,
                    },
                });
            }

            return updatedTicket;
        });
    }
}