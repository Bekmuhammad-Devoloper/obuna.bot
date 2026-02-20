import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Channel } from './channel.entity';
import { Plan } from './plan.entity';
import { Payment } from './payment.entity';
import { Notification } from './notification.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REMOVED = 'removed',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'channel_id' })
  channelId: string;

  @ManyToOne(() => Channel, (channel) => channel.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @Column({ name: 'plan_id', nullable: true })
  planId: string;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ name: 'invite_link', length: 500, nullable: true })
  inviteLink: string;

  @OneToMany(() => Payment, (payment) => payment.subscription)
  payments: Payment[];

  @OneToMany(() => Notification, (notification) => notification.subscription)
  notifications: Notification[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
