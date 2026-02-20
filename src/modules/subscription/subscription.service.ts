import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../../database/entities/subscription.entity';
import { DateUtils } from '../../common/utils/helpers';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async findById(id: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { id },
      relations: ['user', 'channel'],
    });
  }

  async findByUserAndChannel(
    userId: string,
    channelId: string,
  ): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { userId, channelId, status: SubscriptionStatus.ACTIVE },
      relations: ['channel'],
    });
  }

  async findActiveByUser(userId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['channel'],
      order: { endDate: 'ASC' },
    });
  }

  async findAllByUser(userId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { userId },
      relations: ['channel'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: {
    userId: string;
    channelId: string;
    planId?: string;
    startDate: Date;
    endDate: Date;
    inviteLink?: string;
  }): Promise<Subscription> {
    const subscription = this.subscriptionRepository.create({
      ...data,
      status: SubscriptionStatus.ACTIVE,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async updateStatus(id: string, status: SubscriptionStatus): Promise<void> {
    await this.subscriptionRepository.update(id, { status });
  }

  async updateInviteLink(id: string, inviteLink: string): Promise<void> {
    await this.subscriptionRepository.update(id, { inviteLink });
  }

  async extend(id: string, additionalDays: number): Promise<Subscription | null> {
    const subscription = await this.findById(id);
    if (!subscription) return null;

    const newEndDate = DateUtils.addDays(subscription.endDate, additionalDays);
    await this.subscriptionRepository.update(id, {
      endDate: newEndDate,
      status: SubscriptionStatus.ACTIVE,
    });

    return this.findById(id);
  }

  // Statistika
  async countActive(): Promise<number> {
    return this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });
  }

  // Bugun tugaydiganlar
  async findExpiringToday(): Promise<Subscription[]> {
    const today = DateUtils.today();
    return this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: today,
      },
      relations: ['user', 'channel'],
    });
  }

  // 1 kun qolganda (ertaga tugaydi)
  async findExpiring1Day(): Promise<Subscription[]> {
    const tomorrow = DateUtils.addDays(DateUtils.today(), 1);
    return this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: tomorrow,
      },
      relations: ['user', 'channel'],
    });
  }

  // 1 kun oldin tugagan
  async findExpired1Day(): Promise<Subscription[]> {
    const yesterday = DateUtils.addDays(DateUtils.today(), -1);
    return this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: yesterday,
      },
      relations: ['user', 'channel'],
    });
  }

  // 2 kun oldin tugagan (o'chirilishi kerak)
  async findExpired2Days(): Promise<Subscription[]> {
    const twoDaysAgo = DateUtils.addDays(DateUtils.today(), -2);
    return this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThanOrEqual(twoDaysAgo),
      },
      relations: ['user', 'channel'],
    });
  }

  // Bugun tugaydiganlar soni
  async countExpiringToday(): Promise<number> {
    const today = DateUtils.today();
    return this.subscriptionRepository.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: today,
      },
    });
  }

  // User ma'lum kanalga faol obunasi bormi
  async hasActiveSubscription(userId: string, channelId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        userId,
        channelId,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    return !!subscription;
  }
}
