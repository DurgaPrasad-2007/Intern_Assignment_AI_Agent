import type { MemorySession, ChatMessage } from '../types/index.js';
interface OpenAIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export declare class MemoryStore {
    private sessions;
    private readonly maxSize;
    private readonly cleanupInterval;
    constructor();
    addMessage(sessionId: string, message: ChatMessage): void;
    getMessages(sessionId: string): OpenAIMessage[];
    getSession(sessionId: string): MemorySession | undefined;
    deleteSession(sessionId: string): boolean;
    getMemorySummary(sessionId: string): string;
    private startCleanupTimer;
    private cleanupOldSessions;
    getStats(): {
        sessionCount: number;
        totalMessages: number;
    };
}
export {};
//# sourceMappingURL=memory.d.ts.map