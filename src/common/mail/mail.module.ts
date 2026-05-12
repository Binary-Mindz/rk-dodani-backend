import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule,

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('MailModule');

        const host = configService.getOrThrow<string>('MAIL_HOST');
        const port = Number(
          configService.getOrThrow<string>('MAIL_PORT'),
        );
        const user = configService.getOrThrow<string>('MAIL_USER');
        const from = configService.getOrThrow<string>('MAIL_FROM');

        logger.log(`Initializing mail service...`);
        logger.log(`MAIL_HOST: ${host}`);
        logger.log(`MAIL_PORT: ${port}`);
        logger.log(`MAIL_USER: ${user}`);
        logger.log(`MAIL_FROM: ${from}`);
        logger.log(
          `MAIL_SECURE: ${port === 465 ? 'true' : 'false'}`,
        );

        return {
          transport: {
            host,
            port,
            secure: false,
            requireTLS: true,
            auth: {
              user,
              pass: configService.getOrThrow<string>('MAIL_PASSWORD'),
            },
            tls: {
              rejectUnauthorized: false,
            },
          },
          defaults: {
            from,
          },
        };
      },
    }),
  ],

  providers: [MailService],

  exports: [MailService],
})
export class MailModule { }