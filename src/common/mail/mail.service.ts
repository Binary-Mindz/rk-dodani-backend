import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { InquiryDto } from './dto/inquiry.dto';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmailVerificationOtp(email: string, otp: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your AgentArum account',
      html: this.buildOtpTemplate({
        title: 'Email Verification',
        heading: 'Verify Your AgentArum Account',
        message: 'Use the verification code below to confirm your email address.',
        otp,
        note: 'This verification code will expire in 5 minutes.',
        accentColor: '#2563eb',
      }),
    });
  }

  async sendPasswordResetOtp(email: string, otp: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset your AgentArum password',
      html: this.buildOtpTemplate({
        title: 'Password Reset',
        heading: 'Reset Your Password',
        message: 'Use the OTP below to reset your AgentArum account password.',
        otp,
        note: 'This password reset code will expire in 5 minutes.',
        accentColor: '#dc2626',
      }),
    });
  }

  private buildOtpTemplate(params: {
    title: string;
    heading: string;
    message: string;
    otp: string;
    note: string;
    accentColor: string;
  }): string {
    const {
      title,
      heading,
      message,
      otp,
      note,
      accentColor,
    } = params;

    return `
      <div style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, Helvetica, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f7fb; margin:0; padding:30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px; background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">
                
                <tr>
                  <td style="background:${accentColor}; padding:28px 32px; text-align:center;">
                    <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:700; letter-spacing:0.3px;">
                      AgentArum
                    </h1>
                    <p style="margin:8px 0 0; color:#dbeafe; font-size:14px;">
                      Secure account communication
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px 32px 24px;">
                    <p style="margin:0 0 10px; font-size:13px; font-weight:700; color:${accentColor}; text-transform:uppercase; letter-spacing:1px;">
                      ${title}
                    </p>

                    <h2 style="margin:0 0 14px; font-size:28px; line-height:1.3; color:#111827; font-weight:700;">
                      ${heading}
                    </h2>

                    <p style="margin:0 0 28px; font-size:16px; line-height:1.7; color:#4b5563;">
                      ${message}
                    </p>

                    <div style="margin:0 0 28px; text-align:center;">
                      <div style="
                        display:inline-block;
                        padding:18px 30px;
                        background:#f8fafc;
                        border:2px dashed ${accentColor};
                        border-radius:14px;
                        font-size:34px;
                        line-height:1;
                        font-weight:800;
                        letter-spacing:10px;
                        color:${accentColor};
                      ">
                        ${otp}
                      </div>
                    </div>

                    <div style="margin:0 0 24px; padding:16px 18px; background:#f9fafb; border-left:4px solid ${accentColor}; border-radius:10px;">
                      <p style="margin:0; font-size:14px; line-height:1.7; color:#374151;">
                        ${note}
                      </p>
                    </div>
                    <hr style="border:none; border-top:1px solid #e5e7eb; margin:28px 0;" />

                    <p style="margin:0 0 10px; font-size:14px; color:#6b7280; line-height:1.7;">
                      If you did not request this, you can safely ignore this email.
                    </p>

                    <p style="margin:0; font-size:14px; color:#6b7280; line-height:1.7;">
                      For security reasons, never share this code with anyone.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:22px 32px; background:#f9fafb; text-align:center; border-top:1px solid #e5e7eb;">
                    <p style="margin:0; font-size:13px; color:#9ca3af; line-height:1.6;">
                      © ${new Date().getFullYear()} AgentArum. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  async sendInquiryToAdmin(inquiryData: InquiryDto): Promise<void> {
    const adminEmail = 'ranarasul21@gmail.com';

    await this.mailerService.sendMail({
      to: adminEmail,
      replyTo: inquiryData.workEmail, 
      subject: `New Inquiry: ${inquiryData.inquiryType.toUpperCase()} from ${inquiryData.fullName}`,
      html: this.buildInquiryTemplate(inquiryData),
    });
  }

  private buildInquiryTemplate(data: InquiryDto): string {
    const { company, fullName, inquiryType, message, workEmail } = data;

    return `
      <div style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, Helvetica, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f7fb; margin:0; padding:30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px; background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">
                
                <tr>
                  <td style="background:#2563eb; padding:28px 32px; text-align:center;">
                    <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:700; letter-spacing:0.3px;">
                      AgentArum Admin Notification
                    </h1>
                    <p style="margin:8px 0 0; color:#dbeafe; font-size:14px;">
                      New Contact Form Submission
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px 32px 24px;">
                    <h2 style="margin:0 0 20px; font-size:20px; color:#111827; font-weight:700; border-bottom:2px solid #e5e7eb; padding-bottom:10px;">
                      Inquiry Details
                    </h2>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="padding:8px 0; font-size:14px; font-weight:bold; color:#4b5563; width:120px;">Full Name:</td>
                        <td style="padding:8px 0; font-size:15px; color:#111827;">${fullName}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; font-size:14px; font-weight:bold; color:#4b5563;">Work Email:</td>
                        <td style="padding:8px 0; font-size:15px; color:#2563eb;"><a href="mailto:${workEmail}" style="color:#2563eb; text-decoration:none;">${workEmail}</a></td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; font-size:14px; font-weight:bold; color:#4b5563;">Company:</td>
                        <td style="padding:8px 0; font-size:15px; color:#111827;">${company || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; font-size:14px; font-weight:bold; color:#4b5563;">Inquiry Type:</td>
                        <td style="padding:8px 0; font-size:14px; color:#ffffff;"><span style="background:#2563eb; padding:4px 10px; border-radius:20px; font-weight:600; text-transform:uppercase; font-size:12px;">${inquiryType}</span></td>
                      </tr>
                    </table>

                    <h3 style="margin:0 0 10px; font-size:16px; color:#111827; font-weight:700;">Message:</h3>
                    <div style="margin:0 0 24px; padding:16px 18px; background:#f9fafb; border-left:4px solid #2563eb; border-radius:10px;">
                      <p style="margin:0; font-size:15px; line-height:1.6; color:#374151; white-space: pre-line;">
                        ${message}
                      </p>
                    </div>

                    <hr style="border:none; border-top:1px solid #e5e7eb; margin:28px 0;" />
                    <p style="margin:0; font-size:13px; color:#9ca3af; text-align:center;">
                      This email was automatically generated from the AgentArum website contact form.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:22px 32px; background:#f9fafb; text-align:center; border-top:1px solid #e5e7eb;">
                    <p style="margin:0; font-size:13px; color:#9ca3af; line-height:1.6;">
                      © ${new Date().getFullYear()} AgentArum. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </div>
    `;
  }
}