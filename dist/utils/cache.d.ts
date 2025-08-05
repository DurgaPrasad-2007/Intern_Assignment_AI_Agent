import NodeCache from 'node-cache';
export declare class Cache {
    private cache;
    constructor();
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T, ttl?: number): boolean;
    delete(key: string): number;
    has(key: string): boolean;
    flush(): void;
    getStats(): NodeCache.Stats;
    setEmbedding(key: string, embedding: number[], ttl?: number): void;
    setDocument(key: string, document: {
        embedding: number[];
        metadata?: Record<string, unknown>;
    }, ttl?: number): void;
    getEmbedding(key: string): number[] | undefined;
}
export declare const cache: Cache;
//# sourceMappingURL=cache.d.ts.map