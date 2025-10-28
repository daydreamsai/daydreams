import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type {
  KeyValueProvider,
  VectorProvider,
  GraphProvider,
  VectorDocument,
} from '../types';

export type ProviderFactory<T> = () => T;

// ---------------------------------------------------------------------------
// KeyValueProvider contract
// ---------------------------------------------------------------------------
/**
 * Runs a shared contract test suite against a KeyValueProvider implementation.
 * Call from your package test with a factory that returns a fresh provider instance.
 */
export function contractTestKeyValueProvider(
  name: string,
  createProvider: ProviderFactory<KeyValueProvider>
) {
  describe(`KeyValueProvider contract: ${name}`, () => {
    let provider: KeyValueProvider;

    beforeAll(async () => {
      provider = createProvider();
      await provider.initialize();
      const health = await provider.health();
      expect(health.status).toBeDefined();
    });

    afterAll(async () => {
      await provider.close();
    });

    it('sets, gets, exists, deletes', async () => {
      await provider.set('a', { v: 1 });
      expect(await provider.exists('a')).toBe(true);
      expect(await provider.get<any>('a')).toEqual({ v: 1 });
      expect(await provider.delete('a')).toBe(true);
      expect(await provider.exists('a')).toBe(false);
      expect(await provider.get<any>('a')).toBeNull();
    });

    it('respects ifNotExists option', async () => {
      await provider.set('unique', 1);
      await expect(provider.set('unique', 2, { ifNotExists: true })).rejects.toBeTruthy();
      expect(await provider.get<number>('unique')).toBe(1);
    });

    it('keys, count, and scan support', async () => {
      await provider.set('k:1', 1);
      await provider.set('k:2', 2);
      await provider.set('x:3', 3);
      const keys = await provider.keys('k:*');
      expect(new Set(keys)).toEqual(new Set(['k:1', 'k:2']));
      expect(await provider.count('k:*')).toBe(2);

      const seen = new Map<string, unknown>();
      const iterator = provider.scan('k:*');
      // Manually consume AsyncIterator (interface returns AsyncIterator, not AsyncIterable)
      let res = await iterator.next();
      while (!res.done) {
        const [key, value] = res.value;
        seen.set(key, value);
        res = await iterator.next();
      }
      expect(seen.size).toBe(2);
      expect(seen.get('k:1')).toBe(1);
      expect(seen.get('k:2')).toBe(2);
    });

    it('batch operations work', async () => {
      const batch = new Map<string, number>([
        ['b:1', 10],
        ['b:2', 20],
        ['b:3', 30],
      ]);
      await provider.setBatch(batch);

      const got = await provider.getBatch<number>(['b:1', 'b:2', 'b:3', 'b:4']);
      expect(got.get('b:1')).toBe(10);
      expect(got.get('b:2')).toBe(20);
      expect(got.get('b:3')).toBe(30);
      expect(got.has('b:4')).toBe(false);

      const deleted = await provider.deleteBatch(['b:2', 'b:3']);
      expect(deleted).toBe(2);
      expect(await provider.exists('b:2')).toBe(false);
      expect(await provider.exists('b:3')).toBe(false);
      expect(await provider.exists('b:1')).toBe(true);
    });
  });
}

// ---------------------------------------------------------------------------
// VectorProvider contract
// ---------------------------------------------------------------------------
/**
 * Runs shared contract tests for a VectorProvider.
 */
export function contractTestVectorProvider(
  name: string,
  createProvider: ProviderFactory<VectorProvider>
) {
  describe(`VectorProvider contract: ${name}`, () => {
    let provider: VectorProvider;

    beforeAll(async () => {
      provider = createProvider();
      await provider.initialize();
      const health = await provider.health();
      expect(health.status).toBeDefined();
    });

    afterAll(async () => {
      await provider.close();
    });

    it('indexes and searches by text', async () => {
      const docs: VectorDocument[] = [
        { id: 'd1', content: 'The quick brown fox', metadata: { source: 'test', docId: '1' } },
        { id: 'd2', content: 'Jumps over the lazy dog', metadata: { source: 'test', docId: '2' } },
        { id: 'd3', content: 'A different topic entirely', metadata: { source: 'alt', docId: '3' } },
      ];
      await provider.index(docs);

      const results = await provider.search({ query: 'quick brown', limit: 5, includeContent: true, includeMetadata: true });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBeDefined();
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('applies namespace and metadata filters', async () => {
      await provider.index([
        { id: 'n1', content: 'alpha in nsA', namespace: 'nsA', metadata: { tag: 'alpha' } },
        { id: 'n2', content: 'beta in nsA', namespace: 'nsA', metadata: { tag: 'beta' } },
        { id: 'n3', content: 'alpha in nsB', namespace: 'nsB', metadata: { tag: 'alpha' } },
      ]);

      const byNs = await provider.search({ query: 'alpha', namespace: 'nsA', limit: 10 });
      expect(byNs.find(r => r.id === 'n1')).toBeTruthy();
      expect(byNs.find(r => r.id === 'n3')).toBeFalsy();

      const byMeta = await provider.search({ query: 'beta', filter: { tag: 'beta' }, limit: 10 });
      expect(byMeta.find(r => r.id === 'n2')).toBeTruthy();
      expect(byMeta.find(r => r.id === 'n1')).toBeFalsy();
    });

    it('updates and deletes documents', async () => {
      await provider.index([{ id: 'upd', content: 'original text', metadata: { v: 1 } }]);
      await provider.update('upd', { content: 'updated text', metadata: { v: 2 } });
      const afterUpdate = await provider.search({ query: 'updated', limit: 5, includeContent: true, includeMetadata: true });
      expect(afterUpdate.find(r => r.id === 'upd')).toBeTruthy();

      await provider.delete(['upd']);
      const afterDelete = await provider.search({ query: 'updated', limit: 5 });
      expect(afterDelete.find(r => r.id === 'upd')).toBeFalsy();
    });

    it('counts documents per namespace', async () => {
      await provider.index([
        { id: 'c1', content: 'X', namespace: 'count' },
        { id: 'c2', content: 'Y', namespace: 'count' },
      ]);
      const total = await provider.count();
      expect(typeof total).toBe('number');
      const nsCount = await provider.count('count');
      expect(nsCount).toBeGreaterThanOrEqual(2);
    });
  });
}

// ---------------------------------------------------------------------------
// GraphProvider contract
// ---------------------------------------------------------------------------
/**
 * Runs shared contract tests for a GraphProvider.
 */
export function contractTestGraphProvider(
  name: string,
  createProvider: ProviderFactory<GraphProvider>
) {
  describe(`GraphProvider contract: ${name}`, () => {
    let provider: GraphProvider;

    beforeAll(async () => {
      provider = createProvider();
      await provider.initialize();
    });

    afterAll(async () => {
      await provider.close();
    });

    it('adds, gets, updates, and deletes nodes', async () => {
      const id = await provider.addNode({ id: '', type: 'person', properties: { name: 'Ada' } });
      const node = await provider.getNode(id);
      expect(node?.type).toBe('person');
      expect(node?.properties.name).toBe('Ada');
      await provider.updateNode(id, { properties: { name: 'Ada Lovelace' } });
      const updated = await provider.getNode(id);
      expect(updated?.properties.name).toBe('Ada Lovelace');
      const deleted = await provider.deleteNode(id);
      expect(deleted).toBe(true);
    });

    it('adds edges and queries by direction', async () => {
      const a = await provider.addNode({ id: '', type: 'person', properties: { name: 'A' } });
      const b = await provider.addNode({ id: '', type: 'person', properties: { name: 'B' } });
      const e = await provider.addEdge({ id: '', from: a, to: b, type: 'knows' });
      expect(e).toBeTruthy();
      const out = await provider.getEdges(a, 'out');
      const inc = await provider.getEdges(b, 'in');
      expect(out.find(x => x.id === e)).toBeTruthy();
      expect(inc.find(x => x.id === e)).toBeTruthy();
    });

    it('finds nodes by filter and traverses', async () => {
      const a = await provider.addNode({ id: '', type: 'person', properties: { name: 'X', level: 0 } });
      const b = await provider.addNode({ id: '', type: 'person', properties: { name: 'Y', level: 1 } });
      const c = await provider.addNode({ id: '', type: 'person', properties: { name: 'Z', level: 2 } });
      await provider.addEdge({ id: '', from: a, to: b, type: 'knows' });
      await provider.addEdge({ id: '', from: b, to: c, type: 'knows' });

      const found = await provider.findNodes({ type: 'person', properties: { level: 1 } });
      expect(found.some(n => n.properties.level === 1)).toBe(true);

      const paths = await provider.traverse({ start: a, direction: 'out', maxDepth: 2 });
      expect(paths.length).toBeGreaterThan(0);
      const sp = await provider.shortestPath(a, c);
      expect(sp?.nodes[0].id).toBe(a);
      expect(sp?.nodes[sp.nodes.length - 1].id).toBe(c);
    });
  });
}
