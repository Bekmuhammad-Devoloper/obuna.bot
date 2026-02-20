export const MESSAGES = {
  // Start va Ro'yxatdan o'tish
  WELCOME: `🎉 *PulOqimi Bot*ga xush kelibsiz!

Bu bot orqali premium kanallarga obuna bo'lishingiz mumkin.

Davom etish uchun ro'yxatdan o'ting.`,

  ASK_FULL_NAME: `📝 *Iltimos, to'liq ismingizni kiriting:*

_Masalan: Aliyev Ali_`,

  INVALID_NAME: `❌ Ism noto'g'ri formatda!

Ism kamida 3 ta belgidan iborat bo'lishi kerak.
Iltimos, qaytadan kiriting:`,

  ASK_PHONE: `📱 *Telefon raqamingizni kiriting:*

_Format: +998XXXXXXXXX_

Yoki "📱 Telefon yuborish" tugmasini bosing:`,

  INVALID_PHONE: `❌ Telefon raqam noto'g'ri formatda!

To'g'ri format: +998XXXXXXXXX
Iltimos, qaytadan kiriting:`,

  REGISTRATION_SUCCESS: `✅ *Ro'yxatdan o'tish muvaffaqiyatli!*

Endi premium kanallarga obuna bo'lishingiz mumkin.

📺 *Kanallar* - Mavjud kanallarni ko'rish
📋 *Obunalarim* - Faol obunalaringiz`,

  ALREADY_REGISTERED: `👋 Siz allaqachon ro'yxatdan o'tgansiz!

Quyidagi tugmalardan foydalaning:`,

  // Asosiy menyu
  MAIN_MENU: `🏠 *Asosiy menyu*

Kerakli bo'limni tanlang:`,

  // Kanallar
  CHANNELS_LIST: `📺 *Mavjud kanallar:*

Obuna bo'lmoqchi bo'lgan kanalni tanlang:`,

  NO_CHANNELS: `😔 Hozircha faol kanallar mavjud emas.

Keyinroq qaytadan tekshiring.`,

  CHANNEL_INFO: `📺 *{name}*

{description}

💰 Narx: *{price} so'm*
📅 Muddat: *{duration} kun*

Obuna bo'lish uchun quyidagi tugmani bosing:`,

  // To'lov
  PAYMENT_CREATED: `💳 *To'lov ma'lumotlari:*

📺 Kanal: *{channel}*
💰 Summa: *{amount} so'm*

Quyidagi tugmani bosib Payme orqali to'lov qiling.
To'lovdan so'ng "✅ Tekshirish" tugmasini bosing.`,

  PAYMENT_SUCCESS: `✅ *To'lov muvaffaqiyatli!*

📺 Kanal: *{channel}*
📅 Muddat: *{duration} kun*
🔗 Tugash sanasi: *{endDate}*

Quyidagi link orqali kanalga qo'shiling:
{inviteLink}

⚠️ _Link 24 soat ichida yoki 1 marta ishlatilgandan keyin o'chiriladi._`,

  PAYMENT_PENDING: `⏳ To'lov hali tasdiqlanmagan.

Agar to'lov qilgan bo'lsangiz, biroz kuting va qaytadan tekshiring.`,

  PAYMENT_FAILED: `❌ To'lov amalga oshmadi.

Iltimos, qaytadan urinib ko'ring.`,

  PAYMENT_CANCELLED: `❌ To'lov bekor qilindi.`,

  // Obunalar
  MY_SUBSCRIPTIONS: `📋 *Sizning obunalaringiz:*`,

  NO_SUBSCRIPTIONS: `😔 Sizda hozircha faol obuna yo'q.

📺 *Kanallar* bo'limiga o'tib obuna bo'ling.`,

  SUBSCRIPTION_ITEM: `📺 *{channel}*
📅 Tugash: *{endDate}*
⏳ Qoldi: *{daysLeft} kun*`,

  // Bildirishnomalar
  EXPIRY_WARNING_1: `⚠️ *Eslatma!*

📺 *{channel}* kanaliga obunangiz *ertaga tugaydi*.

Obunani uzaytirish uchun to'lov qiling.`,

  EXPIRY_WARNING_2: `⚠️ *Diqqat!*

📺 *{channel}* kanaliga obunangiz *bugun tugaydi*!

Obunani uzaytirish uchun hoziroq to'lov qiling.`,

  FINAL_WARNING: `🚨 *Oxirgi ogohlantiruv!*

📺 *{channel}* kanaliga obunangiz *tugadi*.

Bugun to'lov qilmasangiz, *kanaldan chiqarib yuborilasiz*!`,

  REMOVAL_NOTICE: `❌ *Kanaldan chiqarildingiz*

To'lov qilinmaganligi sababli *{channel}* kanalidan chiqarildingiz.

Qayta obuna bo'lish uchun /start buyrug'ini bosing.`,

  // Yordam
  HELP: `📞 *Yordam*

Savollaringiz bo'lsa, quyidagi manzillarga murojaat qiling:

📧 Telegram: @Ilyosbekadmin\\_11
📱 Telefon: +998 33 122 63 05

Yoki /start buyrug'ini qaytadan bosing.`,

  // Xatolar
  ERROR_GENERAL: `❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.`,

  ERROR_NOT_REGISTERED: `⚠️ Siz hali ro'yxatdan o'tmagansiz.

/start buyrug'ini bosing.`,

  // Admin
  ADMIN_PANEL: `👨‍💼 *Admin Panel*

Kerakli bo'limni tanlang:`,

  ADMIN_STATS: `📊 *Statistika*

👥 Jami foydalanuvchilar: *{totalUsers}*
✅ Faol obunalar: *{activeSubscriptions}*
⏳ Bugun tugaydiganlar: *{expiringToday}*
💰 Bugungi daromad: *{todayRevenue} so'm*
💰 Oylik daromad: *{monthlyRevenue} so'm*`,

  ADMIN_CHANNELS: `📺 *Kanallar boshqaruvi*

Mavjud kanallar:`,

  ADMIN_NO_CHANNELS: `📺 Hozircha kanallar yo'q.

Yangi kanal qo'shish uchun tugmani bosing.`,

  ADMIN_ADD_CHANNEL_NAME: `📝 *Yangi kanal qo'shish*

Kanal nomini kiriting:`,

  ADMIN_ADD_CHANNEL_ID: `📝 Kanal Telegram ID sini kiriting:

_Masalan: -1001234567890_`,

  ADMIN_ADD_CHANNEL_DESC: `📝 Kanal tavsifini kiriting:

_Markdown qo'llab-quvvatlanadi. Bo'sh qoldirish uchun "o'tkazib yuborish" deb yozing._`,

  ADMIN_ADD_CHANNEL_PRICE: `💰 Kanal narxini kiriting (so'mda):

_Faqat raqamlar_`,

  ADMIN_ADD_CHANNEL_DURATION: `📅 Obuna muddatini kiriting (kunlarda):

_Masalan: 30_`,

  ADMIN_CHANNEL_CREATED: `✅ Kanal muvaffaqiyatli qo'shildi!

📺 *{name}*
💰 Narx: *{price} so'm*
📅 Muddat: *{duration} kun*`,

  ADMIN_CHANNEL_DELETED: `🗑️ Kanal o'chirildi: *{name}*`,

  ADMIN_CHANNEL_TOGGLED: `🔄 Kanal holati o'zgartirildi: *{name}*
Holat: *{status}*`,

  ADMIN_USERS: `👥 *Foydalanuvchilar boshqaruvi*

Kerakli bo'limni tanlang:`,

  ADMIN_BROADCAST_TYPE: `📢 *E'lon yuborish*

Xabar turini tanlang:`,

  ADMIN_BROADCAST_TEXT: `📝 Xabar matnini kiriting:`,

  ADMIN_BROADCAST_PHOTO: `📷 Rasm yuboring (caption bilan):`,

  ADMIN_BROADCAST_VIDEO: `🎥 Video yuboring (caption bilan):`,

  ADMIN_BROADCAST_CONFIRM: `📢 *E'lonni tasdiqlash*

👥 *{count}* ta foydalanuvchiga yuboriladi.

Davom etasizmi?`,

  ADMIN_BROADCAST_STARTED: `📢 E'lon yuborish boshlandi...

Jami: *{total}*`,

  ADMIN_BROADCAST_PROGRESS: `📢 Yuborilmoqda...

✅ Yuborildi: *{sent}*
❌ Xato: *{failed}*
📊 Jami: *{total}*`,

  ADMIN_BROADCAST_COMPLETED: `✅ E'lon yuborish tugadi!

✅ Yuborildi: *{sent}*
❌ Xato: *{failed}*
📊 Jami: *{total}*`,

  ADMIN_EXPORT_READY: `📊 Excel fayl tayyor!`,

  NOT_ADMIN: `⛔ Sizda admin huquqlari yo'q.`,
};

export const BUTTONS = {
  // Asosiy menyu
  CHANNELS: '📺 Obuna bo\'lish',
  MY_SUBSCRIPTIONS: '📋 Obunalarim',
  PAYMENT: '💰 To\'lov',
  HELP: '📞 Yordam',
  ADMIN_PANEL: '👨‍💼 Admin Panel',

  // Telefon
  SEND_PHONE: '📱 Telefon yuborish',

  // To'lov
  PAY_WITH_PAYME: '💳 Payme orqali to\'lash',
  CHECK_PAYMENT: '✅ To\'lovni tekshirish',
  CANCEL: '❌ Bekor qilish',
  BACK: '⬅️ Orqaga',
  EXTEND_SUBSCRIPTION: '🔄 Obunani uzaytirish',

  // Admin
  ADMIN_STATS: '📊 Statistika',
  ADMIN_CHANNELS: '📺 Kanallar',
  ADMIN_USERS: '👥 Foydalanuvchilar',
  ADMIN_BROADCAST: '📢 E\'lon yuborish',
  ADMIN_ADD_CHANNEL: '➕ Kanal qo\'shish',
  ADMIN_SUBSCRIBERS: '📊 Obunadorlar',
  ADMIN_INTERESTED: '👀 Qiziquvchilar',
  ADMIN_EXPORT_EXCEL: '📥 Excel yuklash',
  ADMIN_BROADCAST_TEXT: '📝 Matn',
  ADMIN_BROADCAST_PHOTO: '📷 Rasm',
  ADMIN_BROADCAST_VIDEO: '🎥 Video',
  CONFIRM: '✅ Tasdiqlash',
  EDIT: '✏️ Tahrirlash',
  DELETE: '🗑️ O\'chirish',
  TOGGLE_ACTIVE: '🔄 Faol/Faol emas',
  SKIP: '⏭️ O\'tkazib yuborish',
};
