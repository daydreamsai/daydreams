import { describe, it } from 'vitest';
import { createChromaVectorProvider } from '../providers';
// Import contract test utilities from core source (internal to monorepo)
import { contractTestVectorProvider } from '../../../core/src/memory/testing/provider-contracts';

// This suite requires a running ChromaDB server.
// Set CHROMA_URL (e.g., http://localhost:8000) to enable.
const CHROMA_URL = process.env.CHROMA_URL || process.env.CHROMA_PATH;

if (!CHROMA_URL) {
  describe.skip('Chroma VectorProvider contract (requires CHROMA_URL)', () => {
    it('skipped: set CHROMA_URL to run against a ChromaDB instance', () => {});
  });
} else {
  contractTestVectorProvider('ChromaVectorProvider', () =>
    createChromaVectorProvider({ path: CHROMA_URL })
  );
}

