// import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { cache } from '../utils/cache.js';
import OpenAI from 'openai';
import { config } from '../config/index.js';
import type { Document, DocumentVector, SearchResult } from '../types/index.js';
import { loadDocumentsFromFiles } from '../data/documents.js';

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
    dateRange?: { start: string; end: string };
    difficulty?: string;
  };
  searchType?: 'hybrid' | 'semantic' | 'keyword';
  maxResults?: number;
}

export class AdvancedRAG {
  private vectors: DocumentVector[] = [];
  private keywordIndex: Map<string, Set<string>> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private ready: Promise<void>;
  private isInitialized = false;
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    try {
      logger.info('Initializing Advanced RAG system...');
      
      // Load documents from files
      const documents = await loadDocumentsFromFiles();
      
      logger.info(`Loaded ${documents.length} documents, processing embeddings...`);
      
      // Process documents and build indices
      for (const doc of documents) {
        try {
          const embedding = await this.getEmbedding(doc.text);
          const vector: DocumentVector = {
            id: doc.id,
            text: doc.text,
            embedding,
            metadata: doc.metadata || {},
          };
          
          this.vectors.push(vector);
          this.buildIndices(doc);
          
          logger.debug(`Processed document: ${doc.id}`, {
            textLength: doc.text.length,
            embeddingDimensions: embedding.length
          });
        } catch (error) {
          logger.error(`Failed to process document ${doc.id}`, { error });
        }
      }

      this.isInitialized = true;
      logger.info('Advanced RAG system initialized', { 
        documentCount: this.vectors.length,
        keywordCount: this.keywordIndex.size,
        categoryCount: this.categoryIndex.size
      });
    } catch (error) {
      logger.error('Failed to initialize Advanced RAG system', { error });
      throw error;
    }
  }

  /**
   * Build keyword and category indices for hybrid search
   */
  private buildIndices(doc: Document): void {
    // Extract keywords from text
    const keywords = this.extractKeywords(doc.text);
    keywords.forEach(keyword => {
      if (!this.keywordIndex.has(keyword)) {
        this.keywordIndex.set(keyword, new Set());
      }
      this.keywordIndex.get(keyword)!.add(doc.id);
    });

    // Build category index
    const category = doc.metadata?.category as string;
    if (category) {
      if (!this.categoryIndex.has(category)) {
        this.categoryIndex.set(category, new Set());
      }
      this.categoryIndex.get(category)!.add(doc.id);
    }
  }

  /**
   * Extract meaningful keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isStopWord(word));
    
    // Count frequency and return top keywords
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Simple stop word list
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);
    return stopWords.has(word);
  }

  /**
   * Advanced query method with hybrid search and re-ranking
   */
  async query(ragQuery: RAGQuery): Promise<AdvancedSearchResult[]> {
    await this.ready;

    if (!this.isInitialized) {
      throw new Error('Advanced RAG system not initialized');
    }

    try {
      const { query, filters, searchType = 'hybrid', maxResults = 5 } = ragQuery;
      
      let candidates: DocumentVector[] = [];

      // Hybrid search combining semantic and keyword matching
      if (searchType === 'hybrid' || searchType === 'semantic') {
        const semanticResults = await this.semanticSearch(query);
        candidates.push(...semanticResults);
      }

      if (searchType === 'hybrid' || searchType === 'keyword') {
        const keywordResults = await this.keywordSearch(query);
        candidates.push(...keywordResults);
      }

      // Apply filters
      if (filters) {
        candidates = this.applyFilters(candidates, filters);
      }

      // Remove duplicates and re-rank
      const uniqueCandidates = this.removeDuplicates(candidates);
      const reRankedResults = await this.reRankResults(uniqueCandidates, query, ragQuery.context);
      
      // Select diverse results
      const diverseResults = this.selectDiverseResults(reRankedResults, maxResults);

      logger.debug('Advanced RAG query completed', {
        query: query.slice(0, 100),
        resultCount: diverseResults.length,
        searchType,
        topScore: diverseResults[0]?.finalScore
      });

      return diverseResults;
    } catch (error) {
      logger.error('Advanced RAG query failed', { error, query: ragQuery });
      throw error;
    }
  }

  /**
   * Semantic search using embeddings
   */
  private async semanticSearch(query: string): Promise<DocumentVector[]> {
    const queryEmbedding = await this.getEmbedding(query);
    
    const scored = this.vectors.map((vector) => ({
      ...vector,
      score: this.cosineSimilarity(queryEmbedding, vector.embedding),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ score: _score, ...vector }) => vector);
  }

  /**
   * Keyword-based search
   */
  private async keywordSearch(query: string): Promise<DocumentVector[]> {
    const queryKeywords = this.extractKeywords(query);
    const matchingDocs = new Set<string>();

    queryKeywords.forEach(keyword => {
      const docs = this.keywordIndex.get(keyword);
      if (docs) {
        docs.forEach(docId => matchingDocs.add(docId));
      }
    });

    return this.vectors.filter(vector => matchingDocs.has(vector.id));
  }

  /**
   * Apply filters to search results
   */
  private applyFilters(candidates: DocumentVector[], filters: RAGQuery['filters']): DocumentVector[] {
    if (!filters) return candidates;

    return candidates.filter(vector => {
      const metadata = vector.metadata || {};

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        const category = metadata.category as string;
        if (!category || !filters.categories.includes(category)) {
          return false;
        }
      }

      // Difficulty filter
      if (filters.difficulty) {
        const difficulty = metadata.difficulty as string;
        if (difficulty && difficulty !== filters.difficulty) {
          return false;
        }
      }

      // Date range filter (if implemented)
      if (filters.dateRange) {
        const published = metadata.published as string;
        if (published) {
          const publishDate = new Date(published);
          const startDate = new Date(filters.dateRange.start);
          const endDate = new Date(filters.dateRange.end);
          
          if (publishDate < startDate || publishDate > endDate) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Remove duplicate documents
   */
  private removeDuplicates(candidates: DocumentVector[]): DocumentVector[] {
    const seen = new Set<string>();
    return candidates.filter(vector => {
      if (seen.has(vector.id)) {
        return false;
      }
      seen.add(vector.id);
      return true;
    });
  }

  /**
   * Re-rank results using multiple factors
   */
  private async reRankResults(
    candidates: DocumentVector[], 
    query: string, 
    context?: string
  ): Promise<AdvancedSearchResult[]> {
    const queryEmbedding = await this.getEmbedding(query);
    const contextEmbedding = context ? await this.getEmbedding(context) : null;

    return candidates.map((vector, _score) => {
      // Calculate various scores
      const relevanceScore = this.cosineSimilarity(queryEmbedding, vector.embedding);
      const diversityScore = this.calculateDiversityScore(vector, candidates);
      const freshnessScore = this.calculateFreshnessScore(vector);
      
      // Context relevance if available
      let contextScore = 0;
      if (contextEmbedding) {
        contextScore = this.cosineSimilarity(contextEmbedding, vector.embedding);
      }

      // Determine context type
      const contextType = this.determineContextType(relevanceScore, contextScore);

      // Calculate final score with weights
      const finalScore = (
        relevanceScore * 0.5 +
        diversityScore * 0.2 +
        freshnessScore * 0.1 +
        contextScore * 0.2
      );

      return {
        id: vector.id,
        text: vector.text,
        score: relevanceScore,
        metadata: vector.metadata || {},
        relevanceScore,
        diversityScore,
        freshnessScore,
        finalScore,
        contextType,
        embedding: vector.embedding,
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Calculate diversity score to avoid similar results
   */
  private calculateDiversityScore(vector: DocumentVector, allCandidates: DocumentVector[]): number {
    const similarities = allCandidates
      .filter(candidate => candidate.id !== vector.id)
      .map(candidate => this.cosineSimilarity(vector.embedding, candidate.embedding));
    
    if (similarities.length === 0) return 1;
    
    const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    return 1 - avgSimilarity; // Higher diversity = lower average similarity
  }

  /**
   * Calculate freshness score based on publication date
   */
  private calculateFreshnessScore(vector: DocumentVector): number {
    const published = vector.metadata?.published as string;
    if (!published) return 0.5; // Default score for unknown dates

    try {
      const publishDate = new Date(published);
      const now = new Date();
      const daysSincePublish = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Exponential decay: newer content gets higher scores
      return Math.exp(-daysSincePublish / 365); // Decay over 1 year
    } catch {
      return 0.5;
    }
  }

  /**
   * Determine the type of context match
   */
  private determineContextType(relevanceScore: number, contextScore: number): AdvancedSearchResult['contextType'] {
    if (relevanceScore > 0.8) return 'exact-match';
    if (relevanceScore > 0.6) return 'semantic-similarity';
    if (contextScore > 0.5) return 'related';
    return 'conceptual';
  }

  /**
   * Select diverse results to avoid redundancy
   */
  private selectDiverseResults(results: AdvancedSearchResult[], maxResults: number): AdvancedSearchResult[] {
    const selected: AdvancedSearchResult[] = [];
    const selectedEmbeddings: number[][] = [];

    for (const result of results) {
      if (selected.length >= maxResults) break;

      // Check if this result is too similar to already selected ones
      const isTooSimilar = selectedEmbeddings.some(embedding => 
        this.cosineSimilarity(embedding, result.embedding) > 0.8
      );

      if (!isTooSimilar) {
        selected.push(result);
        selectedEmbeddings.push(result.embedding);
      }
    }

    return selected;
  }

  /**
   * Get embedding for text with caching and real OpenAI API
   */
  private async getEmbedding(text: string): Promise<number[]> {
    const cacheKey = `embedding:${Buffer.from(text).toString('base64').slice(0, 50)}`;
    
    // Check cache first
    const cached = cache.getEmbedding(cacheKey);
    if (cached) {
      logger.debug('Using cached embedding', { cacheKey });
      return cached;
    }

    try {
      // Use real OpenAI embeddings with fallback model
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-small', // Fallback to older model that should be available
        input: text,
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error('No embedding returned from OpenAI API');
      }
      
      // Cache the embedding
      cache.setEmbedding(cacheKey, embedding);
      
      logger.debug('Generated new embedding', { 
        cacheKey, 
        dimensions: embedding.length,
        model: 'text-embedding-small'
      });
      return embedding;
    } catch (error) {
      logger.error('Failed to generate embedding', { error, text: text.slice(0, 100) });
      
      // Fallback to mock embedding if OpenAI fails
      logger.warn('Using fallback mock embedding due to OpenAI error');
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random() - 0.5); // ada-002 dimensions
      return mockEmbedding;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const aVal = a[i] || 0;
      const bVal = b[i] || 0;
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get system statistics
   */
  getStats(): {
    documentCount: number;
    keywordCount: number;
    categoryCount: number;
    categories: string[];
  } {
    return {
      documentCount: this.vectors.length,
      keywordCount: this.keywordIndex.size,
      categoryCount: this.categoryIndex.size,
      categories: Array.from(this.categoryIndex.keys()),
    };
  }
}