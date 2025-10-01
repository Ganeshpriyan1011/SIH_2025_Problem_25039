// Redis is optional - will fall back to in-memory cache if not available
// import Redis from 'ioredis';
import { logger } from '../utils/logger';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

class CacheService {
  private redis: Redis | null = null;
  private isConnected: boolean = false;
  private fallbackCache: Map<string, { data: any; expiry: number }> = new Map();

  constructor() {
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection with fallback to in-memory cache
   */
  private async initializeRedis(): Promise<void> {
    try {
      // Redis configuration from environment variables
      const config: CacheConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'incois:',
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      };

      this.redis = new Redis(config);

      this.redis.on('connect', () => {
        logger.info('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        logger.warn('⚠️ Redis connection error, falling back to in-memory cache:', error.message);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('⚠️ Redis connection closed, using in-memory cache');
        this.isConnected = false;
      });

      // Test connection
      await this.redis.ping();
      
    } catch (error) {
      logger.warn('⚠️ Redis not available, using in-memory cache:', error);
      this.isConnected = false;
    }
  }

  /**
   * Set a value in cache with expiration
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);

      if (this.isConnected && this.redis) {
        await this.redis.setex(key, ttlSeconds, serializedValue);
        logger.debug(`📦 Cached data for key: ${key} (Redis)`);
        return true;
      } else {
        // Fallback to in-memory cache
        const expiry = Date.now() + (ttlSeconds * 1000);
        this.fallbackCache.set(key, { data: serializedValue, expiry });
        logger.debug(`📦 Cached data for key: ${key} (Memory)`);
        return true;
      }
    } catch (error) {
      logger.error('Error setting cache:', error);
      return false;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      let serializedValue: string | null = null;

      if (this.isConnected && this.redis) {
        serializedValue = await this.redis.get(key);
        if (serializedValue) {
          logger.debug(`📦 Cache hit for key: ${key} (Redis)`);
        }
      } else {
        // Fallback to in-memory cache
        const cached = this.fallbackCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          serializedValue = cached.data;
          logger.debug(`📦 Cache hit for key: ${key} (Memory)`);
        } else if (cached) {
          // Expired, remove it
          this.fallbackCache.delete(key);
        }
      }

      if (serializedValue) {
        return JSON.parse(serializedValue) as T;
      }

      logger.debug(`📦 Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error('Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (this.isConnected && this.redis) {
        await this.redis.del(key);
      } else {
        this.fallbackCache.delete(key);
      }
      logger.debug(`🗑️ Deleted cache key: ${key}`);
      return true;
    } catch (error) {
      logger.error('Error deleting from cache:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.isConnected && this.redis) {
        const result = await this.redis.exists(key);
        return result === 1;
      } else {
        const cached = this.fallbackCache.get(key);
        return cached ? cached.expiry > Date.now() : false;
      }
    } catch (error) {
      logger.error('Error checking cache existence:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<boolean> {
    try {
      if (this.isConnected && this.redis) {
        await this.redis.flushdb();
      } else {
        this.fallbackCache.clear();
      }
      logger.info('🧹 Cache cleared');
      return true;
    } catch (error) {
      logger.error('Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    type: 'redis' | 'memory';
    keyCount: number;
    memoryUsage?: string;
  }> {
    try {
      if (this.isConnected && this.redis) {
        const info = await this.redis.info('memory');
        const keyCount = await this.redis.dbsize();
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        
        return {
          connected: true,
          type: 'redis',
          keyCount,
          memoryUsage: memoryMatch ? memoryMatch[1].trim() : 'unknown'
        };
      } else {
        // Clean up expired entries
        const now = Date.now();
        for (const [key, value] of this.fallbackCache.entries()) {
          if (value.expiry <= now) {
            this.fallbackCache.delete(key);
          }
        }

        return {
          connected: false,
          type: 'memory',
          keyCount: this.fallbackCache.size
        };
      }
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return {
        connected: false,
        type: 'memory',
        keyCount: 0
      };
    }
  }

  /**
   * Cache wrapper for functions
   */
  async cached<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, fetch and store
    const result = await fetchFunction();
    await this.set(key, result, ttlSeconds);
    return result;
  }

  /**
   * Cleanup method for graceful shutdown
   */
  async disconnect(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
        logger.info('📦 Redis connection closed');
      }
      this.fallbackCache.clear();
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
    }
  }
}

// Export singleton instance
export default new CacheService();
