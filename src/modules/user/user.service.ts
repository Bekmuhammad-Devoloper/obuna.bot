import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { User, UserStatus } from '../../database/entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { telegramId },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async create(data: {
    telegramId: string;
    username?: string;
    fullName: string;
    phoneNumber: string;
  }): Promise<User> {
    const user = this.userRepository.create({
      ...data,
      status: UserStatus.REGISTERED,
    });

    return this.userRepository.save(user);
  }

  async updateStatus(userId: string, status: UserStatus): Promise<void> {
    await this.userRepository.update(userId, { status });
  }

  async setBlocked(userId: string, blocked: boolean): Promise<void> {
    await this.userRepository.update(userId, { isBlocked: blocked });
  }

  async countAll(): Promise<number> {
    return this.userRepository.count();
  }

  async countActive(): Promise<number> {
    return this.userRepository.count({
      where: { isBlocked: false },
    });
  }

  // Obunadorlar (faol obunasi bor)
  async findSubscribers(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.subscriptions', 'subscription')
      .where('subscription.status = :status', { status: 'active' })
      .andWhere('user.isBlocked = :blocked', { blocked: false })
      .getMany();
  }

  // Qiziquvchilar (ro'yxatdan o'tgan, lekin obunasi yo'q)
  async findInterested(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.subscriptions', 'subscription')
      .where('subscription.id IS NULL')
      .orWhere('subscription.status != :status', { status: 'active' })
      .andWhere('user.isBlocked = :blocked', { blocked: false })
      .getMany();
  }

  // E'lon uchun barcha faol foydalanuvchilar
  async findAllActive(): Promise<User[]> {
    return this.userRepository.find({
      where: { isBlocked: false },
    });
  }

  // Obunadorlar ro'yxati (Excel uchun)
  async getSubscribersForExport(): Promise<
    Array<{
      telegramId: string;
      fullName: string;
      phoneNumber: string;
      channelName: string;
      startDate: Date;
      endDate: Date;
      daysLeft: number;
    }>
  > {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.subscriptions', 'subscription')
      .innerJoin('subscription.channel', 'channel')
      .select([
        'user.telegramId as "telegramId"',
        'user.fullName as "fullName"',
        'user.phoneNumber as "phoneNumber"',
        'channel.name as "channelName"',
        'subscription.startDate as "startDate"',
        'subscription.endDate as "endDate"',
      ])
      .where('subscription.status = :status', { status: 'active' })
      .getRawMany();

    const today = new Date();
    return result.map((row) => ({
      ...row,
      daysLeft: Math.ceil(
        (new Date(row.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      ),
    }));
  }

  // Qiziquvchilar ro'yxati (Excel uchun)
  async getInterestedForExport(): Promise<
    Array<{
      telegramId: string;
      fullName: string;
      phoneNumber: string;
      createdAt: Date;
    }>
  > {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.subscriptions', 'subscription', 'subscription.status = :status', {
        status: 'active',
      })
      .select([
        'user.telegramId as "telegramId"',
        'user.fullName as "fullName"',
        'user.phoneNumber as "phoneNumber"',
        'user.createdAt as "createdAt"',
      ])
      .where('subscription.id IS NULL')
      .andWhere('user.isBlocked = :blocked', { blocked: false })
      .getRawMany();
  }
}
