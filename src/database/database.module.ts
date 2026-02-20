import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  Channel,
  Plan,
  Subscription,
  Payment,
  Notification,
  Broadcast,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'puloqimi_bot'),
        entities: [User, Channel, Plan, Subscription, Payment, Notification, Broadcast],
        synchronize: true, // Auto-create tables
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      Channel,
      Plan,
      Subscription,
      Payment,
      Notification,
      Broadcast,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
