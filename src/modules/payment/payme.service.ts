import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export interface PaymeCheckPerformResult {
  allow: boolean;
  message?: string;
}

export interface PaymeCreateTransactionResult {
  transaction: string;
  state: number;
  create_time: number;
}

@Injectable()
export class PaymeService {
  private readonly logger = new Logger(PaymeService.name);
  private readonly merchantId: string;
  private readonly cashierId: string;
  private readonly secretKey: string;
  private readonly testSecretKey: string;
  private readonly checkoutUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.merchantId = this.configService.get<string>('PAYME_MERCHANT_ID', '');
  this.cashierId = this.configService.get<string>('PAYME_CASHIER_ID', '');
    this.secretKey = this.configService.get<string>('PAYME_SECRET_KEY', '');
    this.testSecretKey = this.configService.get<string>('PAYME_TEST_SECRET_KEY', '');
    this.checkoutUrl = this.configService.get<string>(
      'PAYME_CHECKOUT_URL',
      'https://checkout.paycom.uz',
    );
  }

  // To'lov havolasi yaratish
  generatePaymentUrl(orderId: string, amount: number): string {
    // Payme uchun summa tiyinlarda (1 so'm = 100 tiyin)
    const amountInTiyin = Math.round(amount * 100);

    // Payme checkout URL formati:
    // https://checkout.paycom.uz/base64(m=CASHIER_ID;ac.charge_id=ORDER_ID;a=AMOUNT)
    // MUHIM: m= da CASHIER_ID (kassa id) bo'lishi kerak
    // MUHIM: ac.charge_id ishlatiladi (Payme kassa sozlamasiga qarab)
    const mValue = this.cashierId || this.merchantId;
    const params = `m=${mValue};ac.charge_id=${orderId};a=${amountInTiyin}`;
    const encodedParams = Buffer.from(params).toString('base64');

    // Log params and generated URL to help debug merchant/id issues
    this.logger.log(`Payme checkout params: ${params}`);
    this.logger.log(`Payme checkout url: ${this.checkoutUrl}/${encodedParams}`);

    return `${this.checkoutUrl}/${encodedParams}`;
  }

  // Buyurtma ID yaratish
  generateOrderId(): string {
    return `PO-${Date.now()}-${uuidv4().substring(0, 8)}`;
  }

  // Basic Auth tekshirish
  validateAuth(authHeader: string | undefined): boolean {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return false;
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [login, password] = credentials.split(':');

    // Test yoki production secret key
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const validKey = isProduction ? this.secretKey : this.testSecretKey || this.secretKey;

    return login === 'Paycom' && password === validKey;
  }

  // JSON-RPC xato javob
  errorResponse(id: number | null, code: number, message: string, data?: string) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message: {
          ru: message,
          uz: message,
          en: message,
        },
        data,
      },
    };
  }

  // JSON-RPC muvaffaqiyatli javob
  successResponse(id: number | null, result: Record<string, unknown>) {
    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  }

  // Payme xato kodlari
  static readonly ERRORS = {
    INVALID_AMOUNT: -31001,
    ORDER_NOT_FOUND: -31050,
    CANT_PERFORM: -31008,
    TRANSACTION_NOT_FOUND: -31003,
    INVALID_STATE: -31008,
    ALREADY_DONE: -31060,
    CANCELLED: -31007,
  };
}
