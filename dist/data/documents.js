import { DocumentLoader } from '../utils/documentLoader.js';
// Initialize document loader
const documentLoader = new DocumentLoader();
/**
 * Load documents from the Docs directory
 * This function will be called during RAG initialization
 */
export async function loadDocumentsFromFiles() {
    try {
        return await documentLoader.loadDocuments();
    }
    catch (error) {
        console.error('Failed to load documents from files:', error);
        // Fallback to static documents if file loading fails
        return getFallbackDocuments();
    }
}
/**
 * Fallback documents in case file loading fails
 */
function getFallbackDocuments() {
    return [
        {
            id: 'markdown-basics-1',
            text: 'Markdown is a lightweight markup language designed to be easy to read and write. It uses simple syntax to format text, making it popular for documentation, README files, and content creation.',
            metadata: {
                category: 'markdown-basics',
                topic: 'introduction',
                difficulty: 'beginner',
                source: 'fallback',
                title: 'Markdown Basics',
            },
        },
        {
            id: 'markdown-basics-2',
            text: 'Headers in Markdown are created using the # symbol. One # creates an H1 header, ## creates an H2 header, and so on. This provides a clear hierarchy for document structure.',
            metadata: {
                category: 'markdown-basics',
                topic: 'headers',
                difficulty: 'beginner',
                source: 'fallback',
                title: 'Markdown Headers',
            },
        },
        {
            id: 'markdown-basics-3',
            text: 'Lists in Markdown can be ordered (using numbers) or unordered (using asterisks, plus signs, or hyphens). Nested lists are created by indenting items with spaces or tabs.',
            metadata: {
                category: 'markdown-basics',
                topic: 'lists',
                difficulty: 'beginner',
                source: 'fallback',
                title: 'Markdown Lists',
            },
        },
        {
            id: 'markdown-basics-4',
            text: 'Links in Markdown are created using square brackets for the text and parentheses for the URL. Images use the same syntax but with an exclamation mark at the beginning.',
            metadata: {
                category: 'markdown-basics',
                topic: 'links-images',
                difficulty: 'beginner',
                source: 'fallback',
                title: 'Markdown Links and Images',
            },
        },
        {
            id: 'markdown-basics-5',
            text: 'Code blocks in Markdown can be inline (using backticks) or block-level (using triple backticks). Block-level code can specify the language for syntax highlighting.',
            metadata: {
                category: 'markdown-basics',
                topic: 'code',
                difficulty: 'beginner',
                source: 'fallback',
                title: 'Markdown Code Blocks',
            },
        },
    ];
}
// Export the document loader for direct access
export { documentLoader };
// Default export for backward compatibility
export default getFallbackDocuments();
//# sourceMappingURL=documents.js.map