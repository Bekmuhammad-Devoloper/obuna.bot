import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Update, Ctx, Action, On } from 'nestjs-telegraf';
import { BotContext } from '../common/types/context.type';
import { MESSAGES } from '../common/constants/messages';
import { KeyboardUtils } from '../common/utils/keyboard.utils';
import { FormatUtils, ValidationUtils } from '../common/utils/helpers';
import { UserService } from '../modules/user/user.service';
import { ChannelService } from '../modules/channel/channel.service';
import { SubscriptionService } from '../modules/subscription/subscription.service';
import { PaymentService } from '../modules/payment/payment.service';
import { BroadcastService } from '../modules/broadcast/broadcast.service';
import { ExcelService } from '../modules/excel/excel.service';
import { RedisService } from '../redis/redis.service';
import { BroadcastType } from '../database/entities/broadcast.entity';

interface AdminSession {
  step?: string;
  channelName?: string;
  channelTelegramId?: string;
  channelDescription?: string;
  channelPrice?: number;
  editChannelId?: string;
  editField?: string;
  broadcastType?: BroadcastType;
  broadcastContent?: string;
  broadcastMediaFileId?: string;
}

@Update()
@Injectable()
export class AdminUpdate {
  private readonly logger = new Logger(AdminUpdate.name);
  private readonly adminIds: string[];

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly channelService: ChannelService,
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentService: PaymentService,
    private readonly broadcastService: BroadcastService,
    private readonly excelService: ExcelService,
    private readonly redisService: RedisService,
  ) {
    const adminIdsStr = this.configService.get<string>('ADMIN_IDS', '');
    this.adminIds = adminIdsStr.split(',').filter((id) => id.trim());
  }

  private isAdmin(telegramId: string): boolean {
    return this.adminIds.includes(telegramId);
  }

  // Admin menyusi
  @Action('admin:menu')
  async onAdminMenu(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    await ctx.editMessageText(MESSAGES.ADMIN_PANEL, {
      parse_mode: 'Markdown',
      ...KeyboardUtils.adminMenu(),
    });
    await ctx.answerCbQuery();
  }

  // Statistika
  @Action('admin:stats')
  async onAdminStats(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const [
      totalUsers,
      activeSubscriptions,
      expiringToday,
      todayRevenue,
      monthlyRevenue,
    ] = await Promise.all([
      this.userService.countAll(),
      this.subscriptionService.countActive(),
      this.subscriptionService.countExpiringToday(),
      this.paymentService.getTodayRevenue(),
      this.paymentService.getMonthlyRevenue(),
    ]);

    const message = FormatUtils.template(MESSAGES.ADMIN_STATS, {
      totalUsers: totalUsers.toString(),
      activeSubscriptions: activeSubscriptions.toString(),
      expiringToday: expiringToday.toString(),
      todayRevenue: FormatUtils.formatMoney(todayRevenue),
      monthlyRevenue: FormatUtils.formatMoney(monthlyRevenue),
    });

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...KeyboardUtils.adminMenu(),
    });
    await ctx.answerCbQuery();
  }

  // Kanallar ro'yxati
  @Action('admin:channels')
  async onAdminChannels(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const channels = await this.channelService.findAll();

    if (channels.length === 0) {
      await ctx.editMessageText(MESSAGES.ADMIN_NO_CHANNELS, {
        parse_mode: 'Markdown',
        ...KeyboardUtils.adminChannelsList([]),
      });
    } else {
      await ctx.editMessageText(MESSAGES.ADMIN_CHANNELS, {
        parse_mode: 'Markdown',
        ...KeyboardUtils.adminChannelsList(
          channels.map((c) => ({
            id: c.id,
            name: c.name,
            isActive: c.isActive,
          })),
        ),
      });
    }
    await ctx.answerCbQuery();
  }

  // Kanal qo'shish boshlash
  @Action('ch:add')
  async onAddChannel(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    await this.redisService.setSession<AdminSession>(telegramId, {
      step: 'admin:channel:name',
    });

    await ctx.editMessageText(MESSAGES.ADMIN_ADD_CHANNEL_NAME, {
      parse_mode: 'Markdown',
    });
    await ctx.answerCbQuery();
  }

  // Kanal ma'lumotlarini ko'rish
  @Action(/^ch:([a-f0-9-]+)$/)
  async onChannelDetails(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const channelId = ctx.match![1];
    const channel = await this.channelService.findById(channelId);

    if (!channel) {
      await ctx.answerCbQuery('Kanal topilmadi');
      return;
    }

    const message = `📺 *${channel.name}*\n\n` +
      `📝 Tavsif: ${channel.description || 'Mavjud emas'}\n` +
      `💰 Narx: *${FormatUtils.formatMoney(Number(channel.price))} so'm*\n` +
      `📅 Muddat: *${channel.duration} kun*\n` +
      `📊 Holat: ${channel.isActive ? '✅ Faol' : '❌ Faol emas'}\n` +
      `🆔 Telegram ID: \`${channel.telegramChannelId}\``;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...KeyboardUtils.adminChannelActions(channelId, channel.isActive),
    });
    await ctx.answerCbQuery();
  }

  // Kanal tahrirlash - menyu
  @Action(/^ch:edit:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i)
  async onEditChannel(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const channelId = ctx.match![1];
    const channel = await this.channelService.findById(channelId);

    if (!channel) {
      await ctx.answerCbQuery('Kanal topilmadi');
      return;
    }

    await ctx.editMessageText(
      `✏️ *${channel.name}* kanalini tahrirlash\n\nNimani o'zgartirmoqchisiz?`,
      {
        parse_mode: 'Markdown',
        ...KeyboardUtils.editChannelMenu(channelId),
      },
    );
    await ctx.answerCbQuery();
  }

  // Kanal nomini tahrirlash
  @Action(/^ch:e:n:(.+)$/)
  async onEditChannelName(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const channelId = ctx.match![1];
    await this.redisService.setSession<AdminSession>(telegramId, {
      step: 'admin:edit:name',
      editChannelId: channelId,
    });

    await ctx.editMessageText('✏️ *Yangi kanal nomini kiriting:*', {
      parse_mode: 'Markdown',
    });
    await ctx.answerCbQuery();
  }

  // Kanal tavsifini tahrirlash
  @Action(/^ch:e:d:(.+)$/)
  async onEditChannelDesc(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const channelId = ctx.match![1];
    await this.redisService.setSession<AdminSession>(telegramId, {
      step: 'admin:edit:desc',
      editChannelId: channelId,
    });

    await ctx.editMessageText('✏️ *Yangi tavsifni kiriting:*', {
      parse_mode: 'Markdown',
    });
    await ctx.answerCbQuery();
  }

  // Kanal narxini tahrirlash
  @Action(/^ch:e:p:(.+)$/)
  async onEditChannelPrice(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const channelId = ctx.match![1];
    await this.redisService.setSession<AdminSession>(telegramId, {
      step: 'admin:edit:price',
      editChannelId: channelId,
    });

    await ctx.editMessageText('✏️ *Yangi narxni kiriting (so\'mda):*', {
      parse_mode: 'Markdown',
    });
    await ctx.answerCbQuery();
  }

  // Kanal muddatini tahrirlash
  @Action(/^ch:e:t:(.+)$/)
  async onEditChannelDuration(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const channelId = ctx.match![1];
    await this.redisService.setSession<AdminSession>(telegramId, {
      step: 'admin:edit:duration',
      editChannelId: channelId,
    });

    await ctx.editMessageText('✏️ *Yangi muddatni kiriting (kunlarda):*', {
      parse_mode: 'Markdown',
    });
    await ctx.answerCbQuery();
  }

  // Kanal faol/faol emasni o'zgartirish
  @Action(/^ch:tgl:(.+)$/)
  async onToggleChannel(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const channelId = ctx.match![1];
    const channel = await this.channelService.toggleActive(channelId);

    if (!channel) {
      await ctx.answerCbQuery('Kanal topilmadi');
      return;
    }

    const message = FormatUtils.template(MESSAGES.ADMIN_CHANNEL_TOGGLED, {
      name: channel.name,
      status: channel.isActive ? 'Faol' : 'Faol emas',
    });

    await ctx.answerCbQuery(message, { show_alert: true });
    await this.onAdminChannels(ctx);
  }

  // Kanal o'chirish - tasdiqlash
  @Action(/^ch:rm:(.+)$/)
  async onDeleteChannel(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const channelId = ctx.match![1];

    await ctx.editMessageText('⚠️ *Rostdan ham bu kanalni o\'chirmoqchimisiz?*\n\nBu amalni ortga qaytarib bo\'lmaydi!', {
      parse_mode: 'Markdown',
      ...KeyboardUtils.confirmDelete(channelId),
    });
    await ctx.answerCbQuery();
  }

  // Kanal o'chirish - tasdiqlangan
  @Action(/^ch:del:(.+)$/)
  async onConfirmDeleteChannel(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const channelId = ctx.match![1];
    const channel = await this.channelService.findById(channelId);

    if (!channel) {
      await ctx.answerCbQuery('Kanal topilmadi');
      return;
    }

    await this.channelService.delete(channelId);

    const message = FormatUtils.template(MESSAGES.ADMIN_CHANNEL_DELETED, {
      name: channel.name,
    });

    await ctx.answerCbQuery(message, { show_alert: true });
    await this.onAdminChannels(ctx);
  }

  // Foydalanuvchilar menyusi
  @Action('admin:users')
  async onAdminUsers(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    await ctx.editMessageText(MESSAGES.ADMIN_USERS, {
      parse_mode: 'Markdown',
      ...KeyboardUtils.adminUsersMenu(),
    });
    await ctx.answerCbQuery();
  }

  // Obunadorlar
  @Action('admin:users:subscribers')
  async onSubscribersList(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const subscribers = await this.userService.findSubscribers();

    await ctx.editMessageText(
      `📊 *Obunadorlar*\n\nJami: *${subscribers.length}* ta\n\nExcel yuklab olish uchun tugmani bosing:`,
      {
        parse_mode: 'Markdown',
        ...KeyboardUtils.exportExcel('subscribers'),
      },
    );
    await ctx.answerCbQuery();
  }

  // Qiziquvchilar
  @Action('admin:users:interested')
  async onInterestedList(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const interested = await this.userService.findInterested();

    await ctx.editMessageText(
      `👀 *Qiziquvchilar*\n\nJami: *${interested.length}* ta\n\nExcel yuklab olish uchun tugmani bosing:`,
      {
        parse_mode: 'Markdown',
        ...KeyboardUtils.exportExcel('interested'),
      },
    );
    await ctx.answerCbQuery();
  }

  // Excel export
  @Action(/^admin:export:(.+)$/)
  async onExport(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const type = ctx.match![1] as 'subscribers' | 'interested';

    await ctx.answerCbQuery('📊 Excel tayyorlanmoqda...');

    try {
      let buffer: Buffer;
      let filename: string;

      if (type === 'subscribers') {
        buffer = await this.excelService.generateSubscribersExcel();
        filename = `obunadorlar_${Date.now()}.xlsx`;
      } else {
        buffer = await this.excelService.generateInterestedExcel();
        filename = `qiziquvchilar_${Date.now()}.xlsx`;
      }

      await ctx.replyWithDocument({
        source: buffer,
        filename,
      });
    } catch (error) {
      this.logger.error('Error generating Excel:', error);
      await ctx.reply('❌ Excel yaratishda xatolik yuz berdi');
    }
  }

  // Broadcast menyusi
  @Action('admin:broadcast')
  async onBroadcast(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    await ctx.editMessageText(MESSAGES.ADMIN_BROADCAST_TYPE, {
      parse_mode: 'Markdown',
      ...KeyboardUtils.broadcastTypes(),
    });
    await ctx.answerCbQuery();
  }

  // Broadcast - matn tanlash
  @Action('admin:broadcast:text')
  async onBroadcastText(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    await this.redisService.setSession<AdminSession>(telegramId, {
      step: 'admin:broadcast:text',
      broadcastType: BroadcastType.TEXT,
    });

    await ctx.editMessageText(MESSAGES.ADMIN_BROADCAST_TEXT, {
      parse_mode: 'Markdown',
    });
    await ctx.answerCbQuery();
  }

  // Broadcast - rasm tanlash
  @Action('admin:broadcast:photo')
  async onBroadcastPhoto(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    await this.redisService.setSession<AdminSession>(telegramId, {
      step: 'admin:broadcast:photo',
      broadcastType: BroadcastType.PHOTO,
    });

    await ctx.editMessageText(MESSAGES.ADMIN_BROADCAST_PHOTO, {
      parse_mode: 'Markdown',
    });
    await ctx.answerCbQuery();
  }

  // Broadcast - video tanlash
  @Action('admin:broadcast:video')
  async onBroadcastVideo(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    await this.redisService.setSession<AdminSession>(telegramId, {
      step: 'admin:broadcast:video',
      broadcastType: BroadcastType.VIDEO,
    });

    await ctx.editMessageText(MESSAGES.ADMIN_BROADCAST_VIDEO, {
      parse_mode: 'Markdown',
    });
    await ctx.answerCbQuery();
  }

  // Broadcast tasdiqlash
  @Action('admin:broadcast:confirm')
  async onBroadcastConfirm(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await ctx.answerCbQuery(MESSAGES.NOT_ADMIN, { show_alert: true });
      return;
    }

    const session = await this.redisService.getSession<AdminSession>(telegramId);
    if (!session?.broadcastType) {
      await ctx.answerCbQuery('Session topilmadi');
      return;
    }

    await ctx.answerCbQuery('📢 Yuborish boshlandi...');

    try {
      const broadcast = await this.broadcastService.create({
        type: session.broadcastType,
        content: session.broadcastContent,
        mediaFileId: session.broadcastMediaFileId,
      });

      await ctx.editMessageText(
        FormatUtils.template(MESSAGES.ADMIN_BROADCAST_STARTED, {
          total: broadcast.totalUsers.toString(),
        }),
        { parse_mode: 'Markdown' },
      );

      // Background'da yuborish
      this.broadcastService.send(broadcast.id).then(async () => {
        const updated = await this.broadcastService.findById(broadcast.id);
        if (updated) {
          await ctx.reply(
            FormatUtils.template(MESSAGES.ADMIN_BROADCAST_COMPLETED, {
              sent: updated.sentCount.toString(),
              failed: updated.failedCount.toString(),
              total: updated.totalUsers.toString(),
            }),
            { parse_mode: 'Markdown' },
          );
        }
      });

      await this.redisService.deleteSession(telegramId);
    } catch (error) {
      this.logger.error('Error sending broadcast:', error);
      await ctx.reply('❌ Xatolik yuz berdi');
    }
  }

  // Broadcast bekor qilish
  @Action('admin:broadcast:cancel')
  async onBroadcastCancel(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    await this.redisService.deleteSession(telegramId);
    await this.onAdminMenu(ctx);
  }

  // Admin matn input handler
  @On('text')
  async onAdminText(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) return;
    if (!('text' in ctx.message!)) return;

    const text = ctx.message.text;
    const session = await this.redisService.getSession<AdminSession>(telegramId);

    if (!session?.step?.startsWith('admin:')) return;

    // Kanal qo'shish jarayoni
    if (session.step === 'admin:channel:name') {
      await this.redisService.setSession<AdminSession>(telegramId, {
        ...session,
        step: 'admin:channel:telegram_id',
        channelName: text,
      });
      await ctx.reply(MESSAGES.ADMIN_ADD_CHANNEL_ID, { parse_mode: 'Markdown' });
      return;
    }

    if (session.step === 'admin:channel:telegram_id') {
      if (!ValidationUtils.isValidChannelId(text)) {
        await ctx.reply('❌ Noto\'g\'ri format. Masalan: -1001234567890');
        return;
      }
      await this.redisService.setSession<AdminSession>(telegramId, {
        ...session,
        step: 'admin:channel:description',
        channelTelegramId: text,
      });
      await ctx.reply(MESSAGES.ADMIN_ADD_CHANNEL_DESC, {
        parse_mode: 'Markdown',
        ...KeyboardUtils.skipButton(),
      });
      return;
    }

    if (session.step === 'admin:channel:description') {
      const description = text.toLowerCase() === "o'tkazib yuborish" ? '' : text;
      await this.redisService.setSession<AdminSession>(telegramId, {
        ...session,
        step: 'admin:channel:price',
        channelDescription: description,
      });
      await ctx.reply(MESSAGES.ADMIN_ADD_CHANNEL_PRICE, { parse_mode: 'Markdown' });
      return;
    }

    if (session.step === 'admin:channel:price') {
      if (!ValidationUtils.isValidNumber(text)) {
        await ctx.reply('❌ Faqat raqam kiriting');
        return;
      }
      await this.redisService.setSession<AdminSession>(telegramId, {
        ...session,
        step: 'admin:channel:duration',
        channelPrice: parseInt(text),
      });
      await ctx.reply(MESSAGES.ADMIN_ADD_CHANNEL_DURATION, { parse_mode: 'Markdown' });
      return;
    }

    if (session.step === 'admin:channel:duration') {
      if (!ValidationUtils.isValidNumber(text)) {
        await ctx.reply('❌ Faqat raqam kiriting');
        return;
      }

      const duration = parseInt(text);

      // Kanal yaratish
      const channel = await this.channelService.create({
        name: session.channelName!,
        telegramChannelId: session.channelTelegramId!,
        description: session.channelDescription,
        price: session.channelPrice!,
        duration,
      });

      await this.redisService.deleteSession(telegramId);

      const message = FormatUtils.template(MESSAGES.ADMIN_CHANNEL_CREATED, {
        name: channel.name,
        price: FormatUtils.formatMoney(Number(channel.price)),
        duration: channel.duration.toString(),
      });

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...KeyboardUtils.mainMenu(true),
      });
      return;
    }

    // Broadcast matn
    if (session.step === 'admin:broadcast:text') {
      const count = await this.broadcastService.getActiveUsersCount();
      await this.redisService.setSession<AdminSession>(telegramId, {
        ...session,
        broadcastContent: text,
      });

      await ctx.reply(
        FormatUtils.template(MESSAGES.ADMIN_BROADCAST_CONFIRM, {
          count: count.toString(),
        }),
        {
          parse_mode: 'Markdown',
          ...KeyboardUtils.broadcastConfirm(),
        },
      );
      return;
    }
  }

  // Admin rasm input handler
  @On('photo')
  async onAdminPhoto(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) return;
    if (!('photo' in ctx.message!)) return;

    const session = await this.redisService.getSession<AdminSession>(telegramId);
    if (session?.step !== 'admin:broadcast:photo') return;

    const photo = ctx.message.photo;
    const fileId = photo[photo.length - 1].file_id;
    const caption = ctx.message.caption || '';

    const count = await this.broadcastService.getActiveUsersCount();
    await this.redisService.setSession<AdminSession>(telegramId, {
      ...session,
      broadcastContent: caption,
      broadcastMediaFileId: fileId,
    });

    await ctx.reply(
      FormatUtils.template(MESSAGES.ADMIN_BROADCAST_CONFIRM, {
        count: count.toString(),
      }),
      {
        parse_mode: 'Markdown',
        ...KeyboardUtils.broadcastConfirm(),
      },
    );
  }

  // Admin video input handler
  @On('video')
  async onAdminVideo(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) return;
    if (!('video' in ctx.message!)) return;

    const session = await this.redisService.getSession<AdminSession>(telegramId);
    if (session?.step !== 'admin:broadcast:video') return;

    const video = ctx.message.video;
    const fileId = video.file_id;
    const caption = ctx.message.caption || '';

    const count = await this.broadcastService.getActiveUsersCount();
    await this.redisService.setSession<AdminSession>(telegramId, {
      ...session,
      broadcastContent: caption,
      broadcastMediaFileId: fileId,
    });

    await ctx.reply(
      FormatUtils.template(MESSAGES.ADMIN_BROADCAST_CONFIRM, {
        count: count.toString(),
      }),
      {
        parse_mode: 'Markdown',
        ...KeyboardUtils.broadcastConfirm(),
      },
    );
  }

  // Skip button (kanal tavsifini o'tkazib yuborish)
  @Action('skip')
  async onSkip(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) return;

    const session = await this.redisService.getSession<AdminSession>(telegramId);
    if (session?.step === 'admin:channel:description') {
      await this.redisService.setSession<AdminSession>(telegramId, {
        ...session,
        step: 'admin:channel:price',
        channelDescription: '',
      });
      await ctx.editMessageText(MESSAGES.ADMIN_ADD_CHANNEL_PRICE, {
        parse_mode: 'Markdown',
      });
    }
    await ctx.answerCbQuery();
  }
}
