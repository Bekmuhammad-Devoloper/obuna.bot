import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.module';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const json = JSON.stringify(value);
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, json);
    } else {
      await this.redis.set(key, json);
    }
  }

  // Distributed lock uchun
  async acquireLock(key: string, ttlSeconds: number = 300): Promise<boolean> {
    const result = await this.redis.set(
      `lock:${key}`,
      '1',
      'EX',
      ttlSeconds,
      'NX',
    );
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.redis.del(`lock:${key}`);
  }

  // Rate limiting uchun
  async checkRateLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const current = await this.redis.incr(`ratelimit:${key}`);
    if (current === 1) {
      await this.redis.expire(`ratelimit:${key}`, windowSeconds);
    }
    return current <= maxRequests;
  }

  // Session uchun
  async getSession<T>(telegramId: string): Promise<T | null> {
    return this.getJson<T>(`session:${telegramId}`);
  }

  async setSession<T>(
    telegramId: string,
    data: T,
    ttlSeconds: number = 3600,
  ): Promise<void> {
    await this.setJson(`session:${telegramId}`, data, ttlSeconds);
  }

  async deleteSession(telegramId: string): Promise<void> {
    await this.del(`session:${telegramId}`);
  }
}
