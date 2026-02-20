import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Subscription } from './subscription.entity';

export enum NotificationType {
  EXPIRY_WARNING_1 = 'EXPIRY_WARNING_1', // 1 kun qoldi
  EXPIRY_WARNING_2 = 'EXPIRY_WARNING_2', // Bugun tugaydi
  FINAL_WARNING = 'FINAL_WARNING', // 1 kun o'tdi
  REMOVAL_NOTICE = 'REMOVAL_NOTICE', // 2 kun o'tdi, o'chirildi
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ name: 'sent_at', nullable: true })
  sentAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
