import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { PaymeService } from './payme.service';
import { PaymentService } from './payment.service';
import { PaymentStatus } from '../../database/entities/payment.entity';

interface PaymeRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: Record<string, unknown>;
}

@Controller('payme')
export class PaymeController {
  private readonly logger = new Logger(PaymeController.name);

  constructor(
    private readonly paymeService: PaymeService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post()
  @HttpCode(200)
  async handlePayme(
    @Body() body: PaymeRequest,
    @Headers('authorization') authHeader: string,
  ) {
    const { id, method, params } = body;

    // Auth tekshirish
    if (!this.paymeService.validateAuth(authHeader)) {
      return this.paymeService.errorResponse(id, -32504, 'Unauthorized');
    }

    this.logger.log(`Payme request: ${method}`, params);

    try {
      switch (method) {
        case 'CheckPerformTransaction':
          return this.checkPerformTransaction(id, params);

        case 'CreateTransaction':
        return this.createTransaction(id, params);

        case 'PerformTransaction':
          return this.performTransaction(id, params);

        case 'CancelTransaction':
          return this.cancelTransaction(id, params);

        case 'CheckTransaction':
          return this.checkTransaction(id, params);

        default:
          return this.paymeService.errorResponse(id, -32601, 'Method not found');
      }
    } catch (error) {
      this.logger.error(`Payme error: ${error}`);
      return this.paymeService.errorResponse(id, -32400, 'Internal error');
    }
  }

  // To'lov amalga oshirish mumkinligini tekshirish
  private async checkPerformTransaction(id: number, params: Record<string, unknown>) {
    const account = params.account as Record<string, string>;
    // Payme kassa sozlamasiga qarab charge_id yoki order_id kelishi mumkin
    const orderId = account?.charge_id || account?.order_id;
    const amount = params.amount as number;

    if (!orderId) {
      return this.paymeService.errorResponse(
        id,
        PaymeService.ERRORS.ORDER_NOT_FOUND,
        'Order ID (charge_id) not found',
      );
    }

    const payment = await this.paymentService.findByPaymeOrderId(orderId);

    if (!payment) {
      return this.paymeService.errorResponse(
        id,
        PaymeService.ERRORS.ORDER_NOT_FOUND,
        'Order not found',
      );
    }

    // Summa tekshirish (tiyinlarda)
    const expectedAmount = Math.round(Number(payment.amount) * 100);
    if (amount !== expectedAmount) {
      return this.paymeService.errorResponse(
        id,
        PaymeService.ERRORS.INVALID_AMOUNT,
        'Invalid amount',
      );
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return this.paymeService.errorResponse(
        id,
        PaymeService.ERRORS.CANT_PERFORM,
        'Order already processed',
      );
    }

    return this.paymeService.successResponse(id, { allow: true });
  }

  // Tranzaksiya yaratish
  private async createTransaction(id: number, params: Record<string, unknown>) {
    const account = params.account as Record<string, string>;
    // Payme kassa sozlamasiga qarab charge_id yoki order_id kelishi mumkin
    const orderId = account?.charge_id || account?.order_id;
    const paymeTransactionId = params.id as string;
    const amount = params.amount as number;
    const time = params.time as number;

    const payment = await this.paymentService.findByPaymeOrderId(orderId);

    if (!payment) {
      return this.paymeService.errorResponse(
        id,
        PaymeService.ERRORS.ORDER_NOT_FOUND,
        'Order not found',
      );
    }

    // Agar allaqachon tranzaksiya yaratilgan bo'lsa
    if (payment.paymeTransactionId) {
      if (payment.paymeTransactionId !== paymeTransactionId) {
        return this.paymeService.errorResponse(
          id,
          PaymeService.ERRORS.CANT_PERFORM,
          'Different transaction exists',
        );
      }
    } else {
      await this.paymentService.setPaymeTransactionId(payment.id, paymeTransactionId);
      this.logger.log(
        `Mapped order ${orderId} -> payment.id=${payment.id} -> paymeTransactionId=${paymeTransactionId}`,
      );
    }

    return this.paymeService.successResponse(id, {
      transaction: payment.id,
      state: 1, // Yaratildi
      create_time: time,
    });
  }

  // To'lovni amalga oshirish
  private async performTransaction(id: number, params: Record<string, unknown>) {
    const paymeTransactionId = params.id as string;
    const time = params.time as number;

    const payment = await this.paymentService.findByPaymeTransactionId(paymeTransactionId);

    this.logger.log(`PerformTransaction called for paymeTransactionId=${paymeTransactionId}`);

    if (!payment) {
      return this.paymeService.errorResponse(
        id,
        PaymeService.ERRORS.TRANSACTION_NOT_FOUND,
        'Transaction not found',
      );
    }

    if (payment.status === PaymentStatus.PAID) {
      return this.paymeService.successResponse(id, {
        transaction: payment.id,
        state: 2, // Bajarildi
        perform_time: payment.paidAt?.getTime() || Date.now(),
      });
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return this.paymeService.errorResponse(
        id,
        PaymeService.ERRORS.CANT_PERFORM,
        'Cannot perform this transaction',
      );
    }

    // To'lovni tasdiqlash
    await this.paymentService.updateStatus(payment.id, PaymentStatus.PAID);

    return this.paymeService.successResponse(id, {
      transaction: payment.id,
      state: 2, // Bajarildi
      perform_time: Date.now(),
    });
  }

  // Tranzaksiyani bekor qilish
  private async cancelTransaction(id: number, params: Record<string, unknown>) {
    const paymeTransactionId = params.id as string;
    const reason = params.reason as number;

    const payment = await this.paymentService.findByPaymeTransactionId(paymeTransactionId);

    if (!payment) {
      return this.paymeService.errorResponse(
        id,
        PaymeService.ERRORS.TRANSACTION_NOT_FOUND,
        'Transaction not found',
      );
    }

    // Agar allaqachon to'langan bo'lsa, bekor qilish mumkin emas
    if (payment.status === PaymentStatus.PAID) {
      return this.paymeService.errorResponse(
        id,
        PaymeService.ERRORS.CANT_PERFORM,
        'Cannot cancel paid transaction',
      );
    }

    await this.paymentService.updateStatus(payment.id, PaymentStatus.CANCELLED);

    return this.paymeService.successResponse(id, {
      transaction: payment.id,
      state: -1, // Bekor qilindi
      cancel_time: Date.now(),
    });
  }

  // Tranzaksiya holatini tekshirish
  private async checkTransaction(id: number, params: Record<string, unknown>) {
    const paymeTransactionId = params.id as string;

    const payment = await this.paymentService.findByPaymeTransactionId(paymeTransactionId);

    this.logger.log(`CheckTransaction for paymeTransactionId=${paymeTransactionId}, mapped payment.id=${payment?.id}`);

    if (!payment) {
      return this.paymeService.errorResponse(
        id,
        PaymeService.ERRORS.TRANSACTION_NOT_FOUND,
        'Transaction not found',
      );
    }

    let state = 1;
    if (payment.status === PaymentStatus.PAID) {
      state = 2;
    } else if (
      payment.status === PaymentStatus.CANCELLED ||
      payment.status === PaymentStatus.FAILED
    ) {
      state = -1;
    }

    return this.paymeService.successResponse(id, {
      transaction: payment.id,
      state,
      create_time: payment.createdAt.getTime(),
      perform_time: payment.paidAt?.getTime() || 0,
      cancel_time: state === -1 ? payment.updatedAt.getTime() : 0,
    });
  }
}
