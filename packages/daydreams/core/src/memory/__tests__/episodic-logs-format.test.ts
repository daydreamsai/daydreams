import { describe, it, expect } from 'vitest';
import { MemorySystem } from '..';
import { InMemoryKeyValueProvider, InMemoryVectorProvider, InMemoryGraphProvider } from '../providers/in-memory';
import { EpisodicMemoryImpl, type Episode } from '../episodic-memory';

describe('EpisodicMemory logs indexing format', () => {
  it('indexes transcript-style logs with role prefixes', async () => {
    const memory = new MemorySystem({
      providers: {
        kv: new InMemoryKeyValueProvider(),
        vector: new InMemoryVectorProvider(),
        graph: new InMemoryGraphProvider(),
      },
    });
    await memory.initialize();

    const episodes = new EpisodicMemoryImpl(memory, {
      indexing: { enabled: true, contentMode: 'logs' },
    });

    const now = Date.now();
    const ep: Episode = {
      id: 'ep-logs-1',
      contextId: 'ctx-logs',
      type: 'conversation',
      summary: 'A short assistant conversation',
      timestamp: now,
      startTime: now - 2000,
      endTime: now,
      duration: 2000,
      metadata: {},
      logs: [
        { id: 'l1', ref: 'input', timestamp: now - 1500, content: 'Hello Assistant' } as any,
        { id: 'l2', ref: 'output', timestamp: now - 1200, content: 'Hi! How can I help?' } as any,
        { id: 'l3', ref: 'thought', timestamp: now - 1100, content: 'consider asking follow-up' } as any,
        { id: 'l4', ref: 'action_call', timestamp: now - 1000, name: 'remember-name' } as any,
        { id: 'l5', ref: 'action_result', timestamp: now - 900, name: 'remember-name' } as any,
      ],
      input: undefined,
      output: undefined,
      context: 'ctx-logs',
    };

    await episodes.store(ep);

    const results = await memory.vector.search({
      query: '',
      namespace: `episodes:${ep.contextId}`,
      limit: 10,
      includeContent: true,
      includeMetadata: true,
    });

    // Should contain at least one log-based document
    const logDoc = results.find(r => (r.metadata as any)?.source === 'episode_log');
    expect(logDoc).toBeTruthy();
    expect(logDoc!.content).toMatch(/User: Hello Assistant/);
    expect(logDoc!.content).toMatch(/Assistant: Hi! How can I help\?/);
    expect(logDoc!.content).toMatch(/Thought: consider asking follow-up/);
    expect(logDoc!.content).toMatch(/Action: remember-name/);
    expect(logDoc!.content).toMatch(/Result: remember-name/);
  });
});

