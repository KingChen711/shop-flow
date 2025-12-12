import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import Redlock, { Lock, ResourceLockedError } from 'redlock';
import Redis from 'ioredis';

const DEFAULT_LOCK_DURATION = 10000; // 10 seconds
const RETRY_COUNT = 20;
const RETRY_DELAY = 200; // 200ms

@Injectable()
export class DistributedLockService implements OnModuleInit {
  private readonly logger = new Logger(DistributedLockService.name);
  private redlock: Redlock;

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  onModuleInit() {
    this.redlock = new Redlock([this.redis], {
      driftFactor: 0.01, // multiplied by lock ttl to determine drift time
      retryCount: RETRY_COUNT,
      retryDelay: RETRY_DELAY,
      retryJitter: 200, // the max time in ms randomly added to retries
      automaticExtensionThreshold: 500, // time in ms
    });

    this.redlock.on('error', (error) => {
      // Ignore cases where a resource is already locked
      if (error instanceof ResourceLockedError) {
        return;
      }
      this.logger.error('Redlock error:', error);
    });

    this.logger.log('Distributed lock service initialized');
  }

  /**
   * Acquire a lock for a single resource and execute the callback
   */
  async withLock<T>(
    resource: string,
    callback: () => Promise<T>,
    duration: number = DEFAULT_LOCK_DURATION
  ): Promise<T> {
    const lockKey = `lock:${resource}`;
    let lock: Lock | null = null;

    try {
      lock = await this.redlock.acquire([lockKey], duration);
      this.logger.debug(`Lock acquired for ${resource}`);

      const result = await callback();

      return result;
    } catch (error) {
      if (error instanceof ResourceLockedError) {
        this.logger.warn(`Resource locked: ${resource}`);
        throw new Error(`Resource is currently locked: ${resource}. Please try again.`);
      }
      throw error;
    } finally {
      if (lock) {
        try {
          await lock.release();
          this.logger.debug(`Lock released for ${resource}`);
        } catch (error) {
          this.logger.warn(`Failed to release lock for ${resource}:`, error);
        }
      }
    }
  }

  /**
   * Acquire locks for multiple resources and execute the callback
   * Resources are locked in sorted order to prevent deadlocks
   */
  async withMultipleLocks<T>(
    resources: string[],
    callback: () => Promise<T>,
    duration: number = DEFAULT_LOCK_DURATION
  ): Promise<T> {
    // Sort resources to prevent deadlocks
    const sortedResources = [...resources].sort();
    const lockKeys = sortedResources.map((r) => `lock:${r}`);
    let lock: Lock | null = null;

    try {
      lock = await this.redlock.acquire(lockKeys, duration);
      this.logger.debug(`Locks acquired for ${sortedResources.length} resources`);

      const result = await callback();

      return result;
    } catch (error) {
      if (error instanceof ResourceLockedError) {
        this.logger.warn(`One or more resources are locked`);
        throw new Error('One or more resources are currently locked. Please try again.');
      }
      throw error;
    } finally {
      if (lock) {
        try {
          await lock.release();
          this.logger.debug(`Locks released for ${sortedResources.length} resources`);
        } catch (error) {
          this.logger.warn(`Failed to release locks:`, error);
        }
      }
    }
  }

  /**
   * Try to acquire a lock without waiting
   */
  async tryLock(resource: string, duration: number = DEFAULT_LOCK_DURATION): Promise<Lock | null> {
    const lockKey = `lock:${resource}`;

    try {
      const lock = await this.redlock.acquire([lockKey], duration, {
        retryCount: 0, // Don't retry
      });
      this.logger.debug(`Lock acquired for ${resource}`);
      return lock;
    } catch (error) {
      if (error instanceof ResourceLockedError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Extend an existing lock
   */
  async extendLock(lock: Lock, duration: number = DEFAULT_LOCK_DURATION): Promise<Lock> {
    return lock.extend(duration);
  }
}
