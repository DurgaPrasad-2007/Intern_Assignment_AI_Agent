import type { Document } from '../types/index.js';
import { DocumentLoader } from '../utils/documentLoader.js';
declare const documentLoader: DocumentLoader;
/**
 * Load documents from the Docs directory
 * This function will be called during RAG initialization
 */
export declare function loadDocumentsFromFiles(): Promise<Document[]>;
export { documentLoader };
declare const _default: Document[];
export default _default;
//# sourceMappingURL=documents.d.ts.map