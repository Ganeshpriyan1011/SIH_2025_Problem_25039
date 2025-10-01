import { logger } from '../utils/logger';

class SimpleCacheService {
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  /**
   * Set a value in cache with expiration
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      const expiry = Date.now() + (ttlSeconds * 1000);
      this.cache.set(key, { data: serializedValue, expiry });
      logger.debug(`📦 Cached data for key: ${key} (Memory)`);
      return true;
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
      const cached = this.cache.get(key);
      if (cached && cached.expiry > Date.now()) {
        logger.debug(`📦 Cache hit for key: ${key} (Memory)`);
        return JSON.parse(cached.data) as T;
      } else if (cached) {
        // Expired, remove it
        this.cache.delete(key);
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
      this.cache.delete(key);
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
      const cached = this.cache.get(key);
      return cached ? cached.expiry > Date.now() : false;
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
      this.cache.clear();
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
    type: 'memory';
    keyCount: number;
  }> {
    try {
      // Clean up expired entries
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (value.expiry <= now) {
          this.cache.delete(key);
        }
      }

      return {
        connected: true,
        type: 'memory',
        keyCount: this.cache.size
      };
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
      this.cache.clear();
      logger.info('📦 Memory cache cleared');
    } catch (error) {
      logger.error('Error disconnecting cache:', error);
    }
  }
}

// Export singleton instance
export default new SimpleCacheService();
