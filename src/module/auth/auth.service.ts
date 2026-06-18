import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthProviderType,
  OtpPurpose,
  UserRoleCode,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RolesService } from '../roles/roles.service';
import { MailService } from '../../common/mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'prisma/prisma.service';
import { JwtPayload } from 'common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;
  private readonly otpExpiryMinutes = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rolesService: RolesService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (!existingUser.emailVerified) {
        await this.createAndSendOtp(
          existingUser.id,
          existingUser.email,
          OtpPurpose.EMAIL_VERIFICATION,
        );

        return {
          message:
            'This email is already registered but not verified. A new verification OTP has been sent.',
          data: {
            userId: existingUser.id,
            email: existingUser.email,
            status: existingUser.status,
          },
        };
      }

      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const fullName = [dto.firstName, dto.lastName].filter(Boolean).join(' ') || null;

    // 💡 No Role is Assigned upon Registration. User is completely roleless until subscription payment.
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        fullName,
        phone: dto.phone ?? null,
        status: UserStatus.PENDING_VERIFICATION,
        signupSource: AuthProviderType.LOCAL,
      },
    });

    await this.createAndSendOtp(
      user.id,
      user.email,
      OtpPurpose.EMAIL_VERIFICATION,
    );

    return {
      message: 'Registration successful. Verification OTP sent to your email.',
      data: {
        userId: user.id,
        email: user.email,
        status: user.status,
      },
    };
  }

  async verifyEmailOtp(email: string, otp: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otpRecord = await this.getLatestValidOtp(
      user.id,
      normalizedEmail,
      OtpPurpose.EMAIL_VERIFICATION,
    );

    const matched = await bcrypt.compare(otp, otpRecord.otpCodeHash);

    if (!matched) {
      await this.incrementOtpAttempt(otpRecord.id);
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.$transaction([
      this.prisma.userOtp.update({
        where: { id: otpRecord.id },
        data: {
          verifiedAt: new Date(),
          usedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          status: UserStatus.ACTIVE,
        },
      }),
    ]);

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        roles: {
          where: { isActive: true },
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerified || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Please verify your email before login');
    }

    const passwordMatched = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const roles = this.extractRoleCodes(user.roles);
    const tokens = await this.generateTokens(user.id, user.email, roles);

    await this.saveRefreshSession(user.id, tokens.refreshToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    return {
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          roles,
        },
        ...tokens,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const decoded = await this.verifyRefreshToken(refreshToken);

    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId: decoded.sub,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let matchedSession: { id: string } | null = null;

    for (const session of sessions) {
      const matched = await bcrypt
        .compare(refreshToken, session.refreshTokenHash)
        .catch(() => false);
      if (matched) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        roles: {
          where: { isActive: true },
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.emailVerified || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.prisma.userSession.update({
      where: { id: matchedSession.id },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    const roles = this.extractRoleCodes(user.roles);
    const tokens = await this.generateTokens(user.id, user.email, roles);
    await this.saveRefreshSession(user.id, tokens.refreshToken);

    return {
      message: 'Token refreshed successfully',
      data: tokens,
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return {
        message: 'If the email exists, a password reset OTP has been sent.',
      };
    }

    await this.createAndSendOtp(
      user.id,
      normalizedEmail,
      OtpPurpose.PASSWORD_RESET,
    );

    return {
      message: 'If the email exists, a password reset OTP has been sent.',
    };
  }

  async verifyPasswordResetOtp(email: string, otp: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otpRecord = await this.getLatestValidOtp(
      user.id,
      normalizedEmail,
      OtpPurpose.PASSWORD_RESET,
    );

    const matched = await bcrypt.compare(otp, otpRecord.otpCodeHash);

    if (!matched) {
      await this.incrementOtpAttempt(otpRecord.id);
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.userOtp.update({
      where: { id: otpRecord.id },
      data: {
        verifiedAt: new Date(),
      },
    });

    return {
      message: 'Password reset OTP verified successfully',
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otpRecord = await this.getLatestValidOtp(
      user.id,
      normalizedEmail,
      OtpPurpose.PASSWORD_RESET,
    );

    const matched = await bcrypt.compare(otp, otpRecord.otpCodeHash);

    if (!matched) {
      await this.incrementOtpAttempt(otpRecord.id);
      throw new BadRequestException('Invalid OTP');
    }

    const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
        },
      }),
      this.prisma.userOtp.update({
        where: { id: otpRecord.id },
        data: {
          verifiedAt: otpRecord.verifiedAt ?? new Date(),
          usedAt: new Date(),
        },
      }),
      this.prisma.userSession.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    return {
      message: 'Password reset successfully',
    };
  }

  private async createAndSendOtp(
    userId: string,
    email: string,
    purpose: OtpPurpose,
  ) {
    const otp = this.generateOtp();
    const otpCodeHash = await bcrypt.hash(otp, this.saltRounds);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.otpExpiryMinutes);

    await this.prisma.userOtp.create({
      data: {
        userId,
        email,
        purpose,
        otpCodeHash,
        expiresAt,
      },
    });

    if (purpose === OtpPurpose.EMAIL_VERIFICATION) {
      await this.mailService.sendEmailVerificationOtp(email, otp);
    }

    if (purpose === OtpPurpose.PASSWORD_RESET) {
      await this.mailService.sendPasswordResetOtp(email, otp);
    }
  }

  private async getLatestValidOtp(
    userId: string,
    email: string,
    purpose: OtpPurpose,
  ) {
    const otpRecord = await this.prisma.userOtp.findFirst({
      where: {
        userId,
        email,
        purpose,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('OTP not found or expired');
    }

    return otpRecord;
  }

  private async incrementOtpAttempt(otpId: string) {
    await this.prisma.userOtp.update({
      where: { id: otpId },
      data: {
        attemptCount: {
          increment: 1,
        },
      },
    });
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private extractRoleCodes(
    userRoles: Array<{ role: { code: UserRoleCode } }>,
  ): UserRoleCode[] {
    return userRoles.map((item) => item.role.code);
  }

  private async generateTokens(
    userId: string,
    email: string,
    roles: UserRoleCode[],
  ) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      roles,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '1d',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshSession(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.saltRounds);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt,
      },
    });
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}