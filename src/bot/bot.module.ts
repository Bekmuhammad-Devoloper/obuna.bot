import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { BotUpdate } from './bot.update';
import { AdminUpdate } from './admin.update';
import { UserModule } from '../modules/user/user.module';
import { ChannelModule } from '../modules/channel/channel.module';
import { SubscriptionModule } from '../modules/subscription/subscription.module';
import { PaymentModule } from '../modules/payment/payment.module';
import { BroadcastModule } from '../modules/broadcast/broadcast.module';
import { ExcelModule } from '../modules/excel/excel.module';
import { RedisModule, RedisService } from '../redis';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('BOT_TOKEN', ''),
        middlewares: [session()],
        launchOptions: {
          webhook: undefined, // Polling mode
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    ChannelModule,
    SubscriptionModule,
    PaymentModule,
    BroadcastModule,
    ExcelModule,
    RedisModule,
  ],
  providers: [BotUpdate, AdminUpdate, RedisService],
})
export class BotModule {}
