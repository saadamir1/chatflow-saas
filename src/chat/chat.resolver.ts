import {
  Resolver,
  Query,
  Mutation,
  Args,
  Subscription,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards, Inject, forwardRef } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { ChatService } from './chat.service';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GraphQLJwtAuthGuard } from '../auth/graphql-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

const pubSub = new PubSub();

@Resolver(() => ChatRoom)
export class ChatResolver {
  constructor(
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  @ResolveField(() => [User])
  async participants(@Parent() room: ChatRoom): Promise<User[]> {
    // room.participantIds is an array of user IDs
    if (!room.participantIds || !Array.isArray(room.participantIds)) return [];
    // Fetch all users by their IDs
    const users = await Promise.all(
      room.participantIds.map((id) => this.usersService.findOne(id)),
    );
    // Filter out nulls (in case a user was deleted)
    return users.filter(Boolean) as User[];
  }

  @Query(() => [ChatRoom])
  @UseGuards(GraphQLJwtAuthGuard)
  async myRooms(@CurrentUser() user: any): Promise<ChatRoom[]> {
    console.log('Getting rooms for user:', user);
    return this.chatService.findUserRooms(user.userId);
  }

  @Query(() => [ChatMessage])
  async roomMessages(@Args('roomId') roomId: number): Promise<ChatMessage[]> {
    return this.chatService.getRoomMessages(roomId);
  }

  @Mutation(() => ChatRoom)
  @UseGuards(GraphQLJwtAuthGuard)
  async createRoom(
    @Args('createRoomInput') createRoomDto: CreateRoomDto,
    @CurrentUser() user: any,
  ): Promise<ChatRoom> {
    return this.chatService.createRoom(createRoomDto);
  }

  @Mutation(() => ChatMessage)
  @UseGuards(GraphQLJwtAuthGuard)
  async sendMessage(
    @Args('sendMessageInput') sendMessageDto: SendMessageDto,
    @CurrentUser() user: any,
  ): Promise<ChatMessage> {
    const message = await this.chatService.sendMessage(
      sendMessageDto,
      user.userId,
    );
    pubSub.publish('messageAdded', { messageAdded: message });
    return message;
  }

  @Subscription(() => ChatMessage, {
    filter: (payload, variables, context) => {
      // Allow all for now - you can add filtering logic here
      return true;
    },
  })
  messageAdded() {
    return pubSub.asyncIterableIterator('messageAdded');
  }
}
