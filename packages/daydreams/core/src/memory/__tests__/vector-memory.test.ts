import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MemorySystem } from '..';
import { InMemoryKeyValueProvider, InMemoryVectorProvider, InMemoryGraphProvider } from '../providers/in-memory';

describe('VectorMemoryImpl basic operations', () => {
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
      { id: 'doc1', content: 'hello world', metadata: { docId: 'D1', tag: 'alpha' } },
      { id: 'doc2', content: 'hello there world', metadata: { docId: 'D2', tag: 'beta' } },
      { id: 'doc3', content: 'namespaced alpha content', namespace: 'nsB', metadata: { docId: 'D3', tag: 'alpha' } },
    ]);
  });

  afterAll(async () => {
    await memory.close();
  });

  it('indexes and returns best exact match first', async () => {
    const results = await memory.vector.search({ query: 'hello world', limit: 5, includeContent: true, includeMetadata: true });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('doc1'); // exact match outranks partial
    expect(results[0].content).toBe('hello world');
  });

  it('applies namespace and metadata filters', async () => {
    const ns = await memory.vector.search({ query: 'alpha', namespace: 'nsB', limit: 10, includeContent: true });
    expect(ns.find(r => r.id === 'doc3')).toBeTruthy();
    expect(ns.find(r => r.id === 'doc1')).toBeFalsy();

    const byMeta = await memory.vector.search({ query: 'hello', filter: { tag: 'beta' }, limit: 10 });
    expect(byMeta.find(r => r.id === 'doc2')).toBeTruthy();
    expect(byMeta.find(r => r.id === 'doc1')).toBeFalsy();
  });

  it('deletes documents', async () => {
    await memory.vector.delete(['doc2']);
    const results = await memory.vector.search({ query: 'hello there world', limit: 5 });
    expect(results.find(r => r.id === 'doc2')).toBeFalsy();
  });
});

