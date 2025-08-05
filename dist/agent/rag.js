import OpenAI from 'openai';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { cache } from '../utils/cache.js';
import { cosineSimilarity } from '../utils/cosine.js';
import { loadDocumentsFromFiles } from '../data/documents.js';
export class RAG {
    openai;
    vectors = [];
    ready;
    isInitialized = false;
    constructor() {
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey,
        });
        this.ready = this.init();
    }
    async init() {
        try {
            logger.info('Initializing RAG system...');
            // Load documents from files
            const documents = await loadDocumentsFromFiles();
            for (const doc of documents) {
                const embedding = await this.getEmbedding(doc.text);
                this.vectors.push({
                    id: doc.id,
                    text: doc.text,
                    embedding,
                    metadata: doc.metadata || {},
                });
            }
            this.isInitialized = true;
            logger.info('RAG system initialized', { documentCount: this.vectors.length });
        }
        catch (error) {
            logger.error('Failed to initialize RAG system', { error });
            throw error;
        }
    }
    async getEmbedding(text) {
        const cacheKey = `embedding:${Buffer.from(text).toString('base64').slice(0, 50)}`;
        // Check cache first
        const cached = cache.getEmbedding(cacheKey);
        if (cached) {
            logger.debug('Using cached embedding', { cacheKey });
            return cached;
        }
        try {
            const response = await this.openai.embeddings.create({
                model: config.openai.embeddingModel,
                input: text,
            });
            const embedding = response.data[0]?.embedding;
            if (!embedding) {
                throw new Error('No embedding returned from OpenAI');
            }
            // Cache the embedding
            cache.setEmbedding(cacheKey, embedding);
            logger.debug('Generated new embedding', { cacheKey, dimensions: embedding.length });
            return embedding;
        }
        catch (error) {
            logger.error('Failed to generate embedding', { error, text: text.slice(0, 100) });
            throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async query(query, k = 3) {
        await this.ready; // Ensure vectors are ready
        if (!this.isInitialized) {
            throw new Error('RAG system not initialized');
        }
        try {
            const queryEmbedding = await this.getEmbedding(query);
            const scored = this.vectors.map((vector) => ({
                id: vector.id,
                text: vector.text,
                score: cosineSimilarity(queryEmbedding, vector.embedding),
                metadata: vector.metadata || {},
            }));
            // Sort by score (highest first) and take top k
            scored.sort((a, b) => b.score - a.score);
            const results = scored.slice(0, k);
            logger.debug('RAG query completed', {
                query: query.slice(0, 100),
                resultCount: results.length,
                topScore: results[0]?.score
            });
            return results;
        }
        catch (error) {
            logger.error('RAG query failed', { error, query: query.slice(0, 100) });
            throw error;
        }
    }
    async addDocument(doc) {
        try {
            const embedding = await this.getEmbedding(doc.text);
            this.vectors.push({
                id: doc.id,
                text: doc.text,
                embedding,
                metadata: doc.metadata || {},
            });
            logger.info('Document added to RAG', { docId: doc.id });
        }
        catch (error) {
            logger.error('Failed to add document to RAG', { error, docId: doc.id });
            throw error;
        }
    }
    getDocumentCount() {
        return this.vectors.length;
    }
    getDocument(id) {
        return this.vectors.find(v => v.id === id);
    }
    removeDocument(id) {
        const index = this.vectors.findIndex(v => v.id === id);
        if (index !== -1) {
            this.vectors.splice(index, 1);
            logger.info('Document removed from RAG', { docId: id });
            return true;
        }
        return false;
    }
}
//# sourceMappingURL=rag.js.map