import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Plan } from './plan.entity';
import { Subscription } from './subscription.entity';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'telegram_channel_id', type: 'bigint' })
  telegramChannelId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  duration: number; // kunlarda

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Plan, (plan) => plan.channel)
  plans: Plan[];

  @OneToMany(() => Subscription, (subscription) => subscription.channel)
  subscriptions: Subscription[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
