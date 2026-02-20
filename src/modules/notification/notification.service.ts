import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from '../../database/entities/notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(data: {
    userId: string;
    subscriptionId: string;
    type: NotificationType;
    message: string;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...data,
      status: NotificationStatus.PENDING,
    });

    return this.notificationRepository.save(notification);
  }

  async markAsSent(id: string): Promise<void> {
    await this.notificationRepository.update(id, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });
  }

  async markAsFailed(id: string): Promise<void> {
    await this.notificationRepository.update(id, {
      status: NotificationStatus.FAILED,
    });
  }

  // Oxirgi bildirishnoma tekshirish (takroriy yuborilmasligi uchun)
  async hasRecentNotification(
    userId: string,
    subscriptionId: string,
    type: NotificationType,
    withinHours: number = 24,
  ): Promise<boolean> {
    const since = new Date(Date.now() - withinHours * 60 * 60 * 1000);

    const count = await this.notificationRepository.count({
      where: {
        userId,
        subscriptionId,
        type,
        status: NotificationStatus.SENT,
      },
    });

    return count > 0;
  }

  // Bugungi yuborilgan bildirishnomalar soni
  async countTodaySent(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.status = :status', { status: NotificationStatus.SENT })
      .andWhere('notification.sentAt >= :today', { today })
      .getCount();
  }
}
