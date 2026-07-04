import { Module as NestModule } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { PrismaService } from 'prisma/prisma.service';

@NestModule({
  controllers: [TicketsController],
  providers: [TicketsService, PrismaService],
  exports: [TicketsService],
})
export class TicketsModule {}