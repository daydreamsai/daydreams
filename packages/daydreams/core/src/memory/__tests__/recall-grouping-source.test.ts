import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MemorySystem } from '..';
import { InMemoryKeyValueProvider, InMemoryVectorProvider, InMemoryGraphProvider } from '../providers/in-memory';

describe('MemorySystem recall grouping by source', () => {
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

    await memory.vector.index([
      { id: 's1-exact', content: 'group test content', metadata: { source: 's1', docId: 'D1' } },
      { id: 's1-start', content: 'group test content more', metadata: { source: 's1', docId: 'D1' } },
      { id: 's2', content: 'group test other source', metadata: { source: 's2', docId: 'D2' } },
    ]);
  });

  afterAll(async () => {
    await memory.close();
  });

  it('keeps best per source', async () => {
    const res = await memory.recall('group test content', { groupBy: 'source', include: { content: true, metadata: true }, limit: 10 } as any);
    expect(res.length).toBe(2);
    const bySource = new Map(res.map(r => [(r.metadata as any)?.source, r]));
    expect(bySource.get('s1')?.id).toBe('s1-exact');
    expect(bySource.get('s2')?.id).toBe('s2');
  });
});

