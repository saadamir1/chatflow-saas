import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsService } from './invitations.service';
import { InvitationsResolver } from './invitations.resolver';
import { Invitation } from './entities/invitation.entity';
import { CommonModule } from '../common/common.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation]),
    CommonModule,
    UsersModule,
  ],
  providers: [InvitationsResolver, InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}