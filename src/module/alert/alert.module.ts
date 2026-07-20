import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AlertController],
  providers: [AlertService, PrismaService],
  exports: [AlertService],
})
export class AlertModule {}
