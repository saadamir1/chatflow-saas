import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

import { AuthResolver } from './auth.resolver';
import { EmailService } from '../common/services/email.service';
import { AuditService } from '../common/services/audit.service';
import { AuditLog } from '../common/entities/audit-log.entity';
import { ConfigService, ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    WorkspacesModule,
    PassportModule,
    TypeOrmModule.forFeature([AuditLog]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'jwt-secret-key',
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
 
  providers: [AuthService, AuthResolver, JwtStrategy, EmailService, AuditService, ConfigService],
  exports: [AuthService],
})
export class AuthModule {}
