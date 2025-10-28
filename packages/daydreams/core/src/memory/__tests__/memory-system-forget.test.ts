import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MemorySystem } from '..';
import { InMemoryKeyValueProvider, InMemoryVectorProvider, InMemoryGraphProvider } from '../providers/in-memory';

describe('MemorySystem forget()', () => {
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

  it('deletes keys by pattern and context', async () => {
    await memory.kv.set('foo:1', { v: 1 });
    await memory.kv.set('foo:2', { v: 2 });
    await memory.kv.set('bar:ctx:abc:1', { v: 3 });
    await memory.kv.set('bar:ctx:def:1', { v: 4 });

    // forget by pattern
    await memory.forget({ pattern: 'foo:*' });
    expect(await memory.kv.exists('foo:1')).toBe(false);
    expect(await memory.kv.exists('foo:2')).toBe(false);
    expect(await memory.kv.exists('bar:ctx:abc:1')).toBe(true);

    // forget by context
    await memory.forget({ context: 'abc' } as any);
    expect(await memory.kv.exists('bar:ctx:abc:1')).toBe(false);
    expect(await memory.kv.exists('bar:ctx:def:1')).toBe(true);
  });

  it('deletes entries olderThan timestamp via scan', async () => {
    const now = Date.now();
    await memory.kv.set('ts:old', { value: 1, timestamp: now - 10000 });
    await memory.kv.set('ts:new', { value: 2, timestamp: now });

    await memory.forget({ olderThan: new Date(now - 5000) });
    expect(await memory.kv.exists('ts:old')).toBe(false);
    expect(await memory.kv.exists('ts:new')).toBe(true);
  });
});

