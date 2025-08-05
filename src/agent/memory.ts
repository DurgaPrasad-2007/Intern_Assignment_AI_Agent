import type { MemorySession, ChatMessage } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

// Define the OpenAI message type locally to match what we need
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class MemoryStore {
  private sessions: Map<string, MemorySession> = new Map();
  private readonly maxSize: number;
  private readonly cleanupInterval: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.maxSize = config.memory.maxSize;
    this.startCleanupTimer();
  }

  addMessage(sessionId: string, message: ChatMessage): void {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        messages: [],
        lastAccessed: new Date(),
      });
    }

    const session = this.sessions.get(sessionId)!;
    session.messages.push(message);
    session.lastAccessed = new Date();

    // Enforce max size
    if (session.messages.length > this.maxSize) {
      session.messages = session.messages.slice(-this.maxSize);
      logger.debug('Memory size limit reached, trimmed messages', { sessionId, maxSize: this.maxSize });
    }

    logger.debug('Added message to memory', { sessionId, messageCount: session.messages.length });
  }

  getMessages(sessionId: string): OpenAIMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    session.lastAccessed = new Date();
    
    // Convert ChatMessage to OpenAI format
    return session.messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content || '',
    }));
  }

  getSession(sessionId: string): MemorySession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessed = new Date();
    }
    return session;
  }

  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      logger.info('Deleted memory session', { sessionId });
    }
    return deleted;
  }

  getMemorySummary(sessionId: string): string {
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

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupOldSessions();
    }, this.cleanupInterval);
  }

  private cleanupOldSessions(): void {
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

  getStats(): { sessionCount: number; totalMessages: number } {
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
