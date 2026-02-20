import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment, PaymentStatus } from '../../database/entities/payment.entity';
import { DateUtils } from '../../common/utils/helpers';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async findById(id: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { id },
      relations: ['user', 'subscription'],
    });
  }

  async findByPaymeOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { paymeOrderId: orderId },
      relations: ['user', 'subscription'],
    });
  }

  async findByPaymeTransactionId(transactionId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { paymeTransactionId: transactionId },
    });
  }

  async findPendingByUser(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId, status: PaymentStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: {
    userId: string;
    amount: number;
    channelId: string;
    paymeOrderId: string;
  }): Promise<Payment> {
    const payment = this.paymentRepository.create({
      ...data,
      status: PaymentStatus.PENDING,
      currency: 'UZS',
    });

    return this.paymentRepository.save(payment);
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<void> {
    const updateData: Partial<Payment> = { status };
    if (status === PaymentStatus.PAID) {
      updateData.paidAt = new Date();
    }
    await this.paymentRepository.update(id, updateData);
  }

  async setPaymeTransactionId(id: string, transactionId: string): Promise<void> {
    await this.paymentRepository.update(id, { paymeTransactionId: transactionId });
  }

  async setSubscriptionId(id: string, subscriptionId: string): Promise<void> {
    await this.paymentRepository.update(id, { subscriptionId });
  }

  // Bugungi daromad
  async getTodayRevenue(): Promise<number> {
    const today = DateUtils.today();
    const tomorrow = DateUtils.addDays(today, 1);

    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.PAID })
      .andWhere('payment.paidAt >= :start', { start: today })
      .andWhere('payment.paidAt < :end', { end: tomorrow })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  // Oylik daromad
  async getMonthlyRevenue(): Promise<number> {
    const startOfMonth = DateUtils.startOfMonth();
    const endOfMonth = DateUtils.addDays(DateUtils.endOfMonth(), 1);

    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.PAID })
      .andWhere('payment.paidAt >= :start', { start: startOfMonth })
      .andWhere('payment.paidAt < :end', { end: endOfMonth })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  // To'lov muddat o'tganlarni bekor qilish (1 soatdan keyin)
  async cancelExpiredPayments(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await this.paymentRepository
      .createQueryBuilder()
      .update(Payment)
      .set({ status: PaymentStatus.CANCELLED })
      .where('status = :status', { status: PaymentStatus.PENDING })
      .andWhere('createdAt < :time', { time: oneHourAgo })
      .execute();

    return result.affected || 0;
  }
}
