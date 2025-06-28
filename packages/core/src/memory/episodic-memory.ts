import type {
  EpisodicMemory,
  Episode,
  CompressedEpisode,
  Memory,
} from "./types";

export class EpisodicMemoryImpl implements EpisodicMemory {
  constructor(private memory: Memory) {}

  async store(episode: Episode): Promise<void> {
    if (!episode.id) {
      episode.id = `episode:${Date.now()}:${Math.random()}`;
    }
    if (!episode.timestamp) {
      episode.timestamp = Date.now();
    }

    // Store in KV
    await this.memory.kv.set(`episode:${episode.id}`, episode);

    // Index for vector search if there's content to index
    const content =
      episode.summary ||
      (episode.input && episode.output
        ? `Input: ${JSON.stringify(episode.input)} Output: ${JSON.stringify(
            episode.output
          )}`
        : JSON.stringify(episode));

    await this.memory.vector.index([
      {
        id: episode.id,
        content,
        metadata: {
          type: "episode",
          episodeType: episode.type,
          context: episode.context,
          timestamp: episode.timestamp,
          duration: episode.duration,
          ...episode.metadata,
        },
      },
    ]);

    await this.memory.lifecycle.emit("episode.stored", episode);
  }

  async get(id: string): Promise<Episode | null> {
    return this.memory.kv.get<Episode>(`episode:${id}`);
  }

  async findSimilar(
    contextId: string,
    content: string,
    limit: number = 5
  ): Promise<Episode[]> {
    const results = await this.memory.vector.search({
      query: content,
      filter: { type: "episode", context: contextId },
      limit,
    });

    const episodes: Episode[] = [];
    for (const result of results) {
      const episode = await this.get(result.id);
      if (episode) episodes.push(episode);
    }

    return episodes;
  }

  async getTimeline(start: Date, end: Date): Promise<Episode[]> {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const episodes: Episode[] = [];

    // This would be more efficient with a time-based index
    const iterator = this.memory.kv.scan("episode:*");
    let result = await iterator.next();
    while (!result.done) {
      const [key, episode] = result.value;
      if (episode.timestamp >= startTime && episode.timestamp <= endTime) {
        episodes.push(episode);
      }
      result = await iterator.next();
    }

    // Sort by timestamp
    episodes.sort((a, b) => a.timestamp - b.timestamp);

    return episodes;
  }

  async getByContext(contextId: string): Promise<Episode[]> {
    const results = await this.memory.vector.search({
      filter: { type: "episode", context: contextId },
      limit: 1000,
    });

    const episodes: Episode[] = [];
    for (const result of results) {
      const episode = await this.get(result.id);
      if (episode) episodes.push(episode);
    }

    // Sort by timestamp
    episodes.sort((a, b) => a.timestamp - b.timestamp);

    return episodes;
  }

  async compress(episodes: Episode[]): Promise<CompressedEpisode> {
    // This would use LLM to create a summary
    // For now, just create a simple compression
    const summary = `Compressed ${episodes.length} episodes from ${new Date(
      episodes[0].timestamp
    ).toISOString()} to ${new Date(
      episodes[episodes.length - 1].timestamp
    ).toISOString()}`;

    const compressed: CompressedEpisode = {
      id: `compression:${Date.now()}`,
      type: "compression",
      summary,
      context: episodes[0].context,
      timestamp: Date.now(),
      originalEpisodes: episodes.map((e) => e.id),
      compressionRatio: episodes.length,
      metadata: {
        originalCount: episodes.length,
        types: Array.from(new Set(episodes.map((e) => e.type))),
      },
    };

    await this.store(compressed);

    return compressed;
  }
}
