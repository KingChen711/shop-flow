import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.cache.get<T>(key);
    return value ?? null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.cache.set(key, value, ttlSeconds * 1000);
    } else {
      await this.cache.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }

  getInventoryCacheKey(productId: string): string {
    return `inventory:${productId}`;
  }
}
