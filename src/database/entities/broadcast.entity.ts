import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum BroadcastType {
  TEXT = 'text',
  PHOTO = 'photo',
  VIDEO = 'video',
}

export enum BroadcastStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('broadcasts')
export class Broadcast {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: BroadcastType,
  })
  type: BroadcastType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'media_url', length: 500, nullable: true })
  mediaUrl: string;

  @Column({ name: 'media_file_id', nullable: true })
  mediaFileId: string;

  @Column({
    type: 'enum',
    enum: BroadcastStatus,
    default: BroadcastStatus.PENDING,
  })
  status: BroadcastStatus;

  @Column({ name: 'total_users', type: 'int', default: 0 })
  totalUsers: number;

  @Column({ name: 'sent_count', type: 'int', default: 0 })
  sentCount: number;

  @Column({ name: 'failed_count', type: 'int', default: 0 })
  failedCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;
}
