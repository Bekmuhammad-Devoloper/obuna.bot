import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1706428800000 implements MigrationInterface {
  name = 'InitialSchema1706428800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.query(`
      CREATE TYPE "user_status_enum" AS ENUM ('registered', 'active', 'expired', 'removed')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "telegram_id" BIGINT UNIQUE NOT NULL,
        "username" VARCHAR(255),
        "full_name" VARCHAR(255) NOT NULL,
        "phone_number" VARCHAR(20) NOT NULL,
        "status" "user_status_enum" DEFAULT 'registered',
        "is_blocked" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Channels table
    await queryRunner.query(`
      CREATE TABLE "channels" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "telegram_channel_id" BIGINT NOT NULL,
        "description" TEXT,
        "price" DECIMAL(10,2) NOT NULL,
        "duration" INTEGER NOT NULL,
        "is_active" BOOLEAN DEFAULT TRUE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Plans table
    await queryRunner.query(`
      CREATE TYPE "plan_duration_enum" AS ENUM ('monthly', 'quarterly', 'yearly')
    `);

    await queryRunner.query(`
      CREATE TABLE "plans" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "channel_id" UUID REFERENCES "channels"("id") ON DELETE CASCADE,
        "name" VARCHAR(255) NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "duration" "plan_duration_enum" DEFAULT 'monthly',
        "duration_days" INTEGER NOT NULL,
        "is_active" BOOLEAN DEFAULT TRUE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Subscriptions table
    await queryRunner.query(`
      CREATE TYPE "subscription_status_enum" AS ENUM ('active', 'expired', 'cancelled', 'removed')
    `);

    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
        "channel_id" UUID REFERENCES "channels"("id") ON DELETE CASCADE,
        "plan_id" UUID REFERENCES "plans"("id") ON DELETE SET NULL,
        "start_date" DATE NOT NULL,
        "end_date" DATE NOT NULL,
        "status" "subscription_status_enum" DEFAULT 'active',
        "invite_link" VARCHAR(500),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Payments table
    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'paid', 'failed', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
        "subscription_id" UUID REFERENCES "subscriptions"("id") ON DELETE SET NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "currency" VARCHAR(3) DEFAULT 'UZS',
        "status" "payment_status_enum" DEFAULT 'pending',
        "payme_transaction_id" VARCHAR(255),
        "payme_order_id" VARCHAR(255),
        "channel_id" UUID,
        "paid_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Notifications table
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM ('EXPIRY_WARNING_1', 'EXPIRY_WARNING_2', 'FINAL_WARNING', 'REMOVAL_NOTICE')
    `);

    await queryRunner.query(`
      CREATE TYPE "notification_status_enum" AS ENUM ('pending', 'sent', 'failed')
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
        "subscription_id" UUID REFERENCES "subscriptions"("id") ON DELETE CASCADE,
        "type" "notification_type_enum" NOT NULL,
        "status" "notification_status_enum" DEFAULT 'pending',
        "message" TEXT,
        "sent_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Broadcasts table
    await queryRunner.query(`
      CREATE TYPE "broadcast_type_enum" AS ENUM ('text', 'photo', 'video')
    `);

    await queryRunner.query(`
      CREATE TYPE "broadcast_status_enum" AS ENUM ('pending', 'sending', 'completed', 'failed')
    `);

    await queryRunner.query(`
      CREATE TABLE "broadcasts" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" "broadcast_type_enum" NOT NULL,
        "content" TEXT,
        "media_url" VARCHAR(500),
        "media_file_id" VARCHAR(255),
        "status" "broadcast_status_enum" DEFAULT 'pending',
        "total_users" INTEGER DEFAULT 0,
        "sent_count" INTEGER DEFAULT 0,
        "failed_count" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "completed_at" TIMESTAMP
      )
    `);

    // Indexes
    await queryRunner.query(`
      CREATE INDEX "idx_users_telegram_id" ON "users"("telegram_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions"("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_subscriptions_end_date" ON "subscriptions"("end_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_subscriptions_status" ON "subscriptions"("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_payments_user_id" ON "payments"("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_payments_payme_order_id" ON "payments"("payme_order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user_id" ON "notifications"("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_payments_payme_order_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_payments_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_subscriptions_end_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_subscriptions_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_telegram_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "broadcasts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plans"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "channels"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "broadcast_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "broadcast_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "subscription_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "plan_duration_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status_enum"`);
  }
}
