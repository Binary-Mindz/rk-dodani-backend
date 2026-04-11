import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from 'module/health/health.module';
import { RolesModule } from 'module/roles/roles.module';
import { AuthModule } from 'module/auth/auth.module';
import { UsersModule } from 'module/users/users.module';
import { MailModule } from 'module/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    HealthModule,
    RolesModule,
    MailModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}