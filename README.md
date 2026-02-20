# PulOqimi Bot 🤖💰

**Telegram Obuna Boshqaruv Tizimi** - Pullik kanallarga obuna bo'lish va to'lovlarni boshqarish uchun to'liq yechim.

## 📋 Xususiyatlar

### Foydalanuvchi uchun:
- ✅ Ro'yxatdan o'tish (ism, telefon)
- ✅ Kanallar ro'yxatini ko'rish
- ✅ Payme orqali to'lov qilish
- ✅ Avtomatik kanalga qo'shilish (invite link)
- ✅ Obunalarni ko'rish va boshqarish

### Admin uchun:
- ✅ Statistika dashboard
- ✅ Kanal qo'shish/tahrirlash/o'chirish
- ✅ Foydalanuvchilar ro'yxati
- ✅ Excel export (obunadorlar, qiziquvchilar)
- ✅ E'lon yuborish (matn, rasm, video)

### Avtomatik tizimlar:
- ✅ Kunlik bildirishnomalar (09:00)
- ✅ Obuna tugash eslatmalari
- ✅ Avtomatik kanaldan chiqarish

## 🛠 Texnologiyalar

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **Database:** PostgreSQL 14+
- **Cache:** Redis 7+
- **ORM:** TypeORM
- **Bot:** Telegraf 4+ (nestjs-telegraf)
- **To'lov:** Payme Merchant API
- **Scheduler:** @nestjs/schedule

## 🚀 O'rnatish

### 1. Repozitoriyani klonlash

```bash
git clone https://github.com/Bekmuhammad-Devoloper/money.bot.git
cd money.bot
```

### 2. Dependencies o'rnatish

```bash
npm install
```

### 3. Environment sozlash

```bash
cp .env.example .env
```

`.env` faylini to'ldiring:

```env
# Telegram Bot
BOT_TOKEN=your_bot_token_from_botfather
ADMIN_IDS=123456789,987654321

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=puloqimi_bot

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Payme
PAYME_MERCHANT_ID=your_merchant_id
PAYME_SECRET_KEY=your_secret_key
PAYME_TEST_SECRET_KEY=your_test_key
PAYME_CHECKOUT_URL=https://checkout.paycom.uz

# App
APP_PORT=3000
APP_URL=https://your-domain.com
NODE_ENV=development
TZ=Asia/Tashkent
```

### 4. Database yaratish

```bash
# PostgreSQL'da database yaratish
createdb puloqimi_bot

# Yoki Docker orqali
docker-compose up -d postgres
```

### 5. Migration ishga tushirish

```bash
npm run migration:run
```

### 6. Botni ishga tushirish

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 🐳 Docker bilan ishga tushirish

```bash
# Barcha servislarni ishga tushirish
docker-compose up -d

# Loglarni ko'rish
docker-compose logs -f bot
```

## 📱 PM2 bilan ishga tushirish

```bash
# Build
npm run build

# PM2 bilan ishga tushirish
pm2 start ecosystem.config.js --env production

# Status
pm2 status

# Loglar
pm2 logs puloqimi-bot

# Restart
pm2 restart puloqimi-bot
```

## 📊 Ma'lumotlar bazasi

### Jadvallar:
- `users` - Foydalanuvchilar
- `channels` - Kanallar
- `plans` - Tariflar
- `subscriptions` - Obunalar
- `payments` - To'lovlar
- `notifications` - Bildirishnomalar
- `broadcasts` - E'lonlar

### Migration

```bash
# Yangi migration yaratish
npm run migration:generate -- src/database/migrations/NewMigration

# Migrationlarni ishga tushirish
npm run migration:run

# Oxirgi migrationni bekor qilish
npm run migration:revert
```

## 🔔 Bildirishnomalar jadvali

| Kun | Trigger | Xabar turi |
|-----|---------|------------|
| 29 | 1 kun qoldi | ⚠️ Eslatma |
| 30 | Bugun tugaydi | ⚠️ Diqqat |
| 31 | 1 kun o'tdi | 🚨 Oxirgi ogohlantirish |
| 32 | 2 kun o'tdi | ❌ Kanaldan chiqarish |

## 💳 Payme integratsiyasi

### Webhook URL
```
POST https://your-domain.com/payme
```

### Sozlash
1. Payme kabinetiga kiring
2. Merchant yarating
3. Webhook URL ni qo'shing
4. Secret key'larni `.env` ga qo'shing

## 📁 Loyiha strukturasi

```
src/
├── bot/                    # Telegram bot
│   ├── bot.module.ts
│   ├── bot.update.ts       # Asosiy handler'lar
│   └── admin.update.ts     # Admin handler'lar
├── common/
│   ├── constants/          # Xabarlar, tugmalar
│   ├── types/              # TypeScript types
│   └── utils/              # Yordamchi funksiyalar
├── database/
│   ├── entities/           # TypeORM entities
│   ├── migrations/         # Database migrations
│   ├── database.module.ts
│   └── data-source.ts
├── modules/
│   ├── user/               # Foydalanuvchi moduli
│   ├── channel/            # Kanal moduli
│   ├── subscription/       # Obuna moduli
│   ├── payment/            # To'lov moduli (Payme)
│   ├── notification/       # Bildirishnoma moduli
│   ├── broadcast/          # E'lon moduli
│   └── excel/              # Excel export moduli
├── redis/                  # Redis moduli
├── app.module.ts           # Asosiy modul
└── main.ts                 # Entry point
```

## 🧪 Test

```bash
# Unit tests
npm run test

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## 📞 Yordam

- **Developer:** Bekmuhammad
- **GitHub:** [Bekmuhammad-Devoloper/money.bot](https://github.com/Bekmuhammad-Devoloper/money.bot)
- **Telegram:** @puloqimibot

## 📄 Litsenziya

MIT License

---

**Versiya:** 1.0.0  
**Sana:** 28.01.2026
