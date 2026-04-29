import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InquiryActivityType,
  InquiryStatus,
  Prisma,
} from '@prisma/client';
import { CreateContactInquiryDto } from './dto/create-contact-inquiry.dto';
import { QueryAdminContactInquiryDto } from './dto/query-admin-contact-inquiry.dto';
import { UpdateInquiryStatusDto } from './dto/update-inquiry-status.dto';
import { AssignInquiryDto } from './dto/assign-inquiry.dto';
import { AddInquiryNoteDto } from './dto/add-inquiry-note.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ContactInquiryService {
  constructor(private readonly prisma: PrismaService) {}

  private async createActivity(params: {
    inquiryId: string;
    actionType: InquiryActivityType;
    oldValue?: any;
    newValue?: any;
    note?: string | null;
    performedById?: string | null;
  }) {
    await this.prisma.inquiryActivity.create({
      data: {
        inquiryId: params.inquiryId,
        actionType: params.actionType,
        oldValue: params.oldValue ?? null,
        newValue: params.newValue ?? null,
        note: params.note ?? null,
        performedById: params.performedById ?? null,
      },
    });
  }

  async createPublic(
    dto: CreateContactInquiryDto,
    meta?: {
      ipAddress?: string | null;
      userAgent?: string | null;
      relatedUserId?: string | null;
    },
  ) {
    const inquiry = await this.prisma.contactInquiry.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? null,
        company: dto.company ?? null,
        jobTitle: dto.jobTitle ?? null,
        country: dto.country ?? null,
        subject: dto.subject ?? null,
        message: dto.message,
        inquiryType: dto.inquiryType,
        source: dto.source ?? null,
        priority: dto.priority ?? 'NORMAL',
        relatedUserId: meta?.relatedUserId ?? null,
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
      },
    });

    await this.createActivity({
      inquiryId: inquiry.id,
      actionType: InquiryActivityType.CREATED,
      newValue: {
        status: inquiry.status,
        inquiryType: inquiry.inquiryType,
        priority: inquiry.priority,
      },
      note: 'Inquiry created from public form',
      performedById: null,
    });

    return inquiry;
  }

  async findAdminAll(query: QueryAdminContactInquiryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ContactInquiryWhereInput = {
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { company: { contains: query.search, mode: 'insensitive' } },
              { subject: { contains: query.search, mode: 'insensitive' } },
              { message: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.inquiryType ? { inquiryType: query.inquiryType } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assignedToId ? { assignedToId: query.assignedToId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contactInquiry.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, fullName: true, email: true },
          },
          relatedUser: {
            select: { id: true, fullName: true, email: true },
          },
          _count: {
            select: { activities: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.contactInquiry.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAdminOne(id: string) {
    const inquiry = await this.prisma.contactInquiry.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, fullName: true, email: true },
        },
        relatedUser: {
          select: { id: true, fullName: true, email: true },
        },
        activities: {
          include: {
            performedBy: {
              select: { id: true, fullName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    return inquiry;
  }

  async assign(inquiryId: string, performedById: string | null, dto: AssignInquiryDto) {
    const inquiry = await this.prisma.contactInquiry.findUnique({
      where: { id: inquiryId },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    const assignee = await this.prisma.user.findUnique({
      where: { id: dto.assignedToId },
    });

    if (!assignee) {
      throw new BadRequestException('Assigned user not found');
    }

    const updated = await this.prisma.contactInquiry.update({
      where: { id: inquiryId },
      data: {
        assignedToId: dto.assignedToId,
      },
      include: {
        assignedTo: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    await this.createActivity({
      inquiryId,
      actionType: InquiryActivityType.ASSIGNED,
      oldValue: { assignedToId: inquiry.assignedToId },
      newValue: { assignedToId: dto.assignedToId },
      note: dto.note ?? null,
      performedById,
    });

    return updated;
  }

  async updateStatus(
    inquiryId: string,
    performedById: string | null,
    dto: UpdateInquiryStatusDto,
  ) {
    const inquiry = await this.prisma.contactInquiry.findUnique({
      where: { id: inquiryId },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    const updateData: Prisma.ContactInquiryUpdateInput = {
      status: dto.status,
    };

    if (dto.status === InquiryStatus.CONTACTED && !inquiry.respondedAt) {
      updateData.respondedAt = new Date();
    }

    if (
      dto.status === InquiryStatus.CLOSED ||
      dto.status === InquiryStatus.SPAM
    ) {
      updateData.closedAt = new Date();
    }

    const updated = await this.prisma.contactInquiry.update({
      where: { id: inquiryId },
      data: updateData,
    });

    await this.createActivity({
      inquiryId,
      actionType: InquiryActivityType.STATUS_CHANGED,
      oldValue: { status: inquiry.status },
      newValue: { status: dto.status },
      note: dto.note ?? null,
      performedById,
    });

    return updated;
  }

  async addNote(
    inquiryId: string,
    performedById: string | null,
    dto: AddInquiryNoteDto,
  ) {
    const inquiry = await this.prisma.contactInquiry.findUnique({
      where: { id: inquiryId },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    const combinedAdminNotes = inquiry.adminNotes
      ? `${inquiry.adminNotes}\n\n${dto.note}`
      : dto.note;

    const updated = await this.prisma.contactInquiry.update({
      where: { id: inquiryId },
      data: {
        adminNotes: combinedAdminNotes,
      },
    });

    await this.createActivity({
      inquiryId,
      actionType: InquiryActivityType.NOTE_ADDED,
      note: dto.note,
      performedById,
    });

    return updated;
  }
}