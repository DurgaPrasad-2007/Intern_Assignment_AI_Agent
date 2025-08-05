import type { EnhancedDocument, DocumentChunk } from '../types/index.js';
export declare class DocumentChunker {
    private readonly chunkSize;
    private readonly chunkOverlap;
    private readonly minChunkSize;
    constructor(chunkSize?: number, chunkOverlap?: number, minChunkSize?: number);
    /**
     * Intelligently chunk documents based on content structure
     */
    chunkDocument(document: EnhancedDocument): DocumentChunk[];
    private detectContentType;
    private chunkText;
    private chunkCode;
    private chunkTable;
    private chunkList;
    private splitTextBySize;
    private createChunkMetadata;
    private extractHeadings;
    private detectLanguage;
    private fallbackChunking;
    /**
     * Extract keywords from text for better searchability
     */
    extractKeywords(text: string, maxKeywords?: number): string[];
    /**
     * Generate document summary for better context understanding
     */
    generateSummary(text: string, maxLength?: number): string;
}
//# sourceMappingURL=documentChunker.d.ts.map