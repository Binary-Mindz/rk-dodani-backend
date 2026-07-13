import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAlertDto, UpdateAlertDto } from './dto/alert-validation.dto';

@Injectable()
export class AlertService {
    constructor(private readonly prisma: PrismaService) { }

    // create new alert
    async create_new_alert_into_db(data: CreateAlertDto) {
        const res = await this.prisma.alert.create({
            data: {
                message: data?.message,
                alertType: data?.alertType,
                alertMethod: data?.alertMethod
            }
        })
        return res
    }

    // get all alerts with pagination (public)
    async get_all_alerts_from_db(page: number, limit: number) {
        const skip = (page - 1) * limit;

        const alerts = await this.prisma.alert.findMany({
            skip: skip,
            take: limit,
            orderBy: {
                createdAt: 'desc' // last create first order
            }
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
        const res = await this.prisma.alert.update({
            where: { id },
            data: {
                ...data,
                isEdited: true // mark as edited
            }
        });
        return res;
    }

    // delete alert by id
    async delete_alert_by_id(id: string) {
        const res = await this.prisma.alert.delete({
            where: { id }
        });
        return res;
    }
}