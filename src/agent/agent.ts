import OpenAI from 'openai';
import { MemoryStore } from './memory.js';
import { AdvancedRAG } from './advancedRag.js';
import { PluginManager } from './plugins/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { performanceMonitor } from '../utils/performanceMonitor.js';
import type { MessageRequest, MessageResponse, PluginExecutionContext } from '../types/index.js';

export class Agent {
  private openai: OpenAI;
  public memory: MemoryStore;
  public rag: AdvancedRAG;
  public plugins: PluginManager;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.memory = new MemoryStore();
    this.rag = new AdvancedRAG();
    this.plugins = new PluginManager();
    
    logger.info('AI Agent initialized', {
      model: config.openai.model,
      pluginCount: this.plugins.getPluginCount(),
    });
  }

  async handleMessage(request: MessageRequest): Promise<MessageResponse> {
    const { message, session_id } = request;
    const startTime = Date.now();

    try {
      logger.info('Processing message', { 
        sessionId: session_id, 
        messageLength: message.length 
      });

      // Get conversation history
      const history = this.memory.getMessages(session_id);
      const memorySummary = this.memory.getMemorySummary(session_id);

      // Retrieve relevant documents with performance tracking
      const ragStartTime = Date.now();
      const retrievedDocs = await this.rag.query({ query: message, maxResults: 3 });
      const ragTime = Date.now() - ragStartTime;
      performanceMonitor.recordRAGQuery(ragTime, retrievedDocs.length);
      
      logger.info('RAG query completed', {
        query: message.slice(0, 100),
        retrievedCount: retrievedDocs.length,
        processingTime: ragTime,
        topScore: retrievedDocs[0]?.score,
        documentIds: retrievedDocs.map(d => d.id)
      });
      
      const contextDocs = this.formatRetrievedDocs(retrievedDocs);

      // Execute plugins with context
      const pluginContext: PluginExecutionContext = {
        sessionId: session_id,
        timestamp: new Date().toISOString(),
        userInput: message,
        conversationHistory: history.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content || '',
          timestamp: new Date().toISOString(),
        })),
      };

      const pluginResults = await this.plugins.run(message, pluginContext);
      const pluginOutputs = this.formatEnhancedPluginOutputs(pluginResults);

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(memorySummary, contextDocs, pluginOutputs);

      // Prepare messages for OpenAI
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...history,
        { role: 'user' as const, content: message },
      ];

      // Generate response
      const completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const reply = completion.choices[0]?.message?.content ?? 'I apologize, but I was unable to generate a response.';

      // Store in memory
      this.memory.addMessage(session_id, { role: 'user', content: message });
      this.memory.addMessage(session_id, { role: 'assistant', content: reply });

      const processingTime = Date.now() - startTime;

      // Record performance metrics
      performanceMonitor.recordRequest(processingTime, false);

      logger.info('Message processed successfully', {
        sessionId: session_id,
        processingTime,
        tokensUsed: completion.usage?.total_tokens,
        retrievedDocsCount: retrievedDocs.length,
        pluginResultsCount: pluginResults.length,
      });

      return {
        reply,
        session_id,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Record error metrics
      performanceMonitor.recordRequest(processingTime, true);
      
      logger.error('Failed to process message', {
        sessionId: session_id,
        error,
        processingTime,
      });

      throw error;
    }
  }

  private createMemorySummary(history: Array<{ role: string; content: string }>): string {
    if (history.length === 0) {
      return 'No previous conversation history.';
    }

    const recentMessages = history.slice(-4); // Last 2 exchanges (4 messages)
    return recentMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');
  }

  private formatRetrievedDocs(docs: Array<{ id: string; text: string; score: number; metadata?: any }>): string {
    if (docs.length === 0) {
      return 'No relevant documents found.';
    }

    logger.info('Formatting retrieved documents for prompt', {
      count: docs.length,
      topScore: docs[0]?.score,
      documentIds: docs.map(d => d.id)
    });

    return docs
      .map((doc, index) => {
        const source = doc.metadata?.source || doc.metadata?.title || doc.id;
        const category = doc.metadata?.category || 'general';
        return `[Document ${index + 1} - ${source} (${category})] ${doc.text} (Relevance: ${(doc.score * 100).toFixed(1)}%)`;
      })
      .join('\n\n');
  }

  private formatPluginOutputs(results: Array<{ name: string; result: string; success: boolean }>): string {
    if (results.length === 0) {
      return 'No plugins were triggered.';
    }

    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length === 0) {
      return 'Plugins were triggered but encountered errors.';
    }

    return successfulResults
      .map((result) => `[${result.name}] ${result.result}`)
      .join('\n');
  }

  private formatEnhancedPluginOutputs(results: Array<{ 
    name: string; 
    result: string; 
    success: boolean;
    executionTime: number;
    confidence?: number;
  }>): string {
    if (results.length === 0) {
      return 'No plugins were triggered.';
    }

    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length === 0) {
      return 'Plugins were triggered but encountered errors.';
    }

    return successfulResults
      .map((result) => {
        const confidenceStr = result.confidence ? ` (confidence: ${(result.confidence * 100).toFixed(0)}%)` : '';
        return `[${result.name}${confidenceStr}] ${result.result}`;
      })
      .join('\n');
  }

  private buildSystemPrompt(
    memorySummary: string,
    contextDocs: string,
    pluginOutputs: string
  ): string {
    return `You are an intelligent AI assistant with advanced capabilities for contextual understanding, memory retention, and dynamic task execution.

## Your Core Capabilities:
- **Memory Management**: Access to conversation history for contextual continuity
- **Document Intelligence**: Reference relevant knowledge base documents for informed responses
- **Plugin Orchestration**: Execute specialized plugins (weather, math, etc.) based on user intent
- **Contextual Reasoning**: Synthesize information from multiple sources for comprehensive answers

## Current Context:

### Conversation Memory:
${memorySummary}

### Knowledge Base Documents:
${contextDocs}

### Plugin Execution Results:
${pluginOutputs}

## Response Guidelines:
1. **Contextual Continuity**: Leverage conversation memory to maintain coherent dialogue flow
2. **Knowledge Integration**: When relevant documents are provided, actively reference and cite them in your responses. Mention specific sources and use their information to provide accurate, detailed answers.
3. **Plugin Acknowledgment**: Explicitly reference plugin results when they directly address user queries
4. **Natural Communication**: Maintain conversational tone while being informative and precise
5. **Honest Uncertainty**: If no relevant documents are found, acknowledge this and provide general information while noting the limitation
6. **Concise Clarity**: Deliver comprehensive responses efficiently without unnecessary verbosity

## Document Usage Instructions:
- When knowledge base documents are provided, use them as your primary source of information
- Reference specific documents by name (e.g., "According to the Daext guide..." or "The John Apostol tutorial mentions...")
- Combine information from multiple documents when they provide complementary insights
- If documents contain specific technical details, include them in your response
- Always acknowledge the source when using document information

## Quality Standards:
- Prioritize accuracy and relevance in all responses
- Demonstrate understanding of user intent through contextual awareness
- Provide actionable insights when possible
- Maintain professional yet approachable communication style
- When documents are available, use them to provide authoritative, well-sourced responses

Remember: You are engaging in a dynamic conversation where context, knowledge, and capabilities work together to deliver exceptional user experiences. When relevant documents are provided, they should be your primary source of information.`;
  }

  // Health check method
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    services: {
      openai: boolean;
      memory: boolean;
      rag: boolean;
      plugins: boolean;
    };
  }> {
    const services = {
      openai: false,
      memory: false,
      rag: false,
      plugins: false,
    };

    try {
      // Test OpenAI
      await this.openai.models.list();
      services.openai = true;
    } catch (error) {
      logger.error('OpenAI health check failed', { error });
    }

    // Test memory
    try {
      this.memory.getStats();
      services.memory = true;
    } catch (error) {
      logger.error('Memory health check failed', { error });
    }

    // Test RAG
    try {
      this.rag.getStats().documentCount;
      services.rag = true;
    } catch (error) {
      logger.error('RAG health check failed', { error });
    }

    // Test plugins
    try {
      this.plugins.getPluginCount();
      services.plugins = true;
    } catch (error) {
      logger.error('Plugins health check failed', { error });
    }

    const status = Object.values(services).every(Boolean) ? 'healthy' : 'unhealthy';

    return { status, services };
  }
}
