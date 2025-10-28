import { describe, it, expect } from 'vitest';
import { ExportManager, JSONExporter, MarkdownExporter, type Episode } from '..';

describe('Exporters via public API', () => {
  it('exports single episode as JSON and Markdown', async () => {
    const em = new ExportManager();
    em.registerExporter(new JSONExporter());
    em.registerExporter(new MarkdownExporter());

    const ep: Episode = {
      id: 'ep-1',
      contextId: 'ctx',
      type: 'conversation',
      summary: 'Tiny summary',
      logs: [],
      metadata: {},
      timestamp: Date.now(),
      startTime: Date.now() - 10,
      endTime: Date.now(),
      duration: 10,
    };

    const json = await em.export({ episodes: [ep], exporter: 'json' });
    expect(json.success).toBe(true);
    expect(json.format).toBe('json');
    expect(() => JSON.parse(json.metadata!.content)).not.toThrow();

    const md = await em.export({ episodes: [ep], exporter: 'markdown' });
    expect(md.success).toBe(true);
    expect(md.format).toBe('md');
    expect(md.metadata!.content).toContain('# Episode: ep-1');
  });
});

