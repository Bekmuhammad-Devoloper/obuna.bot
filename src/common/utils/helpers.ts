export class ValidationUtils {
  // Telefon raqam tekshirish (+998XXXXXXXXX)
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+998[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Telefon raqamni formatlash
  static formatPhone(phone: string): string {
    const cleaned = phone.replace(/\s/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('998')) {
        return '+' + cleaned;
      }
      return '+998' + cleaned;
    }
    return cleaned;
  }

  // Ism tekshirish (minimum 3 belgi)
  static isValidName(name: string): boolean {
    return name.trim().length >= 3;
  }

  // Raqam tekshirish
  static isValidNumber(value: string): boolean {
    return /^\d+$/.test(value.trim());
  }

  // Telegram kanal ID tekshirish
  static isValidChannelId(id: string): boolean {
    return /^-100\d+$/.test(id.trim());
  }
}

export class DateUtils {
  // Bugungi sana
  static today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // Kun qo'shish
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Ikki sana orasidagi kunlar soni
  static daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.round((d2.getTime() - d1.getTime()) / oneDay);
  }

  // Sanani formatlash (DD.MM.YYYY)
  static format(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // Sana va vaqtni formatlash (DD.MM.YYYY HH:mm)
  static formatDateTime(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  // Oy boshlanishi
  static startOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  // Oy oxiri
  static endOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }
}

export class FormatUtils {
  // Pul miqdorini formatlash
  static formatMoney(amount: number): string {
    return amount.toLocaleString('uz-UZ');
  }

  // Xabar shablonini to'ldirish
  static template(message: string, params: Record<string, string | number>): string {
    let result = message;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
    return result;
  }
}
