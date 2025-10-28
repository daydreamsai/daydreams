import { describe, it, expect } from 'vitest';
import { ExportManager, JSONExporter } from '..';

describe('ExportManager unregisterExporter', () => {
  it('removes exporter and subsequent exports fail', async () => {
    const em = new ExportManager();
    em.registerExporter(new JSONExporter());

    // Confirm registered
    expect(em.listExporters().some(e => e.name === 'json')).toBe(true);

    // Unregister and confirm removal
    em.unregisterExporter('json');
    expect(em.listExporters().some(e => e.name === 'json')).toBe(false);

    // Attempt export should fail with not found
    const res = await em.export({ episodes: [], exporter: 'json' });
    expect(res.success).toBe(false);
    expect(res.error?.message).toContain("Exporter 'json' not found");
  });
});

