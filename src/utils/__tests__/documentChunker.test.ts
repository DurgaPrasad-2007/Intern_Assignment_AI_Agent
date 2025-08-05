import { describe, it, expect, beforeEach } from '@jest/globals';
import { DocumentChunker } from '../documentChunker.js';
import type { EnhancedDocument } from '../../types/index.js';

describe('DocumentChunker', () => {
  let chunker: DocumentChunker;

  beforeEach(() => {
    chunker = new DocumentChunker();
  });

  describe('chunkDocument', () => {
    it('should chunk a simple text document', () => {
      const doc: EnhancedDocument = {
        id: 'test-doc-1',
        text: 'This is a test document. It contains several sentences. Each sentence should be properly chunked.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const chunks = chunker.chunkDocument(doc);

      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toHaveProperty('id');
      expect(chunks[0]).toHaveProperty('text');
      expect(chunks[0]).toHaveProperty('metadata');
      expect(chunks[0].parentDocumentId).toBe(doc.id);
    });

    it('should chunk a markdown document with headers', () => {
      const doc: EnhancedDocument = {
        id: 'test-doc-2',
        text: `# Introduction
This is the introduction section.

## Features
- Feature 1
- Feature 2

## Conclusion
This is the conclusion.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const chunks = chunker.chunkDocument(doc);

      expect(chunks.length).toBeGreaterThan(0);
      // Should have chunks with headings metadata
      const chunksWithHeadings = chunks.filter(chunk => 
        chunk.metadata.headings && chunk.metadata.headings.length > 0
      );
      expect(chunksWithHeadings.length).toBeGreaterThan(0);
    });

    it('should chunk code documents', () => {
      const doc: EnhancedDocument = {
        id: 'test-doc-3',
        text: `\`\`\`javascript
function hello() {
  console.log("Hello World");
}
\`\`\`

This is some text about the code.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const chunks = chunker.chunkDocument(doc);

      expect(chunks.length).toBeGreaterThan(0);
      // Should detect code content type
      const codeChunks = chunks.filter(chunk => chunk.metadata.contentType === 'code');
      expect(codeChunks.length).toBeGreaterThan(0);
    });

    it('should handle empty documents gracefully', () => {
      const doc: EnhancedDocument = {
        id: 'test-doc-4',
        text: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const chunks = chunker.chunkDocument(doc);
      expect(chunks.length).toBe(0);
    });

    it('should create chunks with proper metadata', () => {
      const doc: EnhancedDocument = {
        id: 'test-doc-5',
        text: 'This is a test document with multiple sentences. It should create chunks with proper metadata including word count and language detection.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const chunks = chunker.chunkDocument(doc);

      chunks.forEach(chunk => {
        expect(chunk.metadata).toHaveProperty('chunkIndex');
        expect(chunk.metadata).toHaveProperty('totalChunks');
        expect(chunk.metadata).toHaveProperty('wordCount');
        expect(chunk.metadata).toHaveProperty('language');
        expect(chunk.metadata).toHaveProperty('contentType');
        expect(typeof chunk.metadata.wordCount).toBe('number');
        expect(chunk.metadata.wordCount).toBeGreaterThan(0);
      });
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords from text', () => {
      const text = 'This is a test document about artificial intelligence and machine learning. It contains important keywords like AI, ML, neural networks, and deep learning.';
      
      const keywords = chunker.extractKeywords(text);

      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.length).toBeLessThanOrEqual(10); // Default max
      
      // Should contain meaningful keywords
      const meaningfulKeywords = keywords.filter(keyword => 
        keyword.length > 3 && !['this', 'that', 'with', 'from'].includes(keyword)
      );
      expect(meaningfulKeywords.length).toBeGreaterThan(0);
    });

    it('should respect maxKeywords parameter', () => {
      const text = 'This document has many different words and concepts that could be extracted as keywords. We want to test the maximum keyword limit functionality.';
      
      const keywords = chunker.extractKeywords(text, 5);

      expect(keywords.length).toBeLessThanOrEqual(5);
    });

    it('should filter out stop words and short words', () => {
      const text = 'The a an and or but in on at to for of with by is are was were be been have has had do does did will would could should may might must can this that these those.';
      
      const keywords = chunker.extractKeywords(text);

      // Should not contain common stop words
      const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
      const containsStopWords = keywords.some(keyword => stopWords.includes(keyword));
      expect(containsStopWords).toBe(false);
    });

    it('should handle empty text', () => {
      const keywords = chunker.extractKeywords('');
      expect(keywords).toEqual([]);
    });

    it('should handle text with only stop words', () => {
      const text = 'The a an and or but in on at to for of with by.';
      const keywords = chunker.extractKeywords(text);
      expect(keywords.length).toBe(0);
    });
  });

  describe('generateSummary', () => {
    it('should generate summary from text', () => {
      const text = 'This is the first sentence. This is the second sentence. This is the third sentence. This is the fourth sentence. This is the fifth sentence.';
      
      const summary = chunker.generateSummary(text);

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary.length).toBeLessThanOrEqual(200); // Default max length
    });

    it('should respect maxLength parameter', () => {
      const text = 'This is a very long text that should be summarized to a specific length. It contains multiple sentences that can be used to test the summarization functionality. The summary should be shorter than the original text.';
      
      const summary = chunker.generateSummary(text, 50);

      expect(summary.length).toBeLessThanOrEqual(50);
    });

    it('should handle short text', () => {
      const text = 'Short text.';
      const summary = chunker.generateSummary(text);
      
      expect(summary).toBe(text);
    });

    it('should handle text with only one sentence', () => {
      const text = 'This is a single sentence that should be handled properly by the summarization function.';
      const summary = chunker.generateSummary(text);
      
      expect(summary).toBe(text);
    });

    it('should prioritize important sentences', () => {
      const text = 'This is an important sentence with key information. This is a less important sentence. This is another important sentence with valuable content. This is filler text.';
      
      const summary = chunker.generateSummary(text, 100);
      
      // Summary should contain parts of the important sentences
      expect(summary).toContain('important');
      expect(summary).toContain('key');
    });
  });

  describe('content type detection', () => {
    it('should detect code content', () => {
      const codeText = '```javascript\nfunction test() {\n  return "hello";\n}\n```';
      const doc: EnhancedDocument = {
        id: 'code-doc',
        text: codeText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const chunks = chunker.chunkDocument(doc);
      expect(chunks.some(chunk => chunk.metadata.contentType === 'code')).toBe(true);
    });

    it('should detect table content', () => {
      const tableText = '| Header 1 | Header 2 |\n|----------|----------|\n| Data 1   | Data 2   |';
      const doc: EnhancedDocument = {
        id: 'table-doc',
        text: tableText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const chunks = chunker.chunkDocument(doc);
      expect(chunks.some(chunk => chunk.metadata.contentType === 'table')).toBe(true);
    });

    it('should detect list content', () => {
      const listText = '- Item 1\n- Item 2\n- Item 3';
      const doc: EnhancedDocument = {
        id: 'list-doc',
        text: listText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const chunks = chunker.chunkDocument(doc);
      expect(chunks.some(chunk => chunk.metadata.contentType === 'list')).toBe(true);
    });
  });

  describe('language detection', () => {
    it('should detect JavaScript code', () => {
      const jsCode = 'function test() { const x = 1; return x; }';
      const doc: EnhancedDocument = {
        id: 'js-doc',
        text: jsCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const chunks = chunker.chunkDocument(doc);
      expect(chunks.some(chunk => chunk.metadata.language === 'javascript')).toBe(true);
    });

    it('should detect TypeScript code', () => {
      const tsCode = 'interface Test { name: string; } const x: Test = { name: "test" };';
      const doc: EnhancedDocument = {
        id: 'ts-doc',
        text: tsCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const chunks = chunker.chunkDocument(doc);
      expect(chunks.some(chunk => chunk.metadata.language === 'typescript')).toBe(true);
    });

    it('should default to text for regular content', () => {
      const regularText = 'This is regular text content without any code.';
      const doc: EnhancedDocument = {
        id: 'text-doc',
        text: regularText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const chunks = chunker.chunkDocument(doc);
      expect(chunks.some(chunk => chunk.metadata.language === 'text')).toBe(true);
    });
  });
}); 