import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthProviderType,
  Prisma,
  UserRoleCode,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RolesService } from '../roles/roles.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'prisma/prisma.service';
import { JwtPayload } from 'common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rolesService: RolesService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const defaultRole = await this.rolesService.getRoleByCode(UserRoleCode.USER);

    const fullName = [dto.firstName, dto.lastName].filter(Boolean).join(' ') || null;

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        fullName,
        companyName: dto.companyName ?? null,
        phone: dto.phone ?? null,
        status: UserStatus.ACTIVE,
        signupSource: AuthProviderType.LOCAL,
        roles: {
          create: {
            roleId: defaultRole.id,
            isActive: true,
          },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, this.extractRoleCodes(user.roles));
    await this.saveRefreshSession(user.id, tokens.refreshToken);

    return {
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          roles: this.extractRoleCodes(user.roles),
        },
        ...tokens,
      },
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

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    const passwordMatched = await bcrypt.compare(dto.password, user.passwordHash);

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

    const session = await this.prisma.userSession.findFirst({
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

    if (!session) {
      throw new UnauthorizedException('Refresh session not found');
    }

    const tokenMatched = await bcrypt.compare(refreshToken, session.refreshTokenHash);

    if (!tokenMatched) {
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

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.prisma.userSession.update({
      where: { id: session.id },
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

  async logout(currentUser: { userId: string }, refreshToken?: string) {
    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId: currentUser.userId,
        revokedAt: null,
      },
    });

    if (refreshToken) {
      for (const session of sessions) {
        const matched = await bcrypt.compare(refreshToken, session.refreshTokenHash).catch(() => false);

        if (matched) {
          await this.prisma.userSession.update({
            where: { id: session.id },
            data: { revokedAt: new Date() },
          });

          return {
            message: 'Logout successful',
          };
        }
      }
    }

    await this.prisma.userSession.updateMany({
      where: {
        userId: currentUser.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: 'Logout successful',
    };
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