import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Update, Start, Help, Ctx, On, Hears, Action, InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { BotContext } from '../common/types/context.type';
import { MESSAGES, BUTTONS } from '../common/constants/messages';
import { KeyboardUtils } from '../common/utils/keyboard.utils';
import { ValidationUtils, FormatUtils, DateUtils } from '../common/utils/helpers';
import { UserService } from '../modules/user/user.service';
import { ChannelService } from '../modules/channel/channel.service';
import { SubscriptionService } from '../modules/subscription/subscription.service';
import { PaymentService } from '../modules/payment/payment.service';
import { PaymeService } from '../modules/payment/payme.service';
import { ExcelService } from '../modules/excel/excel.service';
import { RedisService } from '../redis/redis.service';
import { PaymentStatus } from '../database/entities/payment.entity';
import { SubscriptionStatus } from '../database/entities/subscription.entity';
import { UserStatus } from '../database/entities/user.entity';

// Excel yuborish uchun kanal ID
const REPORT_CHANNEL_ID = '-1003881722408';

@Update()
@Injectable()
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);
  private readonly adminIds: string[];

  constructor(
    @InjectBot() private readonly bot: Telegraf<BotContext>,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly channelService: ChannelService,
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentService: PaymentService,
    private readonly paymeService: PaymeService,
    private readonly excelService: ExcelService,
    private readonly redisService: RedisService,
  ) {
    const adminIdsStr = this.configService.get<string>('ADMIN_IDS', '');
    this.adminIds = adminIdsStr.split(',').filter((id) => id.trim());
  }

  private isAdmin(telegramId: string): boolean {
    return this.adminIds.includes(telegramId);
  }

  // Kanalga Excel yuborish (obunachi)
  private async sendSubscriberExcelToChannel(userData: {
    telegramId: string;
    fullName: string;
    phoneNumber: string;
    channelName: string;
    startDate: Date;
    endDate: Date;
    amount: number;
  }): Promise<void> {
    try {
      const excelBuffer = await this.excelService.generateNewSubscriberExcel(userData);
      await this.bot.telegram.sendDocument(
        REPORT_CHANNEL_ID,
        {
          source: excelBuffer,
          filename: `obunachi_${userData.telegramId}_${Date.now()}.xlsx`,
        },
        {
          caption: `✅ *Yangi obunachi!*\n\n👤 Ism: ${userData.fullName}\n📱 Tel: ${userData.phoneNumber}\n📺 Kanal: ${userData.channelName}\n💰 To'lov: ${FormatUtils.formatMoney(userData.amount)} so'm`,
          parse_mode: 'Markdown',
        },
      );
      this.logger.log(`Subscriber Excel sent for user ${userData.telegramId}`);
    } catch (error) {
      this.logger.error('Error sending subscriber Excel to channel:', error);
    }
  }

  // Kanalga Excel yuborish (qiziquvchi)
  private async sendInterestedExcelToChannel(userData: {
    telegramId: string;
    fullName: string;
    phoneNumber: string;
    channelName?: string;
    action: string;
  }): Promise<void> {
    try {
      const excelBuffer = await this.excelService.generateNewInterestedExcel(userData);
      await this.bot.telegram.sendDocument(
        REPORT_CHANNEL_ID,
        {
          source: excelBuffer,
          filename: `qiziquvchi_${userData.telegramId}_${Date.now()}.xlsx`,
        },
        {
          caption: `👀 *Qiziquvchi!*\n\n👤 Ism: ${userData.fullName}\n📱 Tel: ${userData.phoneNumber}\n📺 Kanal: ${userData.channelName || '-'}\n📝 Harakat: ${userData.action}`,
          parse_mode: 'Markdown',
        },
      );
      this.logger.log(`Interested Excel sent for user ${userData.telegramId}`);
    } catch (error) {
      this.logger.error('Error sending interested Excel to channel:', error);
    }
  }

  // /help buyrug'i
  @Help()
  async onHelp(@Ctx() ctx: BotContext) {
    await ctx.reply(MESSAGES.HELP, { parse_mode: 'Markdown' });
  }

  // /start buyrug'i
  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    try {
      const user = await this.userService.findByTelegramId(telegramId);

      if (user) {
        // Allaqachon ro'yxatdan o'tgan
        await ctx.reply(MESSAGES.ALREADY_REGISTERED, {
          parse_mode: 'Markdown',
          ...KeyboardUtils.mainMenu(this.isAdmin(telegramId)),
        });
        return;
      }

      // Yangi foydalanuvchi - ro'yxatdan o'tishni boshlash
      await this.redisService.setSession(telegramId, { step: 'ask_name' });

      await ctx.reply(MESSAGES.WELCOME, { parse_mode: 'Markdown' });
      await ctx.reply(MESSAGES.ASK_FULL_NAME, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error('Error in start command:', error);
      await ctx.reply(MESSAGES.ERROR_GENERAL);
    }
  }

  // Matnli xabarlar
  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !('text' in ctx.message!)) return;

    const text = ctx.message.text;

    // Admin panel tugmasi
    if (text === BUTTONS.ADMIN_PANEL && this.isAdmin(telegramId)) {
      return this.showAdminPanel(ctx);
    }

    // Asosiy menyu tugmalari
    if (text === BUTTONS.CHANNELS) {
      return this.showChannels(ctx);
    }

    if (text === BUTTONS.MY_SUBSCRIPTIONS) {
      return this.showSubscriptions(ctx);
    }

    if (text === BUTTONS.HELP) {
      await ctx.reply(MESSAGES.HELP, { parse_mode: 'Markdown' });
      return;
    }

    // Session tekshirish
    const session = await this.redisService.getSession<{
      step?: string;
      fullName?: string;
      adminAction?: string;
      editChannelId?: string;
      editField?: string;
      broadcastType?: string;
      broadcastContent?: string;
    }>(telegramId);

    if (!session?.step) {
      // Ro'yxatdan o'tganligini tekshirish
      const user = await this.userService.findByTelegramId(telegramId);
      if (!user) {
        await ctx.reply(MESSAGES.ERROR_NOT_REGISTERED);
      }
      return;
    }

    // Ro'yxatdan o'tish jarayoni
    if (session.step === 'ask_name') {
      return this.handleNameInput(ctx, text, telegramId);
    }

    if (session.step === 'ask_phone') {
      return this.handlePhoneInput(ctx, text, telegramId, session.fullName!);
    }

    // Admin jarayonlari
    if (session.step?.startsWith('admin:')) {
      return this.handleAdminChannelInput(ctx, text, telegramId, session);
    }
  }

  // Admin kanal qo'shish input handleri
  private async handleAdminChannelInput(
    ctx: BotContext,
    text: string,
    telegramId: string,
    session: Record<string, unknown>,
  ) {
    // Kanal qo'shish jarayoni
    if (session.step === 'admin:channel:name') {
      await this.redisService.setSession(telegramId, {
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
      await this.redisService.setSession(telegramId, {
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
      await this.redisService.setSession(telegramId, {
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
      await this.redisService.setSession(telegramId, {
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
        name: session.channelName as string,
        telegramChannelId: session.channelTelegramId as string,
        description: session.channelDescription as string,
        price: session.channelPrice as number,
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
      await this.redisService.setSession(telegramId, {
        ...session,
        broadcastContent: text,
      });

      const userCount = await this.userService.countAll();
      await ctx.reply(
        FormatUtils.template(MESSAGES.ADMIN_BROADCAST_CONFIRM, {
          count: userCount.toString(),
        }),
        {
          parse_mode: 'Markdown',
          ...KeyboardUtils.broadcastConfirm(),
        },
      );
      return;
    }

    // Kanal tahrirlash - nom
    if (session.step === 'admin:edit:name') {
      const channelId = session.editChannelId as string;
      await this.channelService.update(channelId, { name: text });
      await this.redisService.deleteSession(telegramId);
      await ctx.reply(`✅ Kanal nomi "${text}" ga o'zgartirildi`, {
        parse_mode: 'Markdown',
        ...KeyboardUtils.mainMenu(true),
      });
      return;
    }

    // Kanal tahrirlash - tavsif
    if (session.step === 'admin:edit:desc') {
      const channelId = session.editChannelId as string;
      await this.channelService.update(channelId, { description: text });
      await this.redisService.deleteSession(telegramId);
      await ctx.reply(`✅ Kanal tavsifi o'zgartirildi`, {
        parse_mode: 'Markdown',
        ...KeyboardUtils.mainMenu(true),
      });
      return;
    }

    // Kanal tahrirlash - narx
    if (session.step === 'admin:edit:price') {
      if (!ValidationUtils.isValidNumber(text)) {
        await ctx.reply('❌ Faqat raqam kiriting');
        return;
      }
      const channelId = session.editChannelId as string;
      const price = parseInt(text);
      await this.channelService.update(channelId, { price });
      await this.redisService.deleteSession(telegramId);
      await ctx.reply(`✅ Kanal narxi ${FormatUtils.formatMoney(price)} so'mga o'zgartirildi`, {
        parse_mode: 'Markdown',
        ...KeyboardUtils.mainMenu(true),
      });
      return;
    }

    // Kanal tahrirlash - muddat
    if (session.step === 'admin:edit:duration') {
      if (!ValidationUtils.isValidNumber(text)) {
        await ctx.reply('❌ Faqat raqam kiriting');
        return;
      }
      const channelId = session.editChannelId as string;
      const duration = parseInt(text);
      await this.channelService.update(channelId, { duration });
      await this.redisService.deleteSession(telegramId);
      await ctx.reply(`✅ Kanal muddati ${duration} kunga o'zgartirildi`, {
        parse_mode: 'Markdown',
        ...KeyboardUtils.mainMenu(true),
      });
      return;
    }
  }

  // Telefon kontakti
  @On('contact')
  async onContact(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId || !('contact' in ctx.message!)) return;

    const session = await this.redisService.getSession<{
      step?: string;
      fullName?: string;
    }>(telegramId);

    if (session?.step !== 'ask_phone') return;

    const phone = ctx.message.contact.phone_number;
    const formattedPhone = ValidationUtils.formatPhone(phone);

    return this.completeRegistration(ctx, telegramId, session.fullName!, formattedPhone);
  }

  // Ism kiritish
  private async handleNameInput(ctx: BotContext, text: string, telegramId: string) {
    if (!ValidationUtils.isValidName(text)) {
      await ctx.reply(MESSAGES.INVALID_NAME, { parse_mode: 'Markdown' });
      return;
    }

    await this.redisService.setSession(telegramId, {
      step: 'ask_phone',
      fullName: text.trim(),
    });

    await ctx.reply(MESSAGES.ASK_PHONE, {
      parse_mode: 'Markdown',
      ...KeyboardUtils.phoneRequest(),
    });
  }

  // Telefon kiritish
  private async handlePhoneInput(
    ctx: BotContext,
    text: string,
    telegramId: string,
    fullName: string,
  ) {
    const formattedPhone = ValidationUtils.formatPhone(text);

    if (!ValidationUtils.isValidPhone(formattedPhone)) {
      await ctx.reply(MESSAGES.INVALID_PHONE, {
        parse_mode: 'Markdown',
        ...KeyboardUtils.phoneRequest(),
      });
      return;
    }

    return this.completeRegistration(ctx, telegramId, fullName, formattedPhone);
  }

  // Ro'yxatdan o'tishni yakunlash
  private async completeRegistration(
    ctx: BotContext,
    telegramId: string,
    fullName: string,
    phoneNumber: string,
  ) {
    try {
      await this.userService.create({
        telegramId,
        username: ctx.from?.username,
        fullName,
        phoneNumber,
      });

      await this.redisService.deleteSession(telegramId);

      await ctx.reply(MESSAGES.REGISTRATION_SUCCESS, {
        parse_mode: 'Markdown',
        ...KeyboardUtils.mainMenu(this.isAdmin(telegramId)),
      });
    } catch (error) {
      this.logger.error('Error completing registration:', error);
      await ctx.reply(MESSAGES.ERROR_GENERAL);
    }
  }

  // Kanallar ro'yxati
  private async showChannels(ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    const user = await this.userService.findByTelegramId(telegramId);
    if (!user) {
      await ctx.reply(MESSAGES.ERROR_NOT_REGISTERED);
      return;
    }

    const channels = await this.channelService.findActive();

    if (channels.length === 0) {
      await ctx.reply(MESSAGES.NO_CHANNELS, { parse_mode: 'Markdown' });
      return;
    }

    await ctx.reply(MESSAGES.CHANNELS_LIST, {
      parse_mode: 'Markdown',
      ...KeyboardUtils.channelsList(
        channels.map((c) => ({
          id: c.id,
          name: c.name,
          price: Number(c.price),
          duration: c.duration,
        })),
      ),
    });
  }

  // Kanal tanlash
  @Action(/^channel:(.+)$/)
  async onChannelSelect(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    const channelId = ctx.match![1];
    const channel = await this.channelService.findById(channelId);

    if (!channel) {
      await ctx.answerCbQuery('Kanal topilmadi');
      return;
    }

    // Qiziquvchi sifatida track qilish (kanal ko'rildi)
    const user = await this.userService.findByTelegramId(telegramId);
    if (user) {
      // Faqat obunasi yo'q userlar uchun
      const hasActiveSubscription = await this.subscriptionService.hasActiveSubscription(
        user.id,
        channelId,
      );
      if (!hasActiveSubscription) {
        await this.sendInterestedExcelToChannel({
          telegramId: user.telegramId,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          channelName: channel.name,
          action: "Kanalni ko'rdi",
        });
      }
    }

    const message = FormatUtils.template(MESSAGES.CHANNEL_INFO, {
      name: channel.name,
      description: channel.description || 'Tavsif mavjud emas',
      price: FormatUtils.formatMoney(Number(channel.price)),
      duration: channel.duration.toString(),
    });

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...KeyboardUtils.channelActions(channelId),
    });

    await ctx.answerCbQuery();
  }

  // To'lov boshlash - To'lov usullarini ko'rsatish
  @Action(/^pay:(.+)$/)
  async onPay(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    const channelId = ctx.match![1];
    const channel = await this.channelService.findById(channelId);
    const user = await this.userService.findByTelegramId(telegramId);

    if (!channel || !user) {
      await ctx.answerCbQuery('Xatolik yuz berdi');
      return;
    }

    try {
      // Check against merchant minimum amount (configured in PAYME_MIN_AMOUNT, in UZS)
      const minAmount = Number(this.configService.get<string>('PAYME_MIN_AMOUNT', '0')) || 0;
      const price = Number(channel.price);
      if (minAmount > 0 && price < minAmount) {
        await ctx.answerCbQuery(
          `To'lov miqdori juda kichik. Minimal summa: ${FormatUtils.formatMoney(minAmount)}`,
          { show_alert: true },
        );
        return;
      }

      // Buyurtma yaratish
      const orderId = this.paymeService.generateOrderId();
      const payment = await this.paymentService.create({
        userId: user.id,
        amount: Number(channel.price),
        channelId: channel.id,
        paymeOrderId: orderId,
      });

      // Payme URL yaratish (fallback uchun)
      const paymeUrl = this.paymeService.generatePaymentUrl(orderId, Number(channel.price));
      
      // Telegram payment mavjudligini tekshirish
      const providerToken = this.configService.get<string>('TELEGRAM_PAYMENT_PROVIDER_TOKEN');
      const hasTelegramPayment = !!(providerToken && providerToken !== 'your_provider_token_here');
      
      this.logger.log(`[Payment] Provider token: ${providerToken ? 'EXISTS' : 'NOT SET'}, hasTelegramPayment: ${hasTelegramPayment}`);

      const message = FormatUtils.template(MESSAGES.PAYMENT_CREATED, {
        channel: channel.name,
        amount: FormatUtils.formatMoney(Number(channel.price)),
      });

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...KeyboardUtils.paymentActions(payment.id, paymeUrl, hasTelegramPayment),
      });

      await ctx.answerCbQuery();
    } catch (error) {
      this.logger.error('Error creating payment:', error);
      await ctx.answerCbQuery('Xatolik yuz berdi');
    }
  }

  // Telegram Native Payment - Invoice yuborish
  @Action(/^tgpay:(.+)$/)
  async onTelegramPay(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    const paymentId = ctx.match![1];
    const payment = await this.paymentService.findById(paymentId);

    if (!payment) {
      await ctx.answerCbQuery('To\'lov topilmadi');
      return;
    }

    const channel = await this.channelService.findById(payment.channelId);
    if (!channel) {
      await ctx.answerCbQuery('Kanal topilmadi');
      return;
    }

    const providerToken = this.configService.get<string>('TELEGRAM_PAYMENT_PROVIDER_TOKEN');
    if (!providerToken || providerToken === 'your_provider_token_here') {
      await ctx.answerCbQuery('Telegram to\'lov sozlanmagan', { show_alert: true });
      return;
    }

    try {
      await ctx.answerCbQuery();
      
      const price = Number(payment.amount);
      
      // Payload max 128 bytes - faqat paymentId yuboramiz
      await ctx.telegram.sendInvoice(ctx.chat!.id, {
        title: `${channel.name} obunasi`,
        description: `${channel.name} kanaliga ${channel.duration} kunlik obuna`,
        payload: payment.id, // Faqat payment ID (UUID = 36 bytes)
        provider_token: providerToken,
        currency: 'UZS',
        prices: [
          { label: `${channel.name} (${channel.duration} kun)`, amount: price * 100 }, // Telegram uses smallest currency unit (tiyin)
        ],
        start_parameter: `pay_${channel.id}`,
        need_name: false,
        need_phone_number: false,
        need_email: false,
        need_shipping_address: false,
        is_flexible: false,
      });

    } catch (error) {
      this.logger.error('Error creating payment:', error);
      await ctx.answerCbQuery('Xatolik yuz berdi');
    }
  }

  // Pre-checkout so'rovi - Telegram Payment
  @On('pre_checkout_query')
  async onPreCheckout(@Ctx() ctx: BotContext) {
    try {
      const query = ctx.preCheckoutQuery;
      if (!query) return;

      this.logger.log(`[Pre-checkout] ID: ${query.id}, Amount: ${query.total_amount}, Currency: ${query.currency}`);
      
      // Payload endi faqat paymentId (string)
      const paymentId = query.invoice_payload;
      const payment = await this.paymentService.findById(paymentId);

      if (!payment) {
        await ctx.answerPreCheckoutQuery(false, 'To\'lov topilmadi');
        return;
      }

      if (payment.status !== PaymentStatus.PENDING) {
        await ctx.answerPreCheckoutQuery(false, 'Bu to\'lov allaqachon amalga oshirilgan');
        return;
      }

      // Tasdiqlash
      await ctx.answerPreCheckoutQuery(true);
      this.logger.log(`[Pre-checkout] Approved for payment ${paymentId}`);
    } catch (error) {
      this.logger.error('Pre-checkout error:', error);
      await ctx.answerPreCheckoutQuery(false, 'Xatolik yuz berdi');
    }
  }

  // Muvaffaqiyatli to'lov - Telegram Payment
  @On('successful_payment')
  async onSuccessfulPayment(@Ctx() ctx: BotContext) {
    try {
      const successfulPayment = (ctx.message as any)?.successful_payment;
      if (!successfulPayment) return;

      this.logger.log(`[Successful Payment] Provider: ${successfulPayment.provider_payment_charge_id}, Telegram: ${successfulPayment.telegram_payment_charge_id}`);

      // Payload endi faqat paymentId (string)
      const paymentId = successfulPayment.invoice_payload;
      const payment = await this.paymentService.findById(paymentId);

      if (!payment) {
        this.logger.error('Payment not found for successful payment');
        return;
      }

      // To'lovni tasdiqlash
      await this.paymentService.updateStatus(payment.id, PaymentStatus.PAID);
      await this.paymentService.setPaymeTransactionId(payment.id, successfulPayment.provider_payment_charge_id);

      this.logger.log(`[Successful Payment] Payment ${payment.id} marked as PAID`);

      // Obuna yaratish
      const channel = await this.channelService.findById(payment.channelId);
      if (!channel) {
        await ctx.reply('❌ Kanal topilmadi. Admin bilan bog\'laning.');
        return;
      }

      const startDate = DateUtils.today();
      const endDate = DateUtils.addDays(startDate, channel.duration);

      // Bir martalik invite link yaratish
      let inviteLink = '';
      try {
        const link = await ctx.telegram.createChatInviteLink(channel.telegramChannelId, {
          member_limit: 1,
          expire_date: Math.floor(Date.now() / 1000) + 86400, // 24 soat
        });
        inviteLink = link.invite_link;
      } catch (error) {
        this.logger.error('Error creating invite link:', error);
      }

      // Obuna yaratish
      const subscription = await this.subscriptionService.create({
        userId: payment.userId,
        channelId: channel.id,
        startDate,
        endDate,
        inviteLink,
      });

      await this.paymentService.setSubscriptionId(payment.id, subscription.id);

      // Excel yuborish - yangi obunachi
      const user = await this.userService.findById(payment.userId);
      if (user) {
        await this.sendSubscriberExcelToChannel({
          telegramId: user.telegramId,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          channelName: channel.name,
          startDate,
          endDate,
          amount: payment.amount,
        });
      }

      // Foydalanuvchiga xabar
      const message = FormatUtils.template(MESSAGES.PAYMENT_SUCCESS, {
        channel: channel.name,
        endDate: DateUtils.format(endDate),
      });

      await ctx.reply(message, { parse_mode: 'Markdown' });

      if (inviteLink) {
        await ctx.reply(
          `🔗 Kanalga kirish havolasi:\n${inviteLink}\n\n⚠️ Bu havola 24 soat ichida amal qiladi va faqat 1 marta ishlatilishi mumkin.`,
        );
      }

    } catch (error) {
      this.logger.error('Successful payment handling error:', error);
      await ctx.reply('❌ To\'lov qayta ishlashda xatolik. Admin bilan bog\'laning.');
    }
  }

  // To'lovni tekshirish
  @Action(/^check:(.+)$/)
  async onCheckPayment(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    const paymentId = ctx.match![1];
    const payment = await this.paymentService.findById(paymentId);

    if (!payment) {
      await ctx.answerCbQuery('To\'lov topilmadi');
      return;
    }

    if (payment.status === PaymentStatus.PAID) {
      // Obuna yaratish
      await this.createSubscription(ctx, payment);
      return;
    }

    if (payment.status === PaymentStatus.PENDING) {
      await ctx.answerCbQuery(MESSAGES.PAYMENT_PENDING, { show_alert: true });
      return;
    }

    await ctx.answerCbQuery(MESSAGES.PAYMENT_FAILED, { show_alert: true });
  }

  // Obuna yaratish
  private async createSubscription(ctx: BotContext, payment: any) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    try {
      const channel = await this.channelService.findById(payment.channelId);
      if (!channel) {
        await ctx.answerCbQuery('Kanal topilmadi');
        return;
      }

      const startDate = DateUtils.today();
      const endDate = DateUtils.addDays(startDate, channel.duration);

      // Bir martalik invite link yaratish
      let inviteLink = '';
      try {
        const link = await ctx.telegram.createChatInviteLink(channel.telegramChannelId, {
          member_limit: 1,
          expire_date: Math.floor(Date.now() / 1000) + 86400, // 24 soat
        });
        inviteLink = link.invite_link;
      } catch (linkError) {
        this.logger.error('Error creating invite link:', linkError);
      }

      // Obuna yaratish
      const subscription = await this.subscriptionService.create({
        userId: payment.userId,
        channelId: channel.id,
        startDate,
        endDate,
        inviteLink,
      });

      // Payment'ga subscription ID qo'shish
      await this.paymentService.setSubscriptionId(payment.id, subscription.id);

      // User statusini yangilash
      await this.userService.updateStatus(payment.userId, UserStatus.ACTIVE);

      // Excel yuborish - yangi obunachi
      const user = await this.userService.findById(payment.userId);
      if (user) {
        await this.sendSubscriberExcelToChannel({
          telegramId: user.telegramId,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          channelName: channel.name,
          startDate,
          endDate,
          amount: payment.amount,
        });
      }

      const message = FormatUtils.template(MESSAGES.PAYMENT_SUCCESS, {
        channel: channel.name,
        duration: channel.duration.toString(),
        endDate: DateUtils.format(endDate),
        inviteLink: inviteLink || 'Link yaratishda xatolik',
      });

      await ctx.editMessageText(message, { parse_mode: 'Markdown' });
      await ctx.answerCbQuery('✅ To\'lov muvaffaqiyatli!');
    } catch (error) {
      this.logger.error('Error creating subscription:', error);
      await ctx.answerCbQuery('Xatolik yuz berdi');
    }
  }

  // To'lovni bekor qilish
  @Action(/^cancel:(.+)$/)
  async onCancelPayment(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    const paymentId = ctx.match![1];
    const payment = await this.paymentService.findById(paymentId);

    // Qiziquvchi sifatida Excel yuborish
    if (payment) {
      const user = await this.userService.findById(payment.userId);
      const channel = await this.channelService.findById(payment.channelId);
      if (user) {
        await this.sendInterestedExcelToChannel({
          telegramId: user.telegramId,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          channelName: channel?.name,
          action: "To'lovni bekor qildi",
        });
      }
    }

    await this.paymentService.updateStatus(paymentId, PaymentStatus.CANCELLED);
    await ctx.editMessageText(MESSAGES.PAYMENT_CANCELLED, { parse_mode: 'Markdown' });
    await ctx.answerCbQuery();
  }

  // Obunalarim
  private async showSubscriptions(ctx: BotContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    const user = await this.userService.findByTelegramId(telegramId);
    if (!user) {
      await ctx.reply(MESSAGES.ERROR_NOT_REGISTERED);
      return;
    }

    const subscriptions = await this.subscriptionService.findActiveByUser(user.id);

    if (subscriptions.length === 0) {
      await ctx.reply(MESSAGES.NO_SUBSCRIPTIONS, { parse_mode: 'Markdown' });
      return;
    }

    let message = MESSAGES.MY_SUBSCRIPTIONS + '\n\n';

    for (const sub of subscriptions) {
      const daysLeft = DateUtils.daysBetween(DateUtils.today(), sub.endDate);
      message += FormatUtils.template(MESSAGES.SUBSCRIPTION_ITEM, {
        channel: sub.channel.name,
        endDate: DateUtils.format(sub.endDate),
        daysLeft: daysLeft.toString(),
      });
      message += '\n\n';
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }

  // Obuna uzaytirish
  @Action(/^extend:(.+)$/)
  async onExtendSubscription(@Ctx() ctx: BotContext) {
    const channelId = ctx.match![1];
    const channel = await this.channelService.findById(channelId);

    if (!channel) {
      await ctx.answerCbQuery('Kanal topilmadi');
      return;
    }

    const message = FormatUtils.template(MESSAGES.CHANNEL_INFO, {
      name: channel.name,
      description: channel.description || 'Tavsif mavjud emas',
      price: FormatUtils.formatMoney(Number(channel.price)),
      duration: channel.duration.toString(),
    });

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...KeyboardUtils.channelActions(channelId),
    });

    await ctx.answerCbQuery();
  }

  // Orqaga tugmasi
  @Action(/^back:(.+)$/)
  async onBack(@Ctx() ctx: BotContext) {
    const action = ctx.match![1];

    if (action === 'main') {
      await ctx.deleteMessage();
    } else if (action === 'channels') {
      await this.showChannels(ctx);
    }

    await ctx.answerCbQuery();
  }

  // Admin panel
  private async showAdminPanel(ctx: BotContext) {
    await ctx.reply(MESSAGES.ADMIN_PANEL, {
      parse_mode: 'Markdown',
      ...KeyboardUtils.adminMenu(),
    });
  }
}
