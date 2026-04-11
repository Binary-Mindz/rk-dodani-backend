import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmailVerificationOtp(email: string, otp: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your AgentArum account',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>AgentArum Email Verification</h2>
          <p>Your email verification code is:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetOtp(email: string, otp: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset your AgentArum password',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>AgentArum Password Reset</h2>
          <p>Your password reset code is:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });
  }
}