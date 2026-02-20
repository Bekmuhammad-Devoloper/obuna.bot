import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Subscription } from './subscription.entity';
import { Payment } from './payment.entity';
import { Notification } from './notification.entity';

export enum UserStatus {
  REGISTERED = 'registered',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REMOVED = 'removed',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'telegram_id', type: 'bigint', unique: true })
  telegramId: string;

  @Column({ nullable: true })
  username: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'phone_number', length: 20 })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.REGISTERED,
  })
  status: UserStatus;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
