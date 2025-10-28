import { describe, it, expect } from 'vitest';
import { handleEpisodeHooks } from '../episode-hooks';
import type { AnyRef, WorkingMemory } from '../../types';

describe('Episode hooks integration (handleEpisodeHooks)', () => {
  it('default hooks start on input and end on processed output, storing an episode', async () => {
    const now = Date.now();
    const workingMemory: WorkingMemory = {
      inputs: [],
      outputs: [],
      thoughts: [],
      calls: [],
      results: [],
      events: [],
      steps: [],
      runs: [],
    } as any;

    const inputRef: AnyRef = {
      id: 'r1',
      ref: 'input',
      timestamp: now,
      content: 'Hello',
    } as any;

    const outputRef: AnyRef = {
      id: 'r2',
      ref: 'output',
      timestamp: now + 100,
      content: 'Hi there',
      processed: true,
    } as any;

    const storedEpisodes: any[] = [];
    const agent = {
      memory: {
        episodes: {
          store: async (episode: any) => {
            storedEpisodes.push(episode);
          },
        },
      },
      logger: { debug: () => {}, warn: () => {} },
    } as any;

    const contextState = {
      id: 'ctx-ep',
      args: {},
      context: {},
    } as any;

    // Start episode on input
    await handleEpisodeHooks(workingMemory, inputRef, contextState, agent);
    // End and store episode on processed output
    await handleEpisodeHooks(workingMemory, outputRef, contextState, agent);

    expect(storedEpisodes.length).toBe(1);
    const ep = storedEpisodes[0];
    expect(ep?.contextId).toBe('ctx-ep');
    expect(ep?.type).toBe('conversation');
    expect(Array.isArray(ep?.logs) && ep.logs.length).toBeGreaterThan(0);
  });
});
