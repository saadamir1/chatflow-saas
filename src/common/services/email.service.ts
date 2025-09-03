import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `http://localhost:3001/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendEmailVerification(email: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'Verify Your Email Address',
      text: `Welcome! Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendInvitationEmail(email: string, token: string, message?: string): Promise<void> {
    const invitationUrl = `${this.configService.get<string>('FRONTEND_URL')}/accept-invitation?token=${token}`;
    
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'You\'re invited to join ChatFlow!',
      text: `You\'ve been invited to join a team workspace on ChatFlow.\n\n${message ? `Message: "${message}"\n\n` : ''}Click the link below to accept:\n\n${invitationUrl}\n\nThis invitation expires in 7 days.`,
    };

    await this.transporter.sendMail(mailOptions);
  }
}