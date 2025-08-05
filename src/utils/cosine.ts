export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  const dot = a.reduce((sum, ai, idx) => sum + ai * (b[idx] || 0), 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  
  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}
