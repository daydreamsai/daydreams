import { describe, it, expect } from 'vitest';
import { ExportManager, JSONExporter, type Episode } from '..';

describe('ExportManager invalid format', () => {
  it('returns an error when format is not supported', async () => {
    const em = new ExportManager();
    em.registerExporter(new JSONExporter());

    const ep: Episode = {
      id: 'e1', contextId: 'c', type: 'conversation', summary: 's', logs: [], metadata: {}, timestamp: Date.now(), startTime: Date.now()-1, endTime: Date.now(), duration: 1,
    };

    const res = await em.export({ episodes: [ep], exporter: 'json', format: 'invalid' });
    expect(res.success).toBe(false);
    expect(res.error?.message).toContain("Format 'invalid' not supported");
  });
});

