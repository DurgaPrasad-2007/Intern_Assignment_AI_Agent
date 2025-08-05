import type { Document } from '../types/index.js';
export interface DocumentChunk {
    id: string;
    text: string;
    metadata: {
        source: string;
        title: string;
        author?: string;
        published?: string;
        category: string;
        chunkIndex: number;
        totalChunks: number;
        section?: string;
    };
}
export declare class DocumentLoader {
    private readonly docsPath;
    private readonly chunkSize;
    private readonly overlapSize;
    constructor(docsPath?: string);
    /**
     * Load all markdown documents from the Docs directory
     */
    loadDocuments(): Promise<Document[]>;
    /**
     * Get all markdown files from the Docs directory
     */
    private getMarkdownFiles;
    /**
     * Parse markdown content and extract metadata
     */
    private parseMarkdownMetadata;
    /**
     * Extract title from markdown content
     */
    private extractTitle;
    /**
     * Extract author from markdown content
     */
    private extractAuthor;
    /**
     * Extract published date from markdown content
     */
    private extractPublishedDate;
    /**
     * Determine document category based on filename and content
     */
    private determineCategory;
    /**
     * Split document into overlapping chunks for better RAG performance
     */
    private chunkDocument;
    /**
     * Clean markdown content by removing frontmatter and excessive whitespace
     */
    private cleanContent;
    /**
     * Split text into sentences for better chunking
     */
    private splitIntoSentences;
    /**
     * Get document statistics
     */
    getDocumentStats(): Promise<{
        totalDocuments: number;
        totalChunks: number;
        categories: Record<string, number>;
    }>;
}
//# sourceMappingURL=documentLoader.d.ts.map