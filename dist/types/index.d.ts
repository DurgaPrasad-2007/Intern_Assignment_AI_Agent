export interface ChatCompletionMessageParam {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string | null;
    name?: string;
    function_call?: {
        name: string;
        arguments: string;
    };
}
export interface MessageRequest {
    message: string;
    session_id: string;
}
export interface MessageResponse {
    reply: string;
    session_id: string;
    timestamp: string;
}
export interface ErrorResponse {
    error: string;
    code: string;
    timestamp: string;
}
export interface ChatMessage extends ChatCompletionMessageParam {
    timestamp?: string;
}
export interface MemorySession {
    messages: ChatMessage[];
    lastAccessed: Date;
}
export interface Document {
    id: string;
    text: string;
    metadata?: Record<string, unknown>;
}
export interface DocumentVector {
    id: string;
    text: string;
    embedding: number[];
    metadata?: Record<string, unknown>;
}
export interface SearchResult {
    id: string;
    text: string;
    score: number;
    metadata?: Record<string, unknown>;
}
export interface PluginResult {
    name: string;
    result: string;
    success: boolean;
    metadata?: Record<string, unknown>;
}
export interface Plugin {
    name: string;
    description: string;
    run: (input: string) => Promise<PluginResult | null>;
}
export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}
export interface ValidationError {
    field: string;
    message: string;
    value?: unknown;
}
export interface HealthStatus {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    services: {
        openai: boolean;
        memory: boolean;
        rag: boolean;
        plugins: boolean;
    };
    metrics?: {
        totalRequests: number;
        averageResponseTime: number;
        errorRate: number;
        memoryUsage: number;
    };
}
export interface ChunkMetadata {
    chunkIndex: number;
    totalChunks: number;
    wordCount: number;
    language?: string;
    contentType: 'text' | 'code' | 'table' | 'list';
    headings?: string[];
}
export interface EnhancedDocument extends Document {
    chunks?: DocumentChunk[];
    summary?: string;
    keywords?: string[];
    createdAt: string;
    updatedAt: string;
}
export interface DocumentChunk {
    id: string;
    parentDocumentId: string;
    text: string;
    embedding?: number[];
    metadata: ChunkMetadata;
    score?: number;
}
export interface PluginExecutionContext {
    sessionId: string;
    timestamp: string;
    userInput: string;
    conversationHistory: ChatMessage[];
}
export interface EnhancedPluginResult extends PluginResult {
    executionTime: number;
    cacheHit?: boolean;
    confidence?: number;
}
export interface PerformanceMetrics {
    requestCount: number;
    averageResponseTime: number;
    errorCount: number;
    cacheHitRate: number;
    activePlugins: string[];
    memoryUsage: {
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
}
//# sourceMappingURL=index.d.ts.map