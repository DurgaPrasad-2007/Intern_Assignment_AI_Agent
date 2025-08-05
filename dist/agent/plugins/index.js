import { logger } from '../../utils/logger.js';
import { performanceMonitor } from '../../utils/performanceMonitor.js';
import { WeatherPlugin } from './weather.js';
import { MathPlugin } from './math.js';
export class PluginManager {
    plugins = new Map();
    constructor() {
        this.registerDefaultPlugins();
    }
    registerDefaultPlugins() {
        this.registerPlugin(new WeatherPlugin());
        this.registerPlugin(new MathPlugin());
        logger.info('Default plugins registered', { count: this.plugins.size });
    }
    registerPlugin(plugin) {
        if (this.plugins.has(plugin.name)) {
            logger.warn('Plugin already registered, overwriting', { name: plugin.name });
        }
        this.plugins.set(plugin.name, plugin);
        logger.info('Plugin registered', { name: plugin.name, description: plugin.description });
    }
    unregisterPlugin(name) {
        const deleted = this.plugins.delete(name);
        if (deleted) {
            logger.info('Plugin unregistered', { name });
        }
        return deleted;
    }
    async run(input, context) {
        const results = [];
        const promises = [];
        const startTime = Date.now();
        const executionContext = {
            sessionId: context?.sessionId || 'unknown',
            timestamp: new Date().toISOString(),
            userInput: input,
            conversationHistory: context?.conversationHistory || [],
        };
        for (const [name, plugin] of this.plugins) {
            const promise = this.executePluginWithTimeout(plugin, input, executionContext, 10000) // 10s timeout
                .then((result) => {
                if (result) {
                    results.push(result);
                    performanceMonitor.recordPluginExecution(name, result.executionTime);
                    logger.debug('Plugin executed successfully', {
                        name,
                        success: result.success,
                        executionTime: result.executionTime,
                        input: input.slice(0, 100)
                    });
                }
            })
                .catch((error) => {
                const executionTime = Date.now() - startTime;
                logger.error('Plugin execution failed', {
                    name,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    executionTime,
                    input: input.slice(0, 100)
                });
                performanceMonitor.recordPluginExecution(name, executionTime);
                results.push({
                    name,
                    result: this.createErrorMessage(name, error),
                    success: false,
                    executionTime,
                    metadata: {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        timeout: error instanceof Error && error.message.includes('timeout'),
                    },
                });
            });
            promises.push(promise);
        }
        // Wait for all plugins to complete (with timeout handling)
        await Promise.allSettled(promises);
        // Sort results by success status and confidence (successful and high confidence first)
        results.sort((a, b) => {
            if (a.success !== b.success) {
                return b.success ? 1 : -1;
            }
            if (a.confidence !== undefined && b.confidence !== undefined) {
                return b.confidence - a.confidence;
            }
            return 0;
        });
        const totalExecutionTime = Date.now() - startTime;
        logger.debug('Plugin execution completed', {
            input: input.slice(0, 100),
            resultCount: results.length,
            successfulCount: results.filter(r => r.success).length,
            totalExecutionTime,
        });
        return results;
    }
    async executePluginWithTimeout(plugin, input, context, timeoutMs) {
        const startTime = Date.now();
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Plugin ${plugin.name} execution timeout after ${timeoutMs}ms`));
            }, timeoutMs);
            plugin.run(input)
                .then((result) => {
                clearTimeout(timeout);
                if (result) {
                    const enhancedResult = {
                        ...result,
                        executionTime: Date.now() - startTime,
                        confidence: this.calculateConfidence(result, context),
                    };
                    resolve(enhancedResult);
                }
                else {
                    resolve(null);
                }
            })
                .catch((error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    calculateConfidence(result, context) {
        // Advanced confidence calculation based on multiple factors
        let confidence = 0.4; // Base confidence
        // Success factor (highest weight)
        if (result.success) {
            confidence += 0.3;
        }
        // Metadata richness factor
        if (result.metadata && Object.keys(result.metadata).length > 0) {
            confidence += 0.1;
        }
        // Intent matching factor
        const input = context.userInput.toLowerCase();
        const intentScore = this.calculateIntentMatch(result.name, input, context);
        confidence += intentScore;
        // Context relevance factor
        const contextRelevance = this.calculateContextRelevance(result, context);
        confidence += contextRelevance;
        return Math.min(1.0, Math.max(0.0, confidence));
    }
    calculateIntentMatch(pluginName, input, _context) {
        const intentPatterns = {
            weather: {
                keywords: ['weather', 'temperature', 'forecast', 'climate', 'hot', 'cold', 'sunny', 'rainy'],
                patterns: [
                    /weather\s+(?:in|for|at)\s+([a-zA-Z\s,]+)/i,
                    /(?:what's|what is|how's|how is)\s+(?:the\s+)?weather/i,
                    /temperature\s+(?:in|for|at)\s+([a-zA-Z\s,]+)/i
                ]
            },
            math: {
                keywords: ['calculate', 'compute', 'solve', 'evaluate', 'math', 'equation'],
                patterns: [
                    /[\d\+\-\*\/\(\)=]/,
                    /calculate\s+(.+)/i,
                    /what\s+(?:is|equals)\s+(.+)/i,
                    /solve\s+(.+)/i
                ]
            }
        };
        const pluginPatterns = intentPatterns[pluginName];
        if (!pluginPatterns)
            return 0.1;
        let score = 0.0;
        // Keyword matching
        const keywordMatches = pluginPatterns.keywords.filter(keyword => input.includes(keyword)).length;
        score += (keywordMatches / pluginPatterns.keywords.length) * 0.2;
        // Pattern matching
        const patternMatches = pluginPatterns.patterns.filter(pattern => pattern.test(input)).length;
        score += (patternMatches / pluginPatterns.patterns.length) * 0.2;
        return score;
    }
    calculateContextRelevance(result, _context) {
        // Check if plugin result is relevant to conversation context
        if (!_context.conversationHistory || _context.conversationHistory.length === 0) {
            return 0.05; // Small bonus for being the first interaction
        }
        // Check if recent conversation mentions related topics
        const recentMessages = _context.conversationHistory.slice(-3);
        const conversationText = recentMessages
            .map((msg) => (msg.content || '').toLowerCase())
            .join(' ');
        const relevanceKeywords = {
            weather: ['weather', 'temperature', 'forecast', 'climate'],
            math: ['calculate', 'compute', 'solve', 'equation', 'number']
        };
        const pluginKeywords = relevanceKeywords[result.name];
        if (!pluginKeywords)
            return 0.0;
        const keywordMatches = pluginKeywords.filter(keyword => conversationText.includes(keyword)).length;
        return (keywordMatches / pluginKeywords.length) * 0.1;
    }
    createErrorMessage(pluginName, error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('timeout')) {
            return `Plugin ${pluginName} is temporarily unavailable (timeout). Please try again later.`;
        }
        else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            return `Plugin ${pluginName} is experiencing connectivity issues. Please try again later.`;
        }
        else {
            return `Plugin ${pluginName} encountered an error. Please try rephrasing your request.`;
        }
    }
    getPlugin(name) {
        return this.plugins.get(name);
    }
    list() {
        return Array.from(this.plugins.keys());
    }
    listWithDescriptions() {
        return Array.from(this.plugins.values()).map(plugin => ({
            name: plugin.name,
            description: plugin.description,
        }));
    }
    getPluginCount() {
        return this.plugins.size;
    }
    clear() {
        this.plugins.clear();
        logger.info('All plugins cleared');
    }
}
//# sourceMappingURL=index.js.map