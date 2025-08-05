import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MemoryStore } from '../agent/memory.js';
import type { ChatMessage } from '../types/index.js';

describe('MemoryStore', () => {
  let memoryStore: MemoryStore;
  const testSessionId = 'test-session';

  beforeEach(() => {
    memoryStore = new MemoryStore();
  });

  afterEach(() => {
    // Clean up any timers
    jest.clearAllTimers();
  });

  describe('message management', () => {
    it('should add messages to a new session', () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'Hello, world!'
      };

      memoryStore.addMessage(testSessionId, message);

      const messages = memoryStore.getMessages(testSessionId);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        role: 'user',
        content: 'Hello, world!'
      });
    });

    it('should add multiple messages to the same session', () => {
      const userMessage: ChatMessage = {
        role: 'user',
        content: 'Hello!'
      };
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: 'Hi there!'
      };

      memoryStore.addMessage(testSessionId, userMessage);
      memoryStore.addMessage(testSessionId, assistantMessage);

      const messages = memoryStore.getMessages(testSessionId);
      expect(messages).toHaveLength(2);
      expect(messages[0]?.content).toBe('Hello!');
      expect(messages[1]?.content).toBe('Hi there!');
    });

    it('should return empty array for non-existent session', () => {
      const messages = memoryStore.getMessages('non-existent');
      expect(messages).toEqual([]);
    });

    it('should update last accessed time when getting messages', () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'Test message'
      };

      memoryStore.addMessage(testSessionId, message);
      
      const initialSession = memoryStore.getSession(testSessionId);
      const initialTime = initialSession!.lastAccessed;

      // Wait a bit and access again
      setTimeout(() => {
        memoryStore.getMessages(testSessionId);
        const updatedSession = memoryStore.getSession(testSessionId);
        expect(updatedSession!.lastAccessed.getTime()).toBeGreaterThan(initialTime.getTime());
      }, 10);
    });
  });

  describe('session management', () => {
    it('should get session information', () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'Test message'
      };

      memoryStore.addMessage(testSessionId, message);
      
      const session = memoryStore.getSession(testSessionId);
      expect(session).toBeDefined();
      expect(session!.messages).toHaveLength(1);
      expect(session!.lastAccessed).toBeInstanceOf(Date);
    });

    it('should return undefined for non-existent session', () => {
      const session = memoryStore.getSession('non-existent');
      expect(session).toBeUndefined();
    });

    it('should delete session successfully', () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'Test message'
      };

      memoryStore.addMessage(testSessionId, message);
      
      const deleted = memoryStore.deleteSession(testSessionId);
      expect(deleted).toBe(true);
      
      const session = memoryStore.getSession(testSessionId);
      expect(session).toBeUndefined();
    });

    it('should return false when deleting non-existent session', () => {
      const deleted = memoryStore.deleteSession('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('memory trimming', () => {
    it('should trim messages when exceeding max size', () => {
      // Create a memory store with very small max size for testing
      const smallMemoryStore = new (MemoryStore as any)();
      // Access private maxSize property for testing
      (smallMemoryStore as any).maxSize = 3;

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' },
        { role: 'user', content: 'Message 2' },
        { role: 'assistant', content: 'Response 2' },
        { role: 'user', content: 'Message 3' }
      ];

      messages.forEach(msg => smallMemoryStore.addMessage(testSessionId, msg));

      const storedMessages = smallMemoryStore.getMessages(testSessionId);
      expect(storedMessages).toHaveLength(3);
      expect(storedMessages[0]?.content).toBe('Response 1'); // Oldest messages should be removed
      expect(storedMessages[2]?.content).toBe('Message 3');
    });
  });

  describe('memory summary', () => {
    it('should create memory summary for existing session', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
        { role: 'assistant', content: 'I am doing well!' }
      ];

      messages.forEach(msg => memoryStore.addMessage(testSessionId, msg));

      const summary = memoryStore.getMemorySummary(testSessionId);
      
      expect(summary).toContain('Recent conversation history:');
      expect(summary).toContain('user: Hello');
      expect(summary).toContain('assistant: Hi there!');
      expect(summary).toContain('user: How are you?');
      expect(summary).toContain('assistant: I am doing well!');
    });

    it('should return default message for empty session', () => {
      const summary = memoryStore.getMemorySummary('empty-session');
      expect(summary).toBe('No previous conversation history.');
    });

    it('should limit summary to recent messages', () => {
      const messages: ChatMessage[] = [];
      for (let i = 0; i < 10; i++) {
        messages.push({ role: 'user', content: `Message ${i}` });
        messages.push({ role: 'assistant', content: `Response ${i}` });
      }

      messages.forEach(msg => memoryStore.addMessage(testSessionId, msg));

      const summary = memoryStore.getMemorySummary(testSessionId);
      
      // Should only include last 5 messages
      expect(summary).toContain('Message 9');
      expect(summary).toContain('Response 9');
      expect(summary).not.toContain('Message 0');
      expect(summary).not.toContain('Response 0');
    });
  });

  describe('statistics', () => {
    it('should provide accurate statistics', () => {
      // Add messages to multiple sessions
      memoryStore.addMessage('session1', { role: 'user', content: 'Hello 1' });
      memoryStore.addMessage('session1', { role: 'assistant', content: 'Hi 1' });
      memoryStore.addMessage('session2', { role: 'user', content: 'Hello 2' });

      const stats = memoryStore.getStats();
      
      expect(stats.sessionCount).toBe(2);
      expect(stats.totalMessages).toBe(3);
    });

    it('should return zero stats for empty memory', () => {
      const stats = memoryStore.getStats();
      
      expect(stats.sessionCount).toBe(0);
      expect(stats.totalMessages).toBe(0);
    });
  });

  describe('session cleanup', () => {
    it('should clean up old sessions', (done) => {
      // Mock the cleanup interval to be very short for testing
      const shortCleanupMemory = new (MemoryStore as any)();
      (shortCleanupMemory as any).cleanupInterval = 100; // 100ms

      // Add a message
      shortCleanupMemory.addMessage(testSessionId, { 
        role: 'user', 
        content: 'Test message' 
      });

      // Manually set the last accessed time to be old
      const session = shortCleanupMemory.getSession(testSessionId);
      if (session) {
        session.lastAccessed = new Date(Date.now() - 200); // 200ms ago
      }

      // Wait for cleanup to run
      setTimeout(() => {
        const sessionAfterCleanup = shortCleanupMemory.getSession(testSessionId);
        expect(sessionAfterCleanup).toBeUndefined();
        done();
      }, 150);
    });
  });
});