import type { Document, DocumentVector, SearchResult } from '../types/index.js';
export declare class RAG {
    private openai;
    private vectors;
    private ready;
    private isInitialized;
    constructor();
    private init;
    private getEmbedding;
    query(query: string, k?: number): Promise<SearchResult[]>;
    addDocument(doc: Document): Promise<void>;
    getDocumentCount(): number;
    getDocument(id: string): DocumentVector | undefined;
    removeDocument(id: string): boolean;
}
//# sourceMappingURL=rag.d.ts.map