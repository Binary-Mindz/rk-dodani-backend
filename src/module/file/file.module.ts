import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { PrismaService } from '../../prisma/prisma.service';


@Module({
  imports: [ConfigModule],
  controllers: [FileController],
  providers: [
    FileService,
    CloudinaryService,
    PrismaService,
  ],
  exports: [FileService, CloudinaryService],
})
export class FileModule { }