import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertService {
    // prisma constructor
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

}
