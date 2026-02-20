import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { BotModule } from './bot/bot.module';
import { UserModule } from './modules/user/user.module';
import { ChannelModule } from './modules/channel/channel.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { PaymentModule } from './modules/payment/payment.module';
import { NotificationModule } from './modules/notification/notification.module';
import { BroadcastModule } from './modules/broadcast/broadcast.module';
import { ExcelModule } from './modules/excel/excel.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Scheduler
    ScheduleModule.forRoot(),

    // Database
    DatabaseModule,

    // Redis
    RedisModule,

    // Bot
    BotModule,

    // Modules
    UserModule,
    ChannelModule,
    SubscriptionModule,
    PaymentModule,
    NotificationModule,
    BroadcastModule,
    ExcelModule,
  ],
})
export class AppModule {}
