import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import {
  User,
  Channel,
  Plan,
  Subscription,
  Payment,
  Notification,
  Broadcast,
} from './entities';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'puloqimi_bot',
  entities: [User, Channel, Plan, Subscription, Payment, Notification, Broadcast],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
