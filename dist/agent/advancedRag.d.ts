import type { SearchResult } from '../types/index.js';
export interface AdvancedSearchResult extends SearchResult {
    relevanceScore: number;
    diversityScore: number;
    freshnessScore: number;
    finalScore: number;
    contextType: 'exact-match' | 'semantic-similarity' | 'conceptual' | 'related';
    embedding: number[];
}
export interface RAGQuery {
    query: string;
    context?: string;
    filters?: {
        categories?: string[];
        dateRange?: {
            start: string;
            end: string;
        };
        difficulty?: string;
    };
    searchType?: 'hybrid' | 'semantic' | 'keyword';
    maxResults?: number;
}
export declare class AdvancedRAG {
    private vectors;
    private keywordIndex;
    private categoryIndex;
    private ready;
    private isInitialized;
    private openai;
    constructor();
    private init;
    /**
     * Build keyword and category indices for hybrid search
     */
    private buildIndices;
    /**
     * Extract meaningful keywords from text
     */
    private extractKeywords;
    /**
     * Simple stop word list
     */
    private isStopWord;
    /**
     * Advanced query method with hybrid search and re-ranking
     */
    query(ragQuery: RAGQuery): Promise<AdvancedSearchResult[]>;
    /**
     * Semantic search using embeddings
     */
    private semanticSearch;
    /**
     * Keyword-based search
     */
    private keywordSearch;
    /**
     * Apply filters to search results
     */
    private applyFilters;
    /**
     * Remove duplicate documents
     */
    private removeDuplicates;
    /**
     * Re-rank results using multiple factors
     */
    private reRankResults;
    /**
     * Calculate diversity score to avoid similar results
     */
    private calculateDiversityScore;
    /**
     * Calculate freshness score based on publication date
     */
    private calculateFreshnessScore;
    /**
     * Determine the type of context match
     */
    private determineContextType;
    /**
     * Select diverse results to avoid redundancy
     */
    private selectDiverseResults;
    /**
     * Get embedding for text with caching and real OpenAI API
     */
    private getEmbedding;
    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity;
    /**
     * Get system statistics
     */
    getStats(): {
        documentCount: number;
        keywordCount: number;
        categoryCount: number;
        categories: string[];
    };
}
//# sourceMappingURL=advancedRag.d.ts.map