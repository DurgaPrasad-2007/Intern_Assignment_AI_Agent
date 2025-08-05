import NodeCache from 'node-cache';
import { config } from '../config/index.js';
import { logger } from './logger.js';
export class Cache {
    cache;
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
    get(key) {
        const value = this.cache.get(key);
        if (value === undefined) {
            logger.debug('Cache miss', { key });
        }
        else {
            logger.debug('Cache hit', { key });
        }
        return value;
    }
    set(key, value, ttl) {
        const finalTtl = ttl || config.cache.ttl;
        const success = this.cache.set(key, value, finalTtl);
        if (success) {
            logger.debug('Cache set', { key, ttl: finalTtl });
        }
        return success;
    }
    delete(key) {
        const deleted = this.cache.del(key);
        if (deleted > 0) {
            logger.debug('Cache deleted', { key });
        }
        return deleted;
    }
    has(key) {
        return this.cache.has(key);
    }
    flush() {
        this.cache.flushAll();
        logger.info('Cache flushed');
    }
    getStats() {
        return this.cache.getStats();
    }
    // Helper method for storing embeddings with metadata
    setEmbedding(key, embedding, ttl) {
        const finalTtl = ttl || config.cache.ttl;
        const cacheEntry = {
            data: embedding,
            timestamp: Date.now(),
            ttl: finalTtl,
        };
        this.cache.set(key, cacheEntry, finalTtl);
        logger.debug('Cached embedding', { key, ttl: finalTtl });
    }
    setDocument(key, document, ttl) {
        const finalTtl = ttl || config.cache.ttl;
        const cacheEntry = {
            data: document,
            timestamp: Date.now(),
            ttl: finalTtl,
        };
        this.cache.set(key, cacheEntry, finalTtl);
        logger.debug('Cached document', { key, ttl: finalTtl });
    }
    getEmbedding(key) {
        const entry = this.get(key);
        return entry?.data;
    }
}
export const cache = new Cache();
//# sourceMappingURL=cache.js.map