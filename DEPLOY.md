# 🚀 VPS'ga Deploy qilish yo'riqnomasi

## 📋 Talablar

- Ubuntu 20.04+ yoki Linux VPS
- Docker va Docker Compose
- Git
- SSH kirish

## 🔧 VPS'ni tayyorlash

### 1. Sistema yangilanishlarini o'rnatish

```bash
apt update && apt upgrade -y
```

### 2. Docker o'rnatish

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker
```

### 3. Docker Compose o'rnatish

```bash
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

### 4. Repository'ni clone qilish

```bash
cd /root
git clone https://github.com/Bekmuhammad-Devoloper/obuna.bot.git
cd obuna.bot
```

### 5. Environment faylini sozlash

```bash
cp .env.production .env
nano .env
```

**O'zgartirish kerak bo'lgan qiymatlar:**

- `BOT_TOKEN` - BotFather'dan olingan Telegram bot tokeni
- `ADMIN_IDS` - Admin Telegram ID'lari
- `DB_PASSWORD` - Kuchli PostgreSQL paroli
- `REDIS_PASSWORD` - Kuchli Redis paroli
- `ADMIN_API_TOKEN` - Kuchli admin API tokeni
- `APP_URL` - VPS IP manzili yoki domen

### 6. Deploy script'ni bajarish

```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔄 GitHub Actions CI/CD sozlash

### 1. SSH Key yaratish

VPS'da:

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions"
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/id_rsa  # Bu private key - GitHub'ga qo'shiladi
```

### 2. GitHub Secrets sozlash

GitHub repository'da: Settings → Secrets and variables → Actions → New repository secret

Quyidagi secretlarni qo'shing:

- `VPS_HOST`: VPS IP manzili (masalan: `31.97.216.47`)
- `VPS_USERNAME`: SSH foydalanuvchi nomi (odatda: `root`)
- `VPS_SSH_KEY`: SSH private key (yuqorida yaratilgan)
- `VPS_PORT`: SSH port (odatda: `22`)

### 3. Environment Variables qo'shish (ixtiyoriy)

GitHub Secrets'ga production environment variableslarni ham qo'shishingiz mumkin:

- `BOT_TOKEN`
- `DB_PASSWORD`
- `REDIS_PASSWORD`
- `ADMIN_API_TOKEN`

## 📊 Monitoring va Management

### Container statusini ko'rish

```bash
cd /root/obuna.bot
docker compose -f docker-compose.prod.yml ps
```

### Loglarni ko'rish

```bash
# Barcha loglar
docker compose -f docker-compose.prod.yml logs -f

# Faqat bot loglari
docker compose -f docker-compose.prod.yml logs -f bot

# Oxirgi 100 ta log
docker compose -f docker-compose.prod.yml logs --tail=100 bot
```

### Containerlarni qayta ishga tushirish

```bash
docker compose -f docker-compose.prod.yml restart
```

### Containerlarni to'xtatish

```bash
docker compose -f docker-compose.prod.yml down
```

### Database backup olish

```bash
docker exec obuna-postgres pg_dump -U obuna_user obuna_bot_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database restore qilish

```bash
docker exec -i obuna-postgres psql -U obuna_user obuna_bot_db < backup.sql
```

## 🔥 Firewall sozlash (Ixtiyoriy)

```bash
# UFW o'rnatish
apt install ufw -y

# Asosiy portlarni ochish
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Bot API

# Firewall yoqish
ufw enable
```

## 🔐 Security Best Practices

1. **Root foydalanuvchisidan foydalanmang** - yangi foydalanuvchi yarating
2. **SSH port'ni o'zgartiring** - default 22 portdan boshqa portga o'zgartiring
3. **SSH Password authentication'ni o'chiring** - faqat SSH key ishlatish
4. **Fail2ban o'rnating** - brute force hujumlardan himoya
5. **Kuchli parollar ishlatish** - barcha servislar uchun
6. **Regular backup oling** - ma'lumotlar bazasini har kuni

## 📱 Automatic Updates (CI/CD)

GitHub'ga push qilganingizda avtomatik deploy bo'ladi:

```bash
git add .
git commit -m "feat: yangi funksiya qo'shildi"
git push origin main
```

GitHub Actions avtomatik ravishda:
1. VPS'ga ulanadi
2. Yangi kodni pull qiladi
3. Docker image'larni rebuild qiladi
4. Containerlarni qayta ishga tushiradi

## 🆘 Troubleshooting

### Bot ishlamayapti

```bash
# Loglarni tekshirish
docker compose -f docker-compose.prod.yml logs bot

# Containerlarni qayta ishga tushirish
docker compose -f docker-compose.prod.yml restart bot
```

### Database'ga ulanolmayapti

```bash
# PostgreSQL statusini tekshirish
docker compose -f docker-compose.prod.yml exec postgres pg_isready

# Database loglarini ko'rish
docker compose -f docker-compose.prod.yml logs postgres
```

### Redis ishlamayapti

```bash
# Redis statusini tekshirish
docker compose -f docker-compose.prod.yml exec redis redis-cli ping

# Redis loglarini ko'rish
docker compose -f docker-compose.prod.yml logs redis
```

## 📞 Yordam

Muammolar yuzaga kelsa:
- Issue oching: https://github.com/Bekmuhammad-Devoloper/obuna.bot/issues
- Telegram: @BekmuhammadDev

---

**Muallif:** Bekmuhammad
**Litsenziya:** MIT
