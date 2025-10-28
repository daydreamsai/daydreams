import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MemorySystem } from '..';
import { InMemoryKeyValueProvider, InMemoryVectorProvider, InMemoryGraphProvider } from '../providers/in-memory';

describe('MemorySystem recall weighting (salience + recency)', () => {
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

    const now = Date.now();
    // exact: base score 1.0, but old and low salience
    await memory.vector.index([
      { id: 'exact-old', content: 'foo bar', metadata: { docId: 'E', timestamp: now - 60_000, salience: 0 } },
      // startsWith: base score 0.9, but high salience and fresh
      { id: 'start-fresh', content: 'foo bar baz', metadata: { docId: 'S', timestamp: now, salience: 1 } },
    ]);
  });

  afterAll(async () => {
    await memory.close();
  });

  it('without weighting prefers exact match', async () => {
    const res = await memory.recall('foo bar', { include: { diagnostics: true, content: true, metadata: true }, limit: 10 } as any);
    expect(res[0].id).toBe('exact-old');
  });

  it('with salience and strong recency weighting prefers fresh startsWith', async () => {
    const res = await memory.recall('foo bar', {
      include: { diagnostics: true, content: true, metadata: true },
      weighting: { salience: 1, recencyHalfLifeMs: 10_000 },
      limit: 10,
    } as any);
    expect(res[0].id).toBe('start-fresh');
    expect(res[0].diagnostics).toBeDefined();
  });
});

