import type { Plugin, EnhancedPluginResult, PluginExecutionContext } from '../../types/index.js';
export declare class PluginManager {
    private plugins;
    constructor();
    private registerDefaultPlugins;
    registerPlugin(plugin: Plugin): void;
    unregisterPlugin(name: string): boolean;
    run(input: string, context?: Partial<PluginExecutionContext>): Promise<EnhancedPluginResult[]>;
    private executePluginWithTimeout;
    private calculateConfidence;
    private calculateIntentMatch;
    private calculateContextRelevance;
    private createErrorMessage;
    getPlugin(name: string): Plugin | undefined;
    list(): string[];
    listWithDescriptions(): Array<{
        name: string;
        description: string;
    }>;
    getPluginCount(): number;
    clear(): void;
}
//# sourceMappingURL=index.d.ts.map