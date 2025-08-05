import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { logger } from './logger.js';
export class DocumentLoader {
    docsPath;
    chunkSize = 1000; // characters per chunk
    overlapSize = 200; // overlap between chunks
    constructor(docsPath = './Docs') {
        this.docsPath = docsPath;
    }
    /**
     * Load all markdown documents from the Docs directory
     */
    async loadDocuments() {
        try {
            const files = this.getMarkdownFiles();
            const documents = [];
            for (const file of files) {
                try {
                    const content = readFileSync(join(this.docsPath, file), 'utf-8');
                    const chunks = this.chunkDocument(content, file);
                    for (const chunk of chunks) {
                        documents.push({
                            id: chunk.id,
                            text: chunk.text,
                            metadata: chunk.metadata,
                        });
                    }
                    logger.info(`Loaded document: ${file} (${chunks.length} chunks)`);
                }
                catch (error) {
                    logger.error(`Failed to load document: ${file}`, { error });
                }
            }
            logger.info(`Total documents loaded: ${documents.length}`);
            return documents;
        }
        catch (error) {
            logger.error('Failed to load documents', { error });
            return [];
        }
    }
    /**
     * Get all markdown files from the Docs directory
     */
    getMarkdownFiles() {
        try {
            const files = readdirSync(this.docsPath);
            return files.filter(file => file.endsWith('.md'));
        }
        catch (error) {
            logger.error('Failed to read Docs directory', { error });
            return [];
        }
    }
    /**
     * Parse markdown content and extract metadata
     */
    parseMarkdownMetadata(content, filename) {
        const lines = content.split('\n');
        const title = this.extractTitle(lines);
        const author = this.extractAuthor(content);
        const published = this.extractPublishedDate(content);
        const category = this.determineCategory(filename, content);
        return {
            title: title || filename.replace('.md', ''),
            ...(author && { author }),
            ...(published && { published }),
            category,
        };
    }
    /**
     * Extract title from markdown content
     */
    extractTitle(lines) {
        for (const line of lines) {
            if (line.startsWith('# ')) {
                return line.replace('# ', '').trim();
            }
        }
        return '';
    }
    /**
     * Extract author from markdown content
     */
    extractAuthor(content) {
        const authorMatch = content.match(/\*\*Author:\*\*\s*(.+)/);
        return authorMatch?.[1]?.trim();
    }
    /**
     * Extract published date from markdown content
     */
    extractPublishedDate(content) {
        const dateMatch = content.match(/\*\*Published:\*\*\s*(.+)/);
        return dateMatch?.[1]?.trim();
    }
    /**
     * Determine document category based on filename and content
     */
    determineCategory(filename, content) {
        const lowerContent = content.toLowerCase();
        const lowerFilename = filename.toLowerCase();
        if (lowerFilename.includes('wikipedia') || lowerContent.includes('lightweight markup')) {
            return 'markdown-basics';
        }
        if (lowerFilename.includes('webex') || lowerContent.includes('llm-friendly')) {
            return 'ai-content-optimization';
        }
        if (lowerFilename.includes('nextjs') || lowerContent.includes('react-markdown')) {
            return 'technical-implementation';
        }
        if (lowerFilename.includes('john-apostol') || lowerContent.includes('custom-built')) {
            return 'blog-development';
        }
        if (lowerFilename.includes('daext') || lowerContent.includes('blogging with markdown')) {
            return 'markdown-guide';
        }
        return 'general';
    }
    /**
     * Split document into overlapping chunks for better RAG performance
     */
    chunkDocument(content, filename) {
        const metadata = this.parseMarkdownMetadata(content, filename);
        const chunks = [];
        // Remove frontmatter and headers for chunking
        const cleanContent = this.cleanContent(content);
        // Split into sentences first for better semantic boundaries
        const sentences = this.splitIntoSentences(cleanContent);
        let currentChunk = '';
        let chunkIndex = 0;
        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > this.chunkSize) {
                if (currentChunk.trim()) {
                    chunks.push({
                        id: `${filename}-chunk-${chunkIndex}`,
                        text: currentChunk.trim(),
                        metadata: {
                            ...metadata,
                            source: filename,
                            chunkIndex,
                            totalChunks: -1,
                        },
                    });
                    chunkIndex++;
                }
                currentChunk = sentence;
            }
            else {
                currentChunk += (currentChunk ? ' ' : '') + sentence;
            }
        }
        // Add the last chunk if it has content
        if (currentChunk.trim()) {
            chunks.push({
                id: `${filename}-chunk-${chunkIndex}`,
                text: currentChunk.trim(),
                metadata: {
                    ...metadata,
                    source: filename,
                    chunkIndex,
                    totalChunks: -1,
                },
            });
        }
        // Update total chunks count
        const totalChunks = chunks.length;
        chunks.forEach(chunk => {
            chunk.metadata.totalChunks = totalChunks;
        });
        return chunks;
    }
    /**
     * Clean markdown content by removing frontmatter and excessive whitespace
     */
    cleanContent(content) {
        // Remove frontmatter (content between --- markers)
        let cleaned = content.replace(/^---[\s\S]*?---\s*/m, '');
        // Remove markdown headers but keep the text
        cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
        // Remove excessive whitespace
        cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
        return cleaned.trim();
    }
    /**
     * Split text into sentences for better chunking
     */
    splitIntoSentences(text) {
        // Split on sentence endings, but be careful with abbreviations
        const sentences = text.split(/(?<=[.!?])\s+/);
        return sentences.filter(sentence => sentence.trim().length > 0);
    }
    /**
     * Get document statistics
     */
    async getDocumentStats() {
        const documents = await this.loadDocuments();
        const categories = {};
        documents.forEach(doc => {
            const category = doc.metadata?.category;
            if (category) {
                categories[category] = (categories[category] || 0) + 1;
            }
        });
        return {
            totalDocuments: new Set(documents.map(d => d.metadata?.source).filter(Boolean)).size,
            totalChunks: documents.length,
            categories,
        };
    }
}
//# sourceMappingURL=documentLoader.js.map