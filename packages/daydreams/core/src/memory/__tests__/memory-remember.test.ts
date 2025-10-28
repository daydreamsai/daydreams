import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MemorySystem } from '..';
import { InMemoryKeyValueProvider, InMemoryVectorProvider, InMemoryGraphProvider } from '../providers/in-memory';

describe('MemorySystem remember simple string', () => {
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

  it('stores string with metadata and recalls within namespace', async () => {
    await memory.remember('hello memory', {
      scope: 'context',
      contextId: 'ctx-1',
      type: 'note',
      namespace: 'ns-hello',
      metadata: { docId: 'doc-hello', source: 'test' },
    } as any);

    const res = await memory.recall('hello memory', { namespace: 'ns-hello', include: { content: true, metadata: true }, groupBy: 'docId' } as any);
    expect(res.length).toBe(1);
    expect(res[0].content).toBeDefined();
    const md = res[0].metadata as any;
    expect(md.scope).toBe('context');
    expect(md.contextId).toBe('ctx-1');
    expect(md.type).toBe('note');
    expect(md.source).toBeDefined();
  });
});
