import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { SubscriptionService } from '../subscription/subscription.service';
import { NotificationService } from './notification.service';
import { UserService } from '../user/user.service';
import { RedisService } from '../../redis/redis.service';
import {
  NotificationType,
} from '../../database/entities/notification.entity';
import { SubscriptionStatus } from '../../database/entities/subscription.entity';
import { UserStatus } from '../../database/entities/user.entity';
import { MESSAGES } from '../../common/constants/messages';
import { FormatUtils, DateUtils } from '../../common/utils/helpers';
import { KeyboardUtils } from '../../common/utils/keyboard.utils';
import { BotContext } from '../../common/types/context.type';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<BotContext>,
    private readonly subscriptionService: SubscriptionService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {}

  // Har kuni 09:00 da (Asia/Tashkent)
  @Cron('0 9 * * *', {
    timeZone: 'Asia/Tashkent',
  })
  async handleDailyNotifications() {
    const lockKey = 'scheduler:daily-notifications';

    // Distributed lock
    const acquired = await this.redisService.acquireLock(lockKey, 300);
    if (!acquired) {
      this.logger.warn('Another instance is already running daily notifications');
      return;
    }

    try {
      this.logger.log('Starting daily notification check...');

      // 1. Ertaga tugaydiganlar (1 kun qoldi)
      await this.sendExpiryWarning1();

      // 2. Bugun tugaydiganlar
      await this.sendExpiryWarning2();

      // 3. 1 kun oldin tugaganlar (oxirgi ogohlantirish)
      await this.sendFinalWarning();

      // 4. 2 kun oldin tugaganlar (o'chirish)
      await this.removeExpiredUsers();

      this.logger.log('Daily notification check completed');
    } catch (error) {
      this.logger.error('Error in daily notifications:', error);
    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }

  // Ertaga tugaydiganlar (1 kun qoldi)
  private async sendExpiryWarning1() {
    const subscriptions = await this.subscriptionService.findExpiring1Day();
    this.logger.log(`Found ${subscriptions.length} subscriptions expiring tomorrow`);

    for (const subscription of subscriptions) {
      try {
        // Takroriy yuborilmasin
        const alreadySent = await this.notificationService.hasRecentNotification(
          subscription.userId,
          subscription.id,
          NotificationType.EXPIRY_WARNING_1,
        );

        if (alreadySent) continue;

        const message = FormatUtils.template(MESSAGES.EXPIRY_WARNING_1, {
          channel: subscription.channel.name,
        });

        await this.bot.telegram.sendMessage(
          subscription.user.telegramId,
          message,
          {
            parse_mode: 'Markdown',
            ...KeyboardUtils.extendSubscription(subscription.channelId),
          },
        );

        await this.notificationService.create({
          userId: subscription.userId,
          subscriptionId: subscription.id,
          type: NotificationType.EXPIRY_WARNING_1,
          message,
        });

        await this.notificationService.markAsSent(subscription.id);
      } catch (error) {
        this.logger.error(
          `Failed to send EXPIRY_WARNING_1 to user ${subscription.userId}:`,
          error,
        );
      }

      // Rate limiting
      await this.delay(100);
    }
  }

  // Bugun tugaydiganlar
  private async sendExpiryWarning2() {
    const subscriptions = await this.subscriptionService.findExpiringToday();
    this.logger.log(`Found ${subscriptions.length} subscriptions expiring today`);

    for (const subscription of subscriptions) {
      try {
        const alreadySent = await this.notificationService.hasRecentNotification(
          subscription.userId,
          subscription.id,
          NotificationType.EXPIRY_WARNING_2,
        );

        if (alreadySent) continue;

        const message = FormatUtils.template(MESSAGES.EXPIRY_WARNING_2, {
          channel: subscription.channel.name,
        });

        await this.bot.telegram.sendMessage(
          subscription.user.telegramId,
          message,
          {
            parse_mode: 'Markdown',
            ...KeyboardUtils.extendSubscription(subscription.channelId),
          },
        );

        await this.notificationService.create({
          userId: subscription.userId,
          subscriptionId: subscription.id,
          type: NotificationType.EXPIRY_WARNING_2,
          message,
        });
      } catch (error) {
        this.logger.error(
          `Failed to send EXPIRY_WARNING_2 to user ${subscription.userId}:`,
          error,
        );
      }

      await this.delay(100);
    }
  }

  // Oxirgi ogohlantirish (1 kun o'tgan)
  private async sendFinalWarning() {
    const subscriptions = await this.subscriptionService.findExpired1Day();
    this.logger.log(`Found ${subscriptions.length} subscriptions expired 1 day ago`);

    for (const subscription of subscriptions) {
      try {
        const alreadySent = await this.notificationService.hasRecentNotification(
          subscription.userId,
          subscription.id,
          NotificationType.FINAL_WARNING,
        );

        if (alreadySent) continue;

        const message = FormatUtils.template(MESSAGES.FINAL_WARNING, {
          channel: subscription.channel.name,
        });

        await this.bot.telegram.sendMessage(
          subscription.user.telegramId,
          message,
          {
            parse_mode: 'Markdown',
            ...KeyboardUtils.extendSubscription(subscription.channelId),
          },
        );

        await this.notificationService.create({
          userId: subscription.userId,
          subscriptionId: subscription.id,
          type: NotificationType.FINAL_WARNING,
          message,
        });
      } catch (error) {
        this.logger.error(
          `Failed to send FINAL_WARNING to user ${subscription.userId}:`,
          error,
        );
      }

      await this.delay(100);
    }
  }

  // 2 kun o'tgan - kanaldan o'chirish
  private async removeExpiredUsers() {
    const subscriptions = await this.subscriptionService.findExpired2Days();
    this.logger.log(`Found ${subscriptions.length} subscriptions to remove`);

    for (const subscription of subscriptions) {
      try {
        // Kanaldan chiqarish
        try {
          await this.bot.telegram.banChatMember(
            subscription.channel.telegramChannelId,
            parseInt(subscription.user.telegramId),
          );
          // Qayta qo'shilishi uchun unban
          await this.bot.telegram.unbanChatMember(
            subscription.channel.telegramChannelId,
            parseInt(subscription.user.telegramId),
          );
        } catch (kickError) {
          this.logger.warn(
            `Could not kick user ${subscription.user.telegramId} from channel:`,
            kickError,
          );
        }

        // Obuna statusini o'zgartirish
        await this.subscriptionService.updateStatus(
          subscription.id,
          SubscriptionStatus.REMOVED,
        );

        // Foydalanuvchi statusini o'zgartirish
        await this.userService.updateStatus(subscription.userId, UserStatus.REMOVED);

        // Xabar yuborish
        const message = FormatUtils.template(MESSAGES.REMOVAL_NOTICE, {
          channel: subscription.channel.name,
        });

        await this.bot.telegram.sendMessage(
          subscription.user.telegramId,
          message,
          { parse_mode: 'Markdown' },
        );

        await this.notificationService.create({
          userId: subscription.userId,
          subscriptionId: subscription.id,
          type: NotificationType.REMOVAL_NOTICE,
          message,
        });
      } catch (error) {
        this.logger.error(
          `Failed to remove user ${subscription.userId}:`,
          error,
        );
      }

      await this.delay(100);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
