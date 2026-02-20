import { Markup } from 'telegraf';
import { BUTTONS } from '../constants/messages';

export class KeyboardUtils {
  // Asosiy menyu
  static mainMenu(isAdmin: boolean = false) {
    const buttons = [
      [BUTTONS.CHANNELS, BUTTONS.MY_SUBSCRIPTIONS],
      [BUTTONS.HELP],
    ];

    if (isAdmin) {
      buttons.push([BUTTONS.ADMIN_PANEL]);
    }

    return Markup.keyboard(buttons).resize();
  }

  // Telefon yuborish
  static phoneRequest() {
    return Markup.keyboard([
      [Markup.button.contactRequest(BUTTONS.SEND_PHONE)],
    ]).resize().oneTime();
  }

  // Kanal tanlash (inline)
  static channelsList(channels: Array<{ id: string; name: string; price: number; duration: number }>) {
    const buttons = channels.map((channel) => [
      Markup.button.callback(
        `📺 ${channel.name} - ${channel.price.toLocaleString()} so'm (${channel.duration} kun)`,
        `channel:${channel.id}`,
      ),
    ]);

    buttons.push([Markup.button.callback(BUTTONS.BACK, 'back:main')]);

    return Markup.inlineKeyboard(buttons);
  }

  // Kanal ma'lumotlari
  static channelActions(channelId: string) {
    return Markup.inlineKeyboard([
      [Markup.button.callback(BUTTONS.PAY_WITH_PAYME, `pay:${channelId}`)],
      [Markup.button.callback(BUTTONS.BACK, 'back:channels')],
    ]);
  }

  // To'lov - Telegram native (Payme URL olib tashlandi)
  static paymentActions(paymentId: string, paymeUrl: string, hasTelegramPayment: boolean = false) {
    const buttons = [];
    
    // Telegram native payment (faqat shu)
    if (hasTelegramPayment) {
      buttons.push([Markup.button.callback('💳 To\'lov qilish', `tgpay:${paymentId}`)]);
    } else {
      // Fallback: Payme URL (agar Telegram payment yo'q bo'lsa)
      buttons.push([Markup.button.url(BUTTONS.PAY_WITH_PAYME, paymeUrl)]);
    }
    
    buttons.push([Markup.button.callback(BUTTONS.CHECK_PAYMENT, `check:${paymentId}`)]);
    buttons.push([Markup.button.callback(BUTTONS.CANCEL, `cancel:${paymentId}`)]);
    
    return Markup.inlineKeyboard(buttons);
  }

  // Obuna uzaytirish
  static extendSubscription(channelId: string) {
    return Markup.inlineKeyboard([
      [Markup.button.callback(BUTTONS.EXTEND_SUBSCRIPTION, `extend:${channelId}`)],
    ]);
  }

  // Admin panel
  static adminMenu() {
    return Markup.inlineKeyboard([
      [Markup.button.callback(BUTTONS.ADMIN_STATS, 'admin:stats')],
      [Markup.button.callback(BUTTONS.ADMIN_CHANNELS, 'admin:channels')],
      [Markup.button.callback(BUTTONS.ADMIN_USERS, 'admin:users')],
      [Markup.button.callback(BUTTONS.ADMIN_BROADCAST, 'admin:broadcast')],
      [Markup.button.callback(BUTTONS.BACK, 'back:main')],
    ]);
  }

  // Admin kanallar
  static adminChannelsList(
    channels: Array<{ id: string; name: string; isActive: boolean }>,
  ) {
    const buttons = channels.map((channel) => [
      Markup.button.callback(
        `${channel.isActive ? '✅' : '❌'} ${channel.name}`,
        `ch:${channel.id}`,
      ),
    ]);

    buttons.push([Markup.button.callback(BUTTONS.ADMIN_ADD_CHANNEL, 'ch:add')]);
    buttons.push([Markup.button.callback(BUTTONS.BACK, 'admin:menu')]);

    return Markup.inlineKeyboard(buttons);
  }

  // Admin kanal tahrirlash
  static adminChannelActions(channelId: string, isActive: boolean) {
    return Markup.inlineKeyboard([
      [Markup.button.callback(BUTTONS.EDIT, `ch:edit:${channelId}`)],
      [
        Markup.button.callback(
          isActive ? '❌ Faol emas qilish' : '✅ Faol qilish',
          `ch:tgl:${channelId}`,
        ),
      ],
      [Markup.button.callback(BUTTONS.DELETE, `ch:rm:${channelId}`)],
      [Markup.button.callback(BUTTONS.BACK, 'admin:channels')],
    ]);
  }

  // Kanal tahrirlash menyusi
  static editChannelMenu(channelId: string) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('📝 Nom', `ch:e:n:${channelId}`)],
      [Markup.button.callback('📄 Tavsif', `ch:e:d:${channelId}`)],
      [Markup.button.callback('💰 Narx', `ch:e:p:${channelId}`)],
      [Markup.button.callback('📅 Muddat', `ch:e:t:${channelId}`)],
      [Markup.button.callback(BUTTONS.BACK, `ch:${channelId}`)],
    ]);
  }

  // Admin foydalanuvchilar
  static adminUsersMenu() {
    return Markup.inlineKeyboard([
      [Markup.button.callback(BUTTONS.ADMIN_SUBSCRIBERS, 'admin:users:subscribers')],
      [Markup.button.callback(BUTTONS.ADMIN_INTERESTED, 'admin:users:interested')],
      [Markup.button.callback(BUTTONS.BACK, 'admin:menu')],
    ]);
  }

  // Excel export
  static exportExcel(type: 'subscribers' | 'interested') {
    return Markup.inlineKeyboard([
      [Markup.button.callback(BUTTONS.ADMIN_EXPORT_EXCEL, `admin:export:${type}`)],
      [Markup.button.callback(BUTTONS.BACK, 'admin:users')],
    ]);
  }

  // Broadcast turlari
  static broadcastTypes() {
    return Markup.inlineKeyboard([
      [Markup.button.callback(BUTTONS.ADMIN_BROADCAST_TEXT, 'admin:broadcast:text')],
      [Markup.button.callback(BUTTONS.ADMIN_BROADCAST_PHOTO, 'admin:broadcast:photo')],
      [Markup.button.callback(BUTTONS.ADMIN_BROADCAST_VIDEO, 'admin:broadcast:video')],
      [Markup.button.callback(BUTTONS.BACK, 'admin:menu')],
    ]);
  }

  // Broadcast tasdiqlash
  static broadcastConfirm() {
    return Markup.inlineKeyboard([
      [Markup.button.callback(BUTTONS.CONFIRM, 'admin:broadcast:confirm')],
      [Markup.button.callback(BUTTONS.CANCEL, 'admin:broadcast:cancel')],
    ]);
  }

  // O'chirish tasdiqlash
  static confirmDelete(channelId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Ha, o\'chirish', `ch:del:${channelId}`),
        Markup.button.callback('❌ Yo\'q', 'admin:channels'),
      ],
    ]);
  }

  // O'tkazib yuborish
  static skipButton() {
    return Markup.inlineKeyboard([
      [Markup.button.callback(BUTTONS.SKIP, 'skip')],
    ]);
  }
}
