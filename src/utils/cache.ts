import NodeCache from 'node-cache';
import type { CacheEntry } from '../types/index.js';
import { config } from '../config/index.js';
import { logger } from './logger.js';

export class Cache {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: config.cache.ttl,
      checkperiod: 60, // Check for expired keys every minute
      useClones: false,
    });

    // Log cache events in development
    if (config.env === 'development') {
      this.cache.on('expired', (key) => {
        logger.debug('Cache key expired', { key });
      });

      this.cache.on('flush', () => {
        logger.debug('Cache flushed');
      });
    }
  }

  get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (value === undefined) {
      logger.debug('Cache miss', { key });
    } else {
      logger.debug('Cache hit', { key });
    }
    return value;
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    const finalTtl = ttl || config.cache.ttl;
    const success = this.cache.set(key, value, finalTtl);
    if (success) {
      logger.debug('Cache set', { key, ttl: finalTtl });
    }
    return success;
  }

  delete(key: string): number {
    const deleted = this.cache.del(key);
    if (deleted > 0) {
      logger.debug('Cache deleted', { key });
    }
    return deleted;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  flush(): void {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  getStats() {
    return this.cache.getStats();
  }

  // Helper method for storing embeddings with metadata
  setEmbedding(key: string, embedding: number[], ttl?: number): void {
    const finalTtl = ttl || config.cache.ttl;
    const cacheEntry: CacheEntry<number[]> = {
      data: embedding,
      timestamp: Date.now(),
      ttl: finalTtl,
    };
    
    this.cache.set(key, cacheEntry, finalTtl);
    logger.debug('Cached embedding', { key, ttl: finalTtl });
  }

  setDocument(key: string, document: { embedding: number[]; metadata?: Record<string, unknown> }, ttl?: number): void {
    const finalTtl = ttl || config.cache.ttl;
    const cacheEntry: CacheEntry<{ embedding: number[]; metadata?: Record<string, unknown> }> = {
      data: document,
      timestamp: Date.now(),
      ttl: finalTtl,
    };
    
    this.cache.set(key, cacheEntry, finalTtl);
    logger.debug('Cached document', { key, ttl: finalTtl });
  }

  getEmbedding(key: string): number[] | undefined {
    const entry = this.get<CacheEntry<number[]>>(key);
    return entry?.data;
  }
}

export const cache = new Cache(); 