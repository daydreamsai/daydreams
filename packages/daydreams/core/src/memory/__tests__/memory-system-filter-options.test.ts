import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MemorySystem } from '..';
import { InMemoryKeyValueProvider, InMemoryVectorProvider, InMemoryGraphProvider } from '../providers/in-memory';

describe('MemorySystem recall filter options (contextId/userId/scope)', () => {
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

    // Index same content under different filters
    await memory.remember('filter test note', { scope: 'context', contextId: 'ctx-1', metadata: { docId: 'D-ctx1' } } as any);
    await memory.remember('filter test note', { scope: 'context', contextId: 'ctx-2', metadata: { docId: 'D-ctx2' } } as any);
    await memory.remember('filter test note', { scope: 'global', metadata: { docId: 'D-global' } } as any);
  });

  afterAll(async () => {
    await memory.close();
  });

  it('filters by contextId', async () => {
    const res1 = await memory.recall('filter test note', { contextId: 'ctx-1', include: { metadata: true }, limit: 10 } as any);
    const res2 = await memory.recall('filter test note', { contextId: 'ctx-2', include: { metadata: true }, limit: 10 } as any);
    const ids1 = new Set(res1.map(r => (r.metadata as any)?.docId));
    const ids2 = new Set(res2.map(r => (r.metadata as any)?.docId));
    expect(ids1.has('D-ctx1')).toBe(true);
    expect(ids1.has('D-ctx2')).toBe(false);
    expect(ids2.has('D-ctx2')).toBe(true);
    expect(ids2.has('D-ctx1')).toBe(false);
  });

  it('filters by scope', async () => {
    const resGlobal = await memory.recall('filter test note', { scope: 'global', include: { metadata: true }, limit: 10 } as any);
    const idsG = new Set(resGlobal.map(r => (r.metadata as any)?.docId));
    expect(idsG.has('D-global')).toBe(true);
    expect(idsG.has('D-ctx1')).toBe(false);
    expect(idsG.has('D-user2')).toBe(false);
  });
});
