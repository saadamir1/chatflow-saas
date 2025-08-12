import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';

import { AuthResolver } from './auth.resolver';
import { EmailService } from '../common/services/email.service';
import { AuditService } from '../common/services/audit.service';
import { AuditLog } from '../common/entities/audit-log.entity';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([AuditLog]),
    JwtModule.register({
      secret: 'jwt-secret-key', // Move this to .env in production
      signOptions: { expiresIn: '1h' },
    }),
  ],
 
  providers: [AuthService, AuthResolver, JwtStrategy, EmailService, AuditService],
  exports: [AuthService],
})
export class AuthModule {}
