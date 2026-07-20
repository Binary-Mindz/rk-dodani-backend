import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAlertDto, UpdateAlertDto } from './dto/alert-validation.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AlertService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private audit(
    actorUserId: string | null,
    entityType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues?: any,
    newValues?: any,
  ) {
    this.auditService
      .logCustom({
        actorUserId,
        entityType,
        entityId,
        action: action as any,
        oldValues,
        newValues,
      })
      .catch(() => {});
  }

  // create new alert
  async create_new_alert_into_db(data: CreateAlertDto) {
    const res = await this.prisma.alert.create({
      data: {
        message: data?.message,
        alertType: data?.alertType,
        alertMethod: data?.alertMethod,
      },
    });
    this.audit(null, 'ALERT', res.id, 'CREATE', undefined, {
      message: data.message,
      alertType: data.alertType,
    });
    return res;
  }

  // get all alerts with pagination (public)
  async get_all_alerts_from_db(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const alerts = await this.prisma.alert.findMany({
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: 'desc', // last create first order
      },
    });

    const total = await this.prisma.alert.count();

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: alerts,
    };
  }

  // update alert by id
  async update_alert_by_id(id: string, data: UpdateAlertDto) {
    const existing = await this.prisma.alert.findUnique({ where: { id } });
    const res = await this.prisma.alert.update({
      where: { id },
      data: {
        ...data,
        isEdited: true,
      },
    });
    this.audit(
      null,
      'ALERT',
      id,
      'UPDATE',
      { message: existing?.message },
      { message: data.message },
    );
    return res;
  }

  // delete alert by id
  async delete_alert_by_id(id: string) {
    const existing = await this.prisma.alert.findUnique({ where: { id } });
    const res = await this.prisma.alert.delete({
      where: { id },
    });
    this.audit(
      null,
      'ALERT',
      id,
      'DELETE',
      { message: existing?.message },
      undefined,
    );
    return res;
  }
}
