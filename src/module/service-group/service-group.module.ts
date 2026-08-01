import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ServiceGroupController } from './service-group.controller';
import { ServiceGroupService } from './service-group.service';

@Module({
  imports: [AuditModule],
  controllers: [ServiceGroupController],
  providers: [ServiceGroupService],
  exports: [ServiceGroupService],
})
export class ServiceGroupModule {}
