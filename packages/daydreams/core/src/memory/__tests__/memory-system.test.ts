import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MemorySystem } from '..';
import {
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from '../providers/in-memory';

describe('MemorySystem behaviors', () => {
  let memory: MemorySystem;

  beforeAll(async () => {
    memory = new MemorySystem({
      providers: {
        kv: new InMemoryKeyValueProvider(),
        vector: new InMemoryVectorProvider(),
        graph: new InMemoryGraphProvider(),
      },
    });
    await memory.initialize();
  });

  afterAll(async () => {
    await memory.close();
  });

  it('rememberBatch chunking with overlap returns multiple ids and indexes chunks', async () => {
    const text = 'ABCDEFGHIJ'; // length 10
    const { ids } = await memory.rememberBatch(
      [
        {
          text,
          namespace: 'batch-ns',
          metadata: { docId: 'CHUNKED' },
        } as any,
      ],
      { chunk: { size: 4, overlap: 1 } }
    );

    // Expect chunks: ABCD, DEFG, GHIJ => 3 ids
    expect(ids.length).toBe(3);

    // Search all docs in namespace (empty query) should yield at least 3
    const allInNs = await memory.vector.search({ query: '', namespace: 'batch-ns', limit: 10 });
    expect(allInNs.length).toBeGreaterThanOrEqual(3);

    // Search for middle chunk content should find a chunk
    const results = await memory.vector.search({ query: 'EF', namespace: 'batch-ns', limit: 5, includeContent: true });
    expect(results.length).toBeGreaterThan(0);
  });

  it('recall dedupeBy docId collapses duplicates', async () => {
    // Index two records that will both match the query with same docId
    await memory.vector.index([
      { id: 'dup-1', content: 'lorem ipsum dolor sit amet', metadata: { docId: 'X' } },
      { id: 'dup-2', content: 'ipsum dolor extended text', metadata: { docId: 'X' } },
      { id: 'uniq-1', content: 'completely different', metadata: { docId: 'Y' } },
    ]);

    const withoutDedupe = await memory.recall('ipsum dolor', { include: { content: true, metadata: true }, dedupeBy: 'none' } as any);
    expect(withoutDedupe.length).toBeGreaterThanOrEqual(2);

    const withDedupe = await memory.recall('ipsum dolor', { include: { content: true, metadata: true }, dedupeBy: 'docId' } as any);
    // Only best result for docId X should remain; uniq-1 likely not matched by query
    const docIds = new Set(withDedupe.map(r => (r.metadata as any)?.docId));
    expect(docIds.has('X')).toBe(true);
    // Ensure no duplicates of docId X
    expect(withDedupe.filter(r => (r.metadata as any)?.docId === 'X').length).toBe(1);
  });
});
