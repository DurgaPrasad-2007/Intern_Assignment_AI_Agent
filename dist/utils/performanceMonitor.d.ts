import type { PerformanceMetrics } from '../types/index.js';
export declare class PerformanceMonitor {
    private metrics;
    private requestTimes;
    private readonly maxRequestTimes;
    constructor();
    /**
     * Record a request completion
     */
    recordRequest(responseTime: number, hasError?: boolean): void;
    /**
     * Record cache statistics
     */
    recordCacheAccess(hit: boolean): void;
    /**
     * Update active plugins list
     */
    updateActivePlugins(plugins: string[]): void;
    /**
     * Get current performance metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Get detailed performance report
     */
    getDetailedReport(): {
        metrics: PerformanceMetrics;
        additional: {
            errorRate: number;
            requestsPerMinute: number;
            memoryTrend: 'increasing' | 'decreasing' | 'stable';
            healthScore: number;
        };
    };
    /**
     * Record plugin execution time
     */
    recordPluginExecution(pluginName: string, executionTime: number): void;
    /**
     * Record RAG query performance
     */
    recordRAGQuery(queryTime: number, documentsRetrieved: number, embeddingTime?: number): void;
    /**
     * Reset metrics (useful for testing or periodic resets)
     */
    reset(): void;
    /**
     * Export metrics for external monitoring systems
     */
    exportMetrics(): string;
    private updateMemoryUsage;
    private analyzeMemoryTrend;
    private calculateHealthScore;
    /**
     * Get performance alerts based on thresholds
     */
    getAlerts(): Array<{
        level: 'warning' | 'critical';
        message: string;
        metric: string;
        value: number;
        threshold: number;
    }>;
}
export declare const performanceMonitor: PerformanceMonitor;
//# sourceMappingURL=performanceMonitor.d.ts.map