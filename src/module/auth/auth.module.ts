import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RolesModule } from '../roles/roles.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from 'module/mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    RolesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (_configService: ConfigService) => ({
        global: false,
      }),
    }),
    RolesModule,
    MailModule

  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}