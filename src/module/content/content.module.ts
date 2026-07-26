import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { AuditModule } from '../audit/audit.module';
import { ContentAccessModule } from '../content-access/content-access.module';

@Module({
  imports: [AuditModule, ContentAccessModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
