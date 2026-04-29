import { Module } from '@nestjs/common';
import { ContentAccessController } from './content-access.controller';
import { ContentAccessService } from './content-access.service';

@Module({
  controllers: [ContentAccessController],
  providers: [ContentAccessService],
  exports: [ContentAccessService],
})
export class ContentAccessModule {}