import { Module } from '@nestjs/common';
import { NavLinkService } from './nav-link.service';
import { NavLinkController } from './nav-link.controller';

@Module({
  controllers: [NavLinkController],
  providers: [NavLinkService],
  exports: [NavLinkService],
})
export class NavLinkModule {}
