import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    console.log('Service: Creating notification with:', createNotificationDto);
    const notification = this.notificationRepository.create(
      createNotificationDto,
    );
    console.log('Service: Created entity:', notification);
    const saved = await this.notificationRepository.save(notification);
    console.log('Service: Saved notification:', saved);
    return saved;
  }

  async findUserNotifications(userId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number): Promise<Notification> {
    await this.notificationRepository.update(id, { read: true });
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new Error('Notification not found');
    }
    return notification;
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  async remove(id: number): Promise<void> {
    await this.notificationRepository.delete(id);
  }
}
