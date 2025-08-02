import { describe, it, expect, beforeEach } from 'vitest';
import { ExportManager } from '../export-manager';
import { JSONExporter } from '../json-exporter';
import { MarkdownExporter } from '../markdown-exporter';
import type { Episode } from '../../types';

describe('ExportManager', () => {
  let exportManager: ExportManager;
  let sampleEpisode: Episode;

  beforeEach(() => {
    exportManager = new ExportManager();
    exportManager.registerExporter(new JSONExporter());
    exportManager.registerExporter(new MarkdownExporter());

    sampleEpisode = {
      id: 'test-episode-1',
      type: 'conversation',
      input: { content: 'Hello, how are you?' },
      output: { content: 'I am doing well, thank you!' },
      context: 'test-context',
      timestamp: Date.now(),
      duration: 1000,
      metadata: {
        user: 'test-user',
        session: 'test-session',
      },
    };
  });

  describe('registerExporter', () => {
    it('should register exporters and list them', () => {
      const exporters = exportManager.listExporters();
      expect(exporters).toHaveLength(2);
      expect(exporters.find(e => e.name === 'json')).toBeDefined();
      expect(exporters.find(e => e.name === 'markdown')).toBeDefined();
    });
  });

  describe('export', () => {
    it('should export single episode to JSON', async () => {
      const result = await exportManager.export({
        episodes: [sampleEpisode],
        exporter: 'json',
      });

      expect(result.success).toBe(true);
      expect(result.format).toBe('json');
      expect(result.metadata?.content).toBeDefined();
      
      const parsed = JSON.parse(result.metadata!.content);
      expect(parsed.id).toBe(sampleEpisode.id);
    });

    it('should export multiple episodes to JSON', async () => {
      const episodes = [
        sampleEpisode,
        { ...sampleEpisode, id: 'test-episode-2' },
      ];

      const result = await exportManager.export({
        episodes,
        exporter: 'json',
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.episodeCount).toBe(2);
      
      const parsed = JSON.parse(result.metadata!.content);
      expect(parsed).toHaveLength(2);
    });

    it('should export to JSONL format', async () => {
      const episodes = [
        sampleEpisode,
        { ...sampleEpisode, id: 'test-episode-2' },
      ];

      const result = await exportManager.export({
        episodes,
        exporter: 'json',
        options: { format: 'jsonl' },
      });

      expect(result.success).toBe(true);
      expect(result.format).toBe('jsonl');
      
      const lines = result.metadata!.content.split('\n');
      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0]).id).toBe('test-episode-1');
      expect(JSON.parse(lines[1]).id).toBe('test-episode-2');
    });

    it('should export to Markdown', async () => {
      const result = await exportManager.export({
        episodes: [sampleEpisode],
        exporter: 'markdown',
      });

      expect(result.success).toBe(true);
      expect(result.format).toBe('md');
      
      const content = result.metadata!.content;
      expect(content).toContain('# Episode: test-episode-1');
      expect(content).toContain('**Type**: conversation');
      expect(content).toContain('Hello, how are you?');
      expect(content).toContain('I am doing well, thank you!');
    });

    it('should handle exporter not found', async () => {
      const result = await exportManager.export({
        episodes: [sampleEpisode],
        exporter: 'non-existent',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Exporter 'non-existent' not found");
    });

    it('should handle invalid format', async () => {
      const result = await exportManager.export({
        episodes: [sampleEpisode],
        exporter: 'json',
        format: 'invalid',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Format 'invalid' not supported");
    });
  });

  describe('transform', () => {
    it('should apply field filtering', async () => {
      const result = await exportManager.export({
        episodes: [sampleEpisode],
        exporter: 'json',
        transform: {
          fields: {
            include: ['id', 'type', 'timestamp'],
          },
        },
      });

      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.metadata!.content);
      expect(parsed).toHaveProperty('id');
      expect(parsed).toHaveProperty('type');
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).not.toHaveProperty('input');
      expect(parsed).not.toHaveProperty('output');
    });

    it('should apply sanitization', async () => {
      const result = await exportManager.export({
        episodes: [sampleEpisode],
        exporter: 'json',
        transform: {
          sanitize: (episode) => ({
            ...episode,
            metadata: { sanitized: true },
          }),
        },
      });

      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.metadata!.content);
      expect(parsed.metadata).toEqual({ sanitized: true });
    });

    it('should apply sorting', async () => {
      const episodes = [
        { ...sampleEpisode, id: '3', timestamp: 3000 },
        { ...sampleEpisode, id: '1', timestamp: 1000 },
        { ...sampleEpisode, id: '2', timestamp: 2000 },
      ];

      const result = await exportManager.export({
        episodes,
        exporter: 'json',
        transform: {
          sortBy: 'timestamp',
          sortOrder: 'asc',
        },
      });

      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.metadata!.content);
      expect(parsed[0].id).toBe('1');
      expect(parsed[1].id).toBe('2');
      expect(parsed[2].id).toBe('3');
    });
  });
});