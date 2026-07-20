import { Module } from '@nestjs/common';
import { PatreonController } from './patreon.controller';
import { PatreonService } from './patreon.service';
import { PatreonSyncService } from './patreon-sync.service';
import { PatreonOAuthService } from './patreon-oauth.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [PatreonController],
  providers: [PatreonOAuthService, PatreonService, PatreonSyncService],
  exports: [PatreonService, PatreonSyncService],
})
export class PatreonModule {}
