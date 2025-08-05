import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
export class MemoryStore {
    sessions = new Map();
    maxSize;
    cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
    constructor() {
        this.maxSize = config.memory.maxSize;
        this.startCleanupTimer();
    }
    addMessage(sessionId, message) {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                messages: [],
                lastAccessed: new Date(),
            });
        }
        const session = this.sessions.get(sessionId);
        session.messages.push(message);
        session.lastAccessed = new Date();
        // Enforce max size
        if (session.messages.length > this.maxSize) {
            session.messages = session.messages.slice(-this.maxSize);
            logger.debug('Memory size limit reached, trimmed messages', { sessionId, maxSize: this.maxSize });
        }
        logger.debug('Added message to memory', { sessionId, messageCount: session.messages.length });
    }
    getMessages(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return [];
        }
        session.lastAccessed = new Date();
        // Convert ChatMessage to OpenAI format
        return session.messages.map(msg => ({
            role: msg.role,
            content: msg.content || '',
        }));
    }
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastAccessed = new Date();
        }
        return session;
    }
    deleteSession(sessionId) {
        const deleted = this.sessions.delete(sessionId);
        if (deleted) {
            logger.info('Deleted memory session', { sessionId });
        }
        return deleted;
    }
    getMemorySummary(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || session.messages.length === 0) {
            return 'No previous conversation history.';
        }
        const recentMessages = session.messages.slice(-5); // Last 5 messages
        const summary = recentMessages
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n');
        return `Recent conversation history:\n${summary}`;
    }
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupOldSessions();
        }, this.cleanupInterval);
    }
    cleanupOldSessions() {
        const now = new Date();
        const cutoff = new Date(now.getTime() - this.cleanupInterval);
        let cleanedCount = 0;
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.lastAccessed < cutoff) {
                this.sessions.delete(sessionId);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            logger.info('Cleaned up old memory sessions', { cleanedCount });
        }
    }
    getStats() {
        let totalMessages = 0;
        for (const session of this.sessions.values()) {
            totalMessages += session.messages.length;
        }
        return {
            sessionCount: this.sessions.size,
            totalMessages,
        };
    }
}
//# sourceMappingURL=memory.js.map