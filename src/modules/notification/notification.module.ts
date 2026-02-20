import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationScheduler } from './notification.scheduler';
import { SubscriptionModule } from '../subscription/subscription.module';
import { UserModule } from '../user/user.module';
import { RedisModule, RedisService } from '../../redis';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    SubscriptionModule,
    UserModule,
    RedisModule,
  ],
  providers: [NotificationService, NotificationScheduler, RedisService],
  exports: [NotificationService],
})
export class NotificationModule {}
