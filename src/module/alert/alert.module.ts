import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';

@Module({
    controllers: [AlertController],
    providers: [AlertService, PrismaService],
    exports: [AlertService],
})
export class AlertModule { }
