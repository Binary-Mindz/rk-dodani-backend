import { Module } from '@nestjs/common';
import { PatreonController } from './patreon.controller';
import { PatreonService } from './patreon.service';
import { PatreonSyncService } from './patreon-sync.service';
import { PatreonOAuthService } from './patreon-oauth.service';



@Module({
  controllers: [PatreonController],
  providers: [
    PatreonOAuthService,
    PatreonService,
    PatreonSyncService,
  ],
  exports: [
    PatreonService,
    PatreonSyncService,
  ],
})
export class PatreonModule {}