import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Payment } from '../../database/entities/payment.entity';
import { PaymentService } from './payment.service';
import { PaymeService } from './payme.service';
import { PaymeController } from './payme.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), ConfigModule],
  controllers: [PaymeController],
  providers: [PaymentService, PaymeService],
  exports: [PaymentService, PaymeService],
})
export class PaymentModule {}
