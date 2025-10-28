import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MemorySystem } from '..';
import { InMemoryKeyValueProvider, InMemoryVectorProvider, InMemoryGraphProvider } from '../providers/in-memory';

describe('KeyValueMemoryImpl basic operations', () => {
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

  it('set/get/exists/delete roundtrip and unknown returns null', async () => {
    expect(await memory.kv.get('missing')).toBeNull();

    await memory.kv.set('kv:a', { n: 1 });
    expect(await memory.kv.exists('kv:a')).toBe(true);
    expect(await memory.kv.get<any>('kv:a')).toEqual({ n: 1 });
    expect(await memory.kv.delete('kv:a')).toBe(true);
    expect(await memory.kv.exists('kv:a')).toBe(false);
    expect(await memory.kv.get('kv:a')).toBeNull();
  });

  it('keys, count, and scan by pattern', async () => {
    await memory.kv.set('k:1', 1);
    await memory.kv.set('k:2', 2);
    await memory.kv.set('x:3', 3);

    const keys = await memory.kv.keys('k:*');
    expect(new Set(keys)).toEqual(new Set(['k:1', 'k:2']));
    expect(await memory.kv.count('k:*')).toBe(2);

    // Consume AsyncIterator manually (KeyValueMemory.scan returns AsyncIterator)
    const seen = new Map<string, unknown>();
    const iterator = memory.kv.scan('k:*');
    let res = await iterator.next();
    while (!res.done) {
      const [key, value] = res.value as [string, unknown];
      seen.set(key, value);
      res = await iterator.next();
    }
    expect(seen.size).toBe(2);
    expect(seen.get('k:1')).toBe(1);
    expect(seen.get('k:2')).toBe(2);
  });

  it('batch operations getBatch/setBatch/deleteBatch', async () => {
    const entries = new Map<string, number>([
      ['b:1', 10],
      ['b:2', 20],
      ['b:3', 30],
    ]);
    await memory.kv.setBatch(entries);

    const got = await memory.kv.getBatch<number>(['b:1', 'b:2', 'b:3', 'b:4']);
    expect(got.get('b:1')).toBe(10);
    expect(got.get('b:2')).toBe(20);
    expect(got.get('b:3')).toBe(30);
    expect(got.has('b:4')).toBe(false);

    const deleted = await memory.kv.deleteBatch(['b:2', 'b:3']);
    expect(deleted).toBe(2);
    expect(await memory.kv.exists('b:2')).toBe(false);
    expect(await memory.kv.exists('b:3')).toBe(false);
    expect(await memory.kv.exists('b:1')).toBe(true);
  });

  it('respects ifNotExists option', async () => {
    await memory.kv.set('unique', 1);
    await expect(memory.kv.set('unique', 2, { ifNotExists: true })).rejects.toBeTruthy();
    expect(await memory.kv.get('unique')).toBe(1);
  });
});

