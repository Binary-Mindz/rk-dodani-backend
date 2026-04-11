import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendEmailOtpDto } from './dto/resend-email-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { VerifyResetPasswordOtpDto } from './dto/verify-reset-password-otp.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { CurrentUser } from 'common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user and send email verification OTP' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email-otp')
  @ApiOperation({ summary: 'Verify email using OTP' })
  async verifyEmailOtp(@Body() dto: VerifyEmailOtpDto) {
    return this.authService.verifyEmailOtp(dto.email, dto.otp);
  }

  @Post('resend-email-otp')
  @ApiOperation({ summary: 'Resend email verification OTP' })
  async resendEmailOtp(@Body() dto: ResendEmailOtpDto) {
    return this.authService.resendEmailVerificationOtp(dto.email);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Send password reset OTP to email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('verify-reset-password-otp')
  @ApiOperation({ summary: 'Verify password reset OTP' })
  async verifyResetPasswordOtp(@Body() dto: VerifyResetPasswordOtpDto) {
    return this.authService.verifyPasswordResetOtp(dto.email, dto.otp);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using OTP' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout current user' })
  async logout(
    @CurrentUser() user: { userId: string },
    @Body() dto: Partial<RefreshTokenDto>,
  ) {
    return this.authService.logout(user, dto?.refreshToken);
  }
}