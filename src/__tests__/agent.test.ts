import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Agent } from '../agent/agent.js';
import type { MessageRequest } from '../types/index.js';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Test response from AI'
              }
            }],
            usage: {
              total_tokens: 100
            }
          })
        }
      },
      models: {
        list: jest.fn().mockResolvedValue({ data: [] })
      }
    }))
  };
});

// Mock performance monitor
jest.mock('../utils/performanceMonitor.js', () => ({
  performanceMonitor: {
    recordPluginExecution: jest.fn(),
    recordRequest: jest.fn(),
    recordRAGQuery: jest.fn(),
  }
}));

describe('Agent', () => {
  let agent: Agent;

  beforeEach(() => {
    agent = new Agent();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMessage', () => {
    it('should handle a basic message request', async () => {
      const request: MessageRequest = {
        message: 'Hello, how are you?',
        session_id: 'test-session-1'
      };

      const response = await agent.handleMessage(request);

      expect(response).toBeDefined();
      expect(response.reply).toBe('Test response from AI');
      expect(response.session_id).toBe('test-session-1');
      expect(response.timestamp).toBeDefined();
    });

    it('should maintain conversation memory across messages', async () => {
      const sessionId = 'test-session-memory';
      
      // First message
      await agent.handleMessage({
        message: 'My name is John',
        session_id: sessionId
      });

      // Second message
      const response = await agent.handleMessage({
        message: 'What is my name?',
        session_id: sessionId
      });

      expect(response).toBeDefined();
      expect(response.session_id).toBe(sessionId);
      
      // Check that memory contains both messages
      const session = agent.memory.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session!.messages.length).toBe(4); // 2 user + 2 assistant messages
    });

    it('should handle plugin execution', async () => {
      const request: MessageRequest = {
        message: 'What is 2 + 2?',
        session_id: 'test-session-math'
      };

      const response = await agent.handleMessage(request);

      expect(response).toBeDefined();
      expect(response.reply).toBe('Test response from AI');
    });

    it('should handle RAG document retrieval', async () => {
      const request: MessageRequest = {
        message: 'Tell me about markdown',
        session_id: 'test-session-rag'
      };

      const response = await agent.handleMessage(request);

      expect(response).toBeDefined();
      expect(response.reply).toBe('Test response from AI');
    });

    it('should handle errors gracefully', async () => {
      // Mock OpenAI to throw an error
      const mockOpenAI = agent['openai'] as any;
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('API Error'));

      const request: MessageRequest = {
        message: 'This should fail',
        session_id: 'test-session-error'
      };

      await expect(agent.handleMessage(request)).rejects.toThrow('API Error');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when all services are working', async () => {
      const health = await agent.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.services.openai).toBe(true);
      expect(health.services.memory).toBe(true);
      expect(health.services.rag).toBe(true);
      expect(health.services.plugins).toBe(true);
    });

    it('should return unhealthy status when OpenAI fails', async () => {
      // Mock OpenAI to fail
      const mockOpenAI = agent['openai'] as any;
      mockOpenAI.models.list.mockRejectedValueOnce(new Error('OpenAI Error'));

      const health = await agent.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.services.openai).toBe(false);
    });
  });

  describe('system prompt building', () => {
    it('should build system prompt with all components', () => {
      const memorySummary = 'user: Hello\nassistant: Hi there!';
      const contextDocs = '[Document 1] Test document content';
      const pluginOutputs = '[math] 2 + 2 = 4';

      const systemPrompt = agent['buildSystemPrompt'](memorySummary, contextDocs, pluginOutputs);

      expect(systemPrompt).toContain('You are an intelligent AI assistant');
      expect(systemPrompt).toContain(memorySummary);
      expect(systemPrompt).toContain(contextDocs);
      expect(systemPrompt).toContain(pluginOutputs);
    });
  });

  describe('document formatting', () => {
    it('should format retrieved documents correctly', () => {
      const docs = [
        { id: 'doc1', text: 'Test document 1', score: 0.9 },
        { id: 'doc2', text: 'Test document 2', score: 0.8 }
      ];

      const formatted = agent['formatRetrievedDocs'](docs);

      expect(formatted).toContain('[Document 1] Test document 1 (Relevance: 90.0%)');
      expect(formatted).toContain('[Document 2] Test document 2 (Relevance: 80.0%)');
    });

    it('should handle empty document list', () => {
      const formatted = agent['formatRetrievedDocs']([]);
      expect(formatted).toBe('No relevant documents found.');
    });
  });

  describe('plugin output formatting', () => {
    it('should format successful plugin results', () => {
      const results = [
        { name: 'math', result: '2 + 2 = 4', success: true },
        { name: 'weather', result: 'Sunny, 25°C', success: true }
      ];

      const formatted = agent['formatPluginOutputs'](results);

      expect(formatted).toContain('[math] 2 + 2 = 4');
      expect(formatted).toContain('[weather] Sunny, 25°C');
    });

    it('should filter out failed plugin results', () => {
      const results = [
        { name: 'math', result: '2 + 2 = 4', success: true },
        { name: 'weather', result: 'Error occurred', success: false }
      ];

      const formatted = agent['formatPluginOutputs'](results);

      expect(formatted).toContain('[math] 2 + 2 = 4');
      expect(formatted).not.toContain('[weather] Error occurred');
    });

    it('should handle empty plugin results', () => {
      const formatted = agent['formatPluginOutputs']([]);
      expect(formatted).toBe('No plugins were triggered.');
    });

    it('should handle all failed plugin results', () => {
      const results = [
        { name: 'math', result: 'Error', success: false },
        { name: 'weather', result: 'Error', success: false }
      ];

      const formatted = agent['formatPluginOutputs'](results);
      expect(formatted).toBe('Plugins were triggered but encountered errors.');
    });
  });
});