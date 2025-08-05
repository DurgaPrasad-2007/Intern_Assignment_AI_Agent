import { logger } from './logger.js';
export class PerformanceMonitor {
    metrics;
    requestTimes = [];
    maxRequestTimes = 1000; // Keep last 1000 request times
    constructor() {
        this.metrics = {
            requestCount: 0,
            averageResponseTime: 0,
            errorCount: 0,
            cacheHitRate: 0,
            activePlugins: [],
            memoryUsage: {
                heapUsed: 0,
                heapTotal: 0,
                external: 0,
            },
        };
        // Update memory usage periodically
        setInterval(() => {
            this.updateMemoryUsage();
        }, 30000); // Every 30 seconds
    }
    /**
     * Record a request completion
     */
    recordRequest(responseTime, hasError = false) {
        this.metrics.requestCount++;
        if (hasError) {
            this.metrics.errorCount++;
        }
        // Track response times
        this.requestTimes.push(responseTime);
        if (this.requestTimes.length > this.maxRequestTimes) {
            this.requestTimes.shift();
        }
        // Calculate average response time
        this.metrics.averageResponseTime =
            this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length;
        // Log slow requests
        if (responseTime > 5000) { // 5 seconds
            logger.warn('Slow request detected', {
                responseTime,
                averageResponseTime: this.metrics.averageResponseTime,
            });
        }
    }
    /**
     * Record cache statistics
     */
    recordCacheAccess(hit) {
        // Simple moving average for cache hit rate
        const currentHitRate = this.metrics.cacheHitRate;
        const newHitRate = hit ? 1 : 0;
        // Exponential moving average with alpha = 0.1
        this.metrics.cacheHitRate = currentHitRate * 0.9 + newHitRate * 0.1;
    }
    /**
     * Update active plugins list
     */
    updateActivePlugins(plugins) {
        this.metrics.activePlugins = [...plugins];
    }
    /**
     * Get current performance metrics
     */
    getMetrics() {
        this.updateMemoryUsage();
        return { ...this.metrics };
    }
    /**
     * Get detailed performance report
     */
    getDetailedReport() {
        const metrics = this.getMetrics();
        const errorRate = metrics.requestCount > 0 ? metrics.errorCount / metrics.requestCount : 0;
        // Calculate requests per minute (estimate based on recent data)
        const recentTimes = this.requestTimes.slice(-60); // Last 60 requests
        const requestsPerMinute = recentTimes.length > 0 ?
            (60000 / (recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length)) : 0;
        // Simple memory trend analysis
        const memoryTrend = this.analyzeMemoryTrend();
        // Calculate health score (0-100)
        const healthScore = this.calculateHealthScore(errorRate, metrics.averageResponseTime);
        return {
            metrics,
            additional: {
                errorRate,
                requestsPerMinute,
                memoryTrend,
                healthScore,
            },
        };
    }
    /**
     * Record plugin execution time
     */
    recordPluginExecution(pluginName, executionTime) {
        logger.debug('Plugin execution recorded', {
            plugin: pluginName,
            executionTime,
        });
        // Log slow plugin execution
        if (executionTime > 2000) { // 2 seconds
            logger.warn('Slow plugin execution detected', {
                plugin: pluginName,
                executionTime,
            });
        }
    }
    /**
     * Record RAG query performance
     */
    recordRAGQuery(queryTime, documentsRetrieved, embeddingTime) {
        logger.debug('RAG query recorded', {
            queryTime,
            documentsRetrieved,
            embeddingTime,
        });
        if (queryTime > 3000) { // 3 seconds
            logger.warn('Slow RAG query detected', {
                queryTime,
                documentsRetrieved,
                embeddingTime,
            });
        }
    }
    /**
     * Reset metrics (useful for testing or periodic resets)
     */
    reset() {
        this.metrics = {
            requestCount: 0,
            averageResponseTime: 0,
            errorCount: 0,
            cacheHitRate: 0,
            activePlugins: [],
            memoryUsage: {
                heapUsed: 0,
                heapTotal: 0,
                external: 0,
            },
        };
        this.requestTimes = [];
        logger.info('Performance metrics reset');
    }
    /**
     * Export metrics for external monitoring systems
     */
    exportMetrics() {
        const metrics = this.getDetailedReport();
        return JSON.stringify(metrics, null, 2);
    }
    updateMemoryUsage() {
        const memUsage = process.memoryUsage();
        this.metrics.memoryUsage = {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
        };
    }
    analyzeMemoryTrend() {
        // This is a simplified trend analysis
        // In a real system, you'd track memory usage over time
        const currentUsage = this.metrics.memoryUsage.heapUsed;
        const threshold = this.metrics.memoryUsage.heapTotal * 0.8; // 80% of heap
        if (currentUsage > threshold) {
            return 'increasing';
        }
        else if (currentUsage < threshold * 0.5) {
            return 'decreasing';
        }
        return 'stable';
    }
    calculateHealthScore(errorRate, avgResponseTime) {
        let score = 100;
        // Deduct points for high error rate
        score -= errorRate * 50; // 50 points for 100% error rate
        // Deduct points for slow response times
        if (avgResponseTime > 1000) { // More than 1 second
            score -= Math.min(30, (avgResponseTime - 1000) / 100); // Up to 30 points
        }
        // Deduct points for high memory usage
        const memoryUsagePercent = this.metrics.memoryUsage.heapUsed / this.metrics.memoryUsage.heapTotal;
        if (memoryUsagePercent > 0.8) {
            score -= (memoryUsagePercent - 0.8) * 50; // Up to 10 points
        }
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Get performance alerts based on thresholds
     */
    getAlerts() {
        const alerts = [];
        const metrics = this.getMetrics();
        const detailed = this.getDetailedReport();
        // Check error rate
        if (detailed.additional.errorRate > 0.1) { // 10%
            alerts.push({
                level: detailed.additional.errorRate > 0.2 ? 'critical' : 'warning',
                message: 'High error rate detected',
                metric: 'errorRate',
                value: detailed.additional.errorRate,
                threshold: 0.1,
            });
        }
        // Check response time
        if (metrics.averageResponseTime > 2000) { // 2 seconds
            alerts.push({
                level: metrics.averageResponseTime > 5000 ? 'critical' : 'warning',
                message: 'High average response time',
                metric: 'averageResponseTime',
                value: metrics.averageResponseTime,
                threshold: 2000,
            });
        }
        // Check memory usage
        const memoryUsagePercent = metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal;
        if (memoryUsagePercent > 0.8) { // 80%
            alerts.push({
                level: memoryUsagePercent > 0.9 ? 'critical' : 'warning',
                message: 'High memory usage',
                metric: 'memoryUsage',
                value: memoryUsagePercent,
                threshold: 0.8,
            });
        }
        return alerts;
    }
}
// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
//# sourceMappingURL=performanceMonitor.js.map