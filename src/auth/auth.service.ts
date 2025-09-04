import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../common/services/email.service';
import { AuditService } from '../common/services/audit.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private auditService: AuditService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async generateTokens(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    console.log('Generating tokens for payload:', payload);
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'jwt-refresh-secret',
      expiresIn: '7d',
    });
    return { access_token, refresh_token };
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, { refreshToken: hashed });
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Wrong password');

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in. Use resendEmailVerification mutation if verification link expired.',
      );
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    // Log successful login
    await this.auditService.log(
      user.id,
      'LOGIN',
      'User',
      user.id,
      'User logged in successfully',
    );

    return tokens;
  }

  async refresh(incomingRefreshToken: string) {
    try {
      const payload = this.jwtService.verify(incomingRefreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user?.refreshToken) {
        throw new ForbiddenException('No refresh token stored');
      }

      const isMatch = await bcrypt.compare(
        incomingRefreshToken,
        user.refreshToken,
      );
      if (!isMatch) {
        throw new ForbiddenException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      await this.updateRefreshToken(user.id, tokens.refresh_token);

      return tokens;
    } catch (err) {
      throw new ForbiddenException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If email exists, reset link has been sent' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save token to database
    await this.usersService.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpiry,
    } as any);

    // Send email
    await this.emailService.sendPasswordResetEmail(email, resetToken);

    return { message: 'If email exists, reset link has been sent' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Find user by reset token
    const users = await this.usersService.findAll();
    const user = users.data.find((u) => u.resetPasswordToken === token);

    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await this.usersService.update(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    } as any);

    // Log password reset
    await this.auditService.log(
      user.id,
      'PASSWORD_RESET',
      'User',
      user.id,
      'Password reset via email',
    );

    return { message: 'Password reset successfully' };
  }

  async sendEmailVerification(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'If email exists, verification link has been sent' };
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token to database
    await this.usersService.update(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpires: tokenExpiry,
    } as any);

    // Send verification email
    await this.emailService.sendEmailVerification(email, verificationToken);

    return { message: 'Verification email sent' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    // Find user by verification token
    const users = await this.usersService.findAll();
    const user = users.data.find((u) => u.emailVerificationToken === token);

    if (
      !user ||
      !user.emailVerificationTokenExpires ||
      user.emailVerificationTokenExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Mark email as verified and clear token
    await this.usersService.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    } as any);

    return { message: 'Email verified successfully' };
  }
}
