import { MemoryStore } from './memory.js';
import { AdvancedRAG } from './advancedRag.js';
import { PluginManager } from './plugins/index.js';
import type { MessageRequest, MessageResponse } from '../types/index.js';
export declare class Agent {
    private openai;
    memory: MemoryStore;
    rag: AdvancedRAG;
    plugins: PluginManager;
    constructor();
    handleMessage(request: MessageRequest): Promise<MessageResponse>;
    private createMemorySummary;
    private formatRetrievedDocs;
    private formatPluginOutputs;
    private formatEnhancedPluginOutputs;
    private buildSystemPrompt;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        services: {
            openai: boolean;
            memory: boolean;
            rag: boolean;
            plugins: boolean;
        };
    }>;
}
//# sourceMappingURL=agent.d.ts.map