import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChannelMembership } from './entities/channel-membership.entity';
import { ChannelJoinRequest } from './entities/channel-join-request.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRoom, ChatMessage, ChannelMembership, ChannelJoinRequest]), UsersModule, NotificationsModule],
  providers: [ChatService, ChatResolver],
  exports: [ChatService],
})
export class ChatModule {}
