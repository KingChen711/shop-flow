import { Injectable, Logger } from '@nestjs/common';
import { ICartRepository } from '@domain/repositories/cart.repository.interface';
import { Cart } from '@domain/entities/cart.entity';
import { RedisService } from './redis.service';

@Injectable()
export class CartRepositoryImpl implements ICartRepository {
  private readonly logger = new Logger(CartRepositoryImpl.name);

  constructor(private readonly redisService: RedisService) {}

  async findByUserId(userId: string): Promise<Cart | null> {
    const cacheKey = this.redisService.getCartCacheKey(userId);
    const data = await this.redisService.get<Record<string, unknown>>(cacheKey);

    if (!data) {
      return null;
    }

    try {
      return Cart.fromJSON(data);
    } catch (error) {
      this.logger.error(`Error deserializing cart for user ${userId}`, error);
      return null;
    }
  }

  async save(cart: Cart): Promise<void> {
    const cacheKey = this.redisService.getCartCacheKey(cart.userId);
    const data = cart.toJSON();

    // Default TTL: 7 days
    const ttl = 7 * 24 * 60 * 60 * 1000;
    await this.redisService.set(cacheKey, data, ttl);
  }

  async delete(userId: string): Promise<boolean> {
    const cacheKey = this.redisService.getCartCacheKey(userId);
    const exists = await this.exists(userId);

    if (exists) {
      await this.redisService.del(cacheKey);
      return true;
    }

    return false;
  }

  async exists(userId: string): Promise<boolean> {
    const cacheKey = this.redisService.getCartCacheKey(userId);
    const data = await this.redisService.get(cacheKey);
    return data !== undefined && data !== null;
  }

  async setExpiration(userId: string, ttlSeconds: number): Promise<void> {
    const cart = await this.findByUserId(userId);
    if (cart) {
      const cacheKey = this.redisService.getCartCacheKey(userId);
      await this.redisService.set(cacheKey, cart.toJSON(), ttlSeconds * 1000);
    }
  }
}
