import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import {
  Broadcast,
  BroadcastStatus,
  BroadcastType,
} from '../../database/entities/broadcast.entity';
import { UserService } from '../user/user.service';
import { BotContext } from '../../common/types/context.type';

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    @InjectRepository(Broadcast)
    private readonly broadcastRepository: Repository<Broadcast>,
    @InjectBot() private readonly bot: Telegraf<BotContext>,
    private readonly userService: UserService,
  ) {}

  async create(data: {
    type: BroadcastType;
    content?: string;
    mediaFileId?: string;
  }): Promise<Broadcast> {
    const users = await this.userService.findAllActive();

    const broadcast = this.broadcastRepository.create({
      type: data.type,
      content: data.content,
      mediaFileId: data.mediaFileId,
      status: BroadcastStatus.PENDING,
      totalUsers: users.length,
    });

    return this.broadcastRepository.save(broadcast);
  }

  async findById(id: string): Promise<Broadcast | null> {
    return this.broadcastRepository.findOne({ where: { id } });
  }

  async getActiveUsersCount(): Promise<number> {
    const users = await this.userService.findAllActive();
    return users.length;
  }

  async send(broadcastId: string): Promise<void> {
    const broadcast = await this.findById(broadcastId);
    if (!broadcast) {
      throw new Error('Broadcast not found');
    }

    // Status yangilash
    await this.broadcastRepository.update(broadcastId, {
      status: BroadcastStatus.SENDING,
    });

    const users = await this.userService.findAllActive();
    let sentCount = 0;
    let failedCount = 0;

    for (const user of users) {
      try {
        await this.sendToUser(user.telegramId, broadcast);
        sentCount++;
      } catch (error) {
        this.logger.warn(`Failed to send broadcast to ${user.telegramId}:`, error);
        failedCount++;

        // Agar foydalanuvchi botni bloklagan bo'lsa
        if (this.isBlockedError(error)) {
          await this.userService.setBlocked(user.id, true);
        }
      }

      // Progress yangilash (har 10 ta xabardan keyin)
      if ((sentCount + failedCount) % 10 === 0) {
        await this.broadcastRepository.update(broadcastId, {
          sentCount,
          failedCount,
        });
      }

      // Rate limiting: 30 xabar/sekund
      await this.delay(35);
    }

    // Yakuniy yangilash
    await this.broadcastRepository.update(broadcastId, {
      status: BroadcastStatus.COMPLETED,
      sentCount,
      failedCount,
      completedAt: new Date(),
    });
  }

  private async sendToUser(telegramId: string, broadcast: Broadcast): Promise<void> {
    switch (broadcast.type) {
      case BroadcastType.TEXT:
        await this.bot.telegram.sendMessage(telegramId, broadcast.content || '', {
          parse_mode: 'Markdown',
        });
        break;

      case BroadcastType.PHOTO:
        await this.bot.telegram.sendPhoto(
          telegramId,
          broadcast.mediaFileId || broadcast.mediaUrl || '',
          {
            caption: broadcast.content,
            parse_mode: 'Markdown',
          },
        );
        break;

      case BroadcastType.VIDEO:
        await this.bot.telegram.sendVideo(
          telegramId,
          broadcast.mediaFileId || broadcast.mediaUrl || '',
          {
            caption: broadcast.content,
            parse_mode: 'Markdown',
          },
        );
        break;
    }
  }

  private isBlockedError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { error_code?: number } }).response;
      // 403 = bot was blocked by user
      return response?.error_code === 403;
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
