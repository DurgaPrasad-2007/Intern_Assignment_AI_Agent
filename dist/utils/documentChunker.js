import { logger } from './logger.js';
export class DocumentChunker {
    chunkSize;
    chunkOverlap;
    minChunkSize;
    constructor(chunkSize = 1000, chunkOverlap = 200, minChunkSize = 100) {
        this.chunkSize = chunkSize;
        this.chunkOverlap = chunkOverlap;
        this.minChunkSize = minChunkSize;
    }
    /**
     * Intelligently chunk documents based on content structure
     */
    chunkDocument(document) {
        const chunks = [];
        const text = document.text;
        try {
            // Detect content type and use appropriate chunking strategy
            const contentType = this.detectContentType(text);
            let textChunks;
            switch (contentType) {
                case 'code':
                    textChunks = this.chunkCode(text);
                    break;
                case 'table':
                    textChunks = this.chunkTable(text);
                    break;
                case 'list':
                    textChunks = this.chunkList(text);
                    break;
                default:
                    textChunks = this.chunkText(text);
            }
            // Create chunk objects with metadata
            textChunks.forEach((chunkText, index) => {
                if (chunkText.length >= this.minChunkSize) {
                    const chunk = {
                        id: `${document.id}-chunk-${index}`,
                        parentDocumentId: document.id,
                        text: chunkText.trim(),
                        metadata: this.createChunkMetadata(chunkText, index, textChunks.length, contentType),
                    };
                    chunks.push(chunk);
                }
            });
            logger.debug('Document chunked successfully', {
                documentId: document.id,
                originalLength: text.length,
                chunkCount: chunks.length,
                contentType,
            });
            return chunks;
        }
        catch (error) {
            logger.error('Failed to chunk document', {
                documentId: document.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            // Fallback to simple text chunking
            return this.fallbackChunking(document);
        }
    }
    detectContentType(text) {
        // Simple heuristics for content type detection
        const codePatterns = [
            /```[\s\S]*?```/g,
            /`[^`\n]+`/g,
            /function\s+\w+\s*\(/g,
            /class\s+\w+/g,
            /import\s+.*from/g,
            /export\s+(default\s+)?/g,
        ];
        const tablePatterns = [
            /\|.*\|.*\|/g,
            /^\s*\+[-+]+\+/gm,
            /^\s*\|[-|]+\|/gm,
        ];
        const listPatterns = [
            /^\s*[-*+]\s+/gm,
            /^\s*\d+\.\s+/gm,
            /^\s*[a-zA-Z]\.\s+/gm,
        ];
        if (codePatterns.some(pattern => pattern.test(text))) {
            return 'code';
        }
        if (tablePatterns.some(pattern => pattern.test(text))) {
            return 'table';
        }
        if (listPatterns.some(pattern => pattern.test(text))) {
            return 'list';
        }
        return 'text';
    }
    chunkText(text) {
        const chunks = [];
        // First, try to split by sections (headers)
        const sections = text.split(/(?=^#{1,6}\s)/gm).filter(section => section.trim());
        if (sections.length > 1) {
            // Split by sections, then further chunk if needed
            for (const section of sections) {
                const sectionChunks = this.splitTextBySize(section);
                chunks.push(...sectionChunks);
            }
        }
        else {
            // No clear sections, split by paragraphs
            chunks.push(...this.splitTextBySize(text));
        }
        return chunks;
    }
    chunkCode(text) {
        const chunks = [];
        // Split by code blocks first
        const parts = text.split(/(```[\s\S]*?```)/g);
        let currentChunk = '';
        for (const part of parts) {
            if (part.startsWith('```')) {
                // Code block - keep intact if possible
                if (currentChunk.length + part.length > this.chunkSize && currentChunk.trim()) {
                    chunks.push(currentChunk.trim());
                    currentChunk = part;
                }
                else {
                    currentChunk += part;
                }
            }
            else {
                // Regular text - can be split
                const textChunks = this.splitTextBySize(part);
                for (const textChunk of textChunks) {
                    if (currentChunk.length + textChunk.length > this.chunkSize && currentChunk.trim()) {
                        chunks.push(currentChunk.trim());
                        currentChunk = textChunk;
                    }
                    else {
                        currentChunk += textChunk;
                    }
                }
            }
        }
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        return chunks;
    }
    chunkTable(text) {
        const chunks = [];
        // Split by table boundaries
        const lines = text.split('\n');
        let currentChunk = '';
        let inTable = false;
        for (const line of lines) {
            const isTableLine = /\|.*\|/.test(line) || /^\s*\+[-+]+\+/.test(line);
            if (isTableLine && !inTable) {
                // Starting a table
                if (currentChunk.trim()) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }
                inTable = true;
            }
            else if (!isTableLine && inTable) {
                // Ending a table
                inTable = false;
            }
            currentChunk += line + '\n';
            if (currentChunk.length > this.chunkSize && !inTable) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }
        }
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        return chunks;
    }
    chunkList(text) {
        const chunks = [];
        // Split by list items
        const listItems = text.split(/(?=^\s*[-*+]\s)|(?=^\s*\d+\.\s)/gm);
        let currentChunk = '';
        for (const item of listItems) {
            if (currentChunk.length + item.length > this.chunkSize && currentChunk.trim()) {
                chunks.push(currentChunk.trim());
                currentChunk = item;
            }
            else {
                currentChunk += item;
            }
        }
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        return chunks;
    }
    splitTextBySize(text) {
        const chunks = [];
        // Split by sentences first
        const sentences = text.split(/(?<=[.!?])\s+/);
        let currentChunk = '';
        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > this.chunkSize && currentChunk.trim()) {
                chunks.push(currentChunk.trim());
                // Add overlap
                const words = currentChunk.trim().split(/\s+/);
                const overlapWords = words.slice(-Math.floor(this.chunkOverlap / 6)); // Approximate word count
                currentChunk = overlapWords.join(' ') + ' ' + sentence;
            }
            else {
                currentChunk += (currentChunk ? ' ' : '') + sentence;
            }
        }
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        return chunks;
    }
    createChunkMetadata(text, index, totalChunks, contentType) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const headings = this.extractHeadings(text);
        const metadata = {
            chunkIndex: index,
            totalChunks,
            wordCount: words.length,
            language: this.detectLanguage(text),
            contentType,
        };
        if (headings.length > 0) {
            metadata.headings = headings;
        }
        return metadata;
    }
    extractHeadings(text) {
        const headingRegex = /^#{1,6}\s+(.+)$/gm;
        const headings = [];
        let match;
        while ((match = headingRegex.exec(text)) !== null) {
            headings.push(match[1]?.trim() || '');
        }
        return headings;
    }
    detectLanguage(text) {
        // Simple language detection based on code patterns
        const codeLanguages = {
            javascript: /(?:function|const|let|var|import|export|=>|class)/g,
            typescript: /(?:interface|type|enum|declare|namespace)/g,
            python: /(?:def|import|from|class|if __name__|print\()/g,
            java: /(?:public|private|protected|class|import java)/g,
            cpp: /(?:#include|namespace|std::|int main)/g,
        };
        for (const [language, pattern] of Object.entries(codeLanguages)) {
            if (pattern.test(text)) {
                return language;
            }
        }
        return 'text';
    }
    fallbackChunking(document) {
        const chunks = [];
        const text = document.text;
        // Simple character-based chunking as fallback
        for (let i = 0; i < text.length; i += this.chunkSize - this.chunkOverlap) {
            const chunkText = text.slice(i, i + this.chunkSize);
            if (chunkText.length >= this.minChunkSize) {
                chunks.push({
                    id: `${document.id}-fallback-${chunks.length}`,
                    parentDocumentId: document.id,
                    text: chunkText,
                    metadata: {
                        chunkIndex: chunks.length,
                        totalChunks: Math.ceil(text.length / (this.chunkSize - this.chunkOverlap)),
                        wordCount: chunkText.split(/\s+/).length,
                        contentType: 'text',
                    },
                });
            }
        }
        return chunks;
    }
    /**
     * Extract keywords from text for better searchability
     */
    extractKeywords(text, maxKeywords = 10) {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i',
            'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
            'what', 'when', 'where', 'why', 'how', 'which', 'who', 'whom', 'whose',
            'if', 'then', 'else', 'while', 'until', 'unless', 'since', 'because',
            'although', 'though', 'even', 'though', 'despite', 'however', 'therefore',
            'thus', 'hence', 'consequently', 'furthermore', 'moreover', 'additionally',
            'also', 'too', 'as', 'well', 'either', 'neither', 'not', 'no', 'yes',
            'very', 'really', 'quite', 'rather', 'somewhat', 'slightly', 'almost',
            'nearly', 'just', 'only', 'merely', 'simply', 'exactly', 'precisely',
        ]);
        // Enhanced text preprocessing
        const processedText = text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        const words = processedText
            .split(/\s+/)
            .filter((word) => {
            // Filter out stop words, short words, numbers, and ensure word is string
            return typeof word === 'string' &&
                word.length > 2 &&
                !stopWords.has(word) &&
                !/^\d+$/.test(word) &&
                !/^[a-z]$/.test(word); // Single letters
        });
        // Count word frequencies with position weighting
        const wordCount = new Map();
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (!word)
                continue; // Skip undefined/null values
            if (!wordCount.has(word)) {
                wordCount.set(word, { count: 0, positions: [] });
            }
            const entry = wordCount.get(word);
            entry.count++;
            entry.positions.push(i);
        }
        // Calculate weighted scores (position + frequency)
        const wordScores = Array.from(wordCount.entries()).map(([word, data]) => {
            const frequencyScore = data.count;
            const positionScore = data.positions.reduce((sum, pos) => {
                // Earlier positions get higher scores
                return sum + (1 / (pos + 1));
            }, 0);
            return {
                word,
                score: frequencyScore + positionScore * 0.1
            };
        });
        // Return top keywords sorted by weighted score
        return wordScores
            .sort((a, b) => b.score - a.score)
            .slice(0, maxKeywords)
            .map(item => item.word);
    }
    /**
     * Generate document summary for better context understanding
     */
    generateSummary(text, maxLength = 200) {
        // Simple extractive summarization
        const sentences = text
            .replace(/([.!?])\s+/g, '$1|')
            .split('|')
            .filter(sentence => sentence.trim().length > 10);
        if (sentences.length <= 2) {
            return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
        }
        // Score sentences based on word frequency and position
        const wordFreq = new Map();
        const allWordsMatch = text.toLowerCase().match(/\b\w+\b/g);
        const allWords = allWordsMatch || [];
        allWords.forEach(word => {
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        });
        const sentenceScores = sentences.map((sentence, index) => {
            const wordsMatch = sentence.toLowerCase().match(/\b\w+\b/g);
            const words = wordsMatch || [];
            const score = words.reduce((sum, word) => sum + (wordFreq.get(word) || 0), 0);
            // Bonus for first few sentences
            const positionBonus = Math.max(0, 3 - index) * 0.5;
            return { sentence, score: score + positionBonus };
        });
        // Select top sentences
        const topSentences = sentenceScores
            .sort((a, b) => b.score - a.score)
            .slice(0, Math.ceil(sentences.length * 0.3))
            .sort((a, b) => {
            const aIndex = sentences.indexOf(a.sentence);
            const bIndex = sentences.indexOf(b.sentence);
            return aIndex - bIndex;
        });
        const summary = topSentences.map(item => item.sentence).join(' ');
        return summary.length > maxLength ? summary.slice(0, maxLength) + '...' : summary;
    }
}
//# sourceMappingURL=documentChunker.js.map