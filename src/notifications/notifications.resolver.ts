import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GraphQLJwtAuthGuard } from '../auth/graphql-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

const pubSub = new PubSub();

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => [Notification])
  @UseGuards(GraphQLJwtAuthGuard)
  async myNotifications(@CurrentUser() user: any): Promise<Notification[]> {
    console.log('Getting notifications for user:', user);
    return this.notificationsService.findUserNotifications(user.userId);
  }

  @Query(() => Number)
  @UseGuards(GraphQLJwtAuthGuard)
  async unreadCount(@CurrentUser() user: any): Promise<number> {
    return this.notificationsService.getUnreadCount(user.userId);
  }

  @Mutation(() => Notification)
  async createNotification(
    @Args('createNotificationInput')
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    console.log('Creating notification with data:', createNotificationDto);
    const notification = await this.notificationsService.create(
      createNotificationDto,
    );
    console.log('Notification created:', notification);
    pubSub.publish('notificationAdded', { notificationAdded: notification });
    return notification;
  }

  @Mutation(() => Notification)
  @UseGuards(GraphQLJwtAuthGuard)
  async markNotificationRead(@Args('id') id: number): Promise<Notification> {
    return this.notificationsService.markAsRead(id);
  }

  @Mutation(() => Boolean)
  @UseGuards(GraphQLJwtAuthGuard)
  async deleteNotification(@Args('id') id: number): Promise<boolean> {
    await this.notificationsService.remove(id);
    return true;
  }

  @Subscription(() => Notification, {
    filter: (payload, variables, context) => {
      // Allow all for now - you can add filtering logic here
      return true;
    },
  })
  notificationAdded() {
    return pubSub.asyncIterableIterator('notificationAdded');
  }
}
