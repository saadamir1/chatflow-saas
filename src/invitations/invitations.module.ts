import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsService } from './invitations.service';
import { InvitationsResolver } from './invitations.resolver';
import { Invitation } from './entities/invitation.entity';
import { UsersModule } from '../users/users.module';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invitation]), UsersModule],
  providers: [InvitationsResolver, InvitationsService, EmailService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
