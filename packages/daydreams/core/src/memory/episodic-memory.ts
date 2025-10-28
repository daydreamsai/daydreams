import type { AnyRef, AnyAgent, ContextState } from "../types";
import type { Memory, EpisodeHooks } from "./types";

export interface Episode {
  id: string;
  contextId: string;
  type: string;
  summary: string;
  logs: AnyRef[];
  metadata: Record<string, any>;
  timestamp: number;
  startTime: number;
  endTime: number;
  duration?: number;
  input?: any;
  output?: any;
  context?: string;
}

export interface EpisodicMemoryOptions {
  /** Indexing policy for episode vectors */
  indexing?: {
    /** Enable indexing of episode summaries into vector memory (default: true) */
    enabled?: boolean;
    /**
     * What textual content should be embedded for vector search
     * - 'summary' (default): index only the episode.summary as the document content
     * - 'logs': index concatenated conversation logs (optionally chunked)
     * - 'summary+logs': index both the summary and the logs
     */
    contentMode?: "summary" | "logs" | "summary+logs";
    /** Optional naive chunking for logs content */
    chunk?: { size?: number; overlap?: number };
    /** Provide additional aggregate namespaces to dual-index into (e.g., org/global) */
    aggregateNamespaces?: (episode: Episode) => string[];
    /** Compute a salience score to store in metadata (0-1) */
    salience?: (episode: Episode) => number;
    /** Tags provider for metadata */
    tags?: (episode: Episode) => string[];
  };
  /** Maximum number of episodes to keep per context */
  maxEpisodesPerContext?: number;
  /** Minimum time between episodes (ms) */
  minEpisodeGap?: number;
  /** Custom episode detection hooks */
  hooks?: EpisodeHooks;
}

/**
 * Episodic Memory - manages conversational episodes and experiences
 */
export interface EpisodicMemory {
  /** Store an episode */
  store(episode: Episode): Promise<string>;

  /** Find episodes similar to a query */
  findSimilar(
    contextId: string,
    query: string,
    limit?: number
  ): Promise<Episode[]>;

  /** Get episode by ID */
  get(episodeId: string): Promise<Episode | null>;

  /** Get all episodes for a context */
  getByContext(contextId: string, limit?: number): Promise<Episode[]>;

  /** Create episode from logs */
  createFromLogs(
    contextId: string,
    logs: AnyRef[],
    contextState: ContextState,
    agent: AnyAgent
  ): Promise<Episode>;

  /** Delete episode */
  delete(episodeId: string): Promise<boolean>;

  /** Clear all episodes for a context */
  clearContext(contextId: string): Promise<void>;
}

export class EpisodicMemoryImpl implements EpisodicMemory {
  private currentEpisodeLogs: Map<string, AnyRef[]> = new Map();
  private lastEpisodeTime: Map<string, number> = new Map();

  constructor(
    private memory: Memory,
    private options: EpisodicMemoryOptions = {}
  ) {}

  async store(episode: Episode): Promise<string> {
    // Store episode data in KV store
    const episodeKey = `episode:${episode.id}`;
    await this.memory.kv.set(episodeKey, episode);

    // Index episode content for vector search (episode-first policy)
    const indexingEnabled = this.options.indexing?.enabled !== false;
    if (indexingEnabled) {
      const baseNamespace = `episodes:${episode.contextId}`;
      const tags =
        this.options.indexing?.tags?.(episode) ||
        (episode.metadata?.tags as string[] | undefined) ||
        [];
      const salience =
        typeof this.options.indexing?.salience === "function"
          ? this.options.indexing!.salience(episode)
          : undefined;

      const metadata = {
        contextId: episode.contextId,
        episodeId: episode.id,
        type: "episode",
        timestamp: episode.timestamp,
        startTime: episode.startTime,
        endTime: episode.endTime,
        duration: episode.duration,
        summary: episode.summary,
        tags,
        salience,
        source: "episode",
        ...episode.metadata,
      } as Record<string, any>;

      const mode = this.options.indexing?.contentMode ?? "summary+logs";

      // Primary index per-context
      const rr = (this.memory as Memory).rememberRecord as
        | ((rec: any, opts?: any) => Promise<any>)
        | undefined;
      const indexOne = async (rec: any) => {
        if (typeof rr === "function") {
          await (this.memory as Memory).rememberRecord(rec, { upsert: true });
        } else {
          await this.memory.vector.index([
            {
              id: rec.id,
              content: rec.text,
              metadata: rec.metadata,
              namespace: rec.namespace,
            },
          ]);
        }
      };

      if ((mode === "summary" || mode === "summary+logs") && episode.summary) {
        await indexOne({
          id: episode.id,
          text: episode.summary,
          namespace: baseNamespace,
          metadata,
        });
      }

      if (mode === "logs" || mode === "summary+logs") {
        const logsText = this.logsToText(episode.logs);
        const chunkSize = this.options.indexing?.chunk?.size ?? 1200;
        const overlap = this.options.indexing?.chunk?.overlap ?? 200;
        if (logsText && logsText.trim() !== "") {
          if (chunkSize > 0 && logsText.length > chunkSize) {
            let start = 0;
            let part = 0;
            const total = Math.ceil(
              (logsText.length - overlap) / Math.max(1, chunkSize - overlap)
            );
            while (start < logsText.length) {
              const end = Math.min(logsText.length, start + chunkSize);
              const chunkText = logsText.slice(start, end);
              await indexOne({
                id: `${episode.id}::log-${part}`,
                text: chunkText,
                namespace: baseNamespace,
                metadata: {
                  ...metadata,
                  source: "episode_log",
                  partIndex: part,
                  totalParts: total,
                },
              });
              if (end >= logsText.length) break;
              start = Math.max(0, end - overlap);
              part++;
            }
          } else {
            await indexOne({
              id: `${episode.id}::log`,
              text: logsText,
              namespace: baseNamespace,
              metadata: { ...metadata, source: "episode_log" },
            });
          }
        }
      }

      // Aggregate namespaces (e.g., org/global)
      const aggregates =
        this.options.indexing?.aggregateNamespaces?.(episode) || [];
      for (const ns of aggregates) {
        if (
          (mode === "summary" || mode === "summary+logs") &&
          episode.summary
        ) {
          await indexOne({
            id: episode.id,
            text: episode.summary,
            namespace: ns,
            metadata,
          });
        }
        if (mode === "logs" || mode === "summary+logs") {
          const logsText = this.logsToText(episode.logs);
          if (logsText && logsText.trim() !== "") {
            await indexOne({
              id: `${episode.id}::log`,
              text: logsText,
              namespace: ns,
              metadata: { ...metadata, source: "episode_log" },
            });
          }
        }
      }
    }

    // Maintain context episode list
    const contextEpisodesKey = `episodes:context:${episode.contextId}`;
    const existingEpisodes =
      (await this.memory.kv.get<string[]>(contextEpisodesKey)) || [];
    existingEpisodes.push(episode.id);

    // Limit episodes per context
    const maxEpisodes = this.options.maxEpisodesPerContext || 100;
    if (existingEpisodes.length > maxEpisodes) {
      // Remove oldest episodes
      const toRemove = existingEpisodes.splice(
        0,
        existingEpisodes.length - maxEpisodes
      );
      for (const episodeId of toRemove) {
        await this.delete(episodeId);
      }
    }

    await this.memory.kv.set(contextEpisodesKey, existingEpisodes);
    return episode.id;
  }

  private logsToText(logs: AnyRef[]): string {
    const lines: string[] = [];
    for (const l of logs) {
      if (l.ref === "input") {
        const text = extractText(
          (l as any).content ??
            (l as any).data?.content ??
            (l as any).data ??
            ""
        );
        if (text) lines.push(`User: ${text}`);
      } else if (l.ref === "output") {
        const text = extractText(
          (l as any).content ??
            (l as any).data?.content ??
            (l as any).data ??
            ""
        );
        if (text) lines.push(`Assistant: ${text}`);
      } else if (l.ref === "thought") {
        const text = extractText((l as any).content ?? "");
        if (text) lines.push(`Thought: ${text}`);
      } else if (l.ref === "action_call") {
        const name = (l as any).name ?? "action";
        lines.push(`Action: ${String(name)}`);
      } else if (l.ref === "action_result") {
        const name = (l as any).name ?? "result";
        lines.push(`Result: ${String(name)}`);
      }
    }
    return lines.join("\n");
  }

  async findSimilar(
    contextId: string,
    query: string,
    limit: number = 5
  ): Promise<Episode[]> {
    // Search episodes using vector similarity
    const results = await this.memory.vector.search({
      query,
      namespace: `episodes:${contextId}`,
      limit,
      includeContent: true,
      includeMetadata: true,
    });

    // Fetch full episode data
    const episodes: Episode[] = [];
    for (const result of results) {
      const episode = await this.get(result.id);
      if (episode) {
        episodes.push(episode);
      }
    }

    return episodes;
  }

  async get(episodeId: string): Promise<Episode | null> {
    const episodeKey = `episode:${episodeId}`;
    return await this.memory.kv.get<Episode>(episodeKey);
  }

  async getByContext(
    contextId: string,
    limit: number = 20
  ): Promise<Episode[]> {
    const contextEpisodesKey = `episodes:context:${contextId}`;
    const episodeIds =
      (await this.memory.kv.get<string[]>(contextEpisodesKey)) || [];

    // Get most recent episodes
    const recentIds = episodeIds.slice(-limit);
    const episodes: Episode[] = [];

    for (const episodeId of recentIds) {
      const episode = await this.get(episodeId);
      if (episode) {
        episodes.push(episode);
      }
    }

    return episodes.sort((a, b) => b.timestamp - a.timestamp);
  }

  async createFromLogs(
    contextId: string,
    logs: AnyRef[],
    contextState: ContextState,
    agent: AnyAgent
  ): Promise<Episode> {
    const now = Date.now();
    const episodeId = `${contextId}-${now}-${Math.random()
      .toString(36)
      .slice(2)}`;

    // Use hooks for custom episode creation if provided
    let episodeData: any = logs;
    let episodeType = "conversation";
    let metadata: Record<string, any> = {};

    if (this.options.hooks?.createEpisode) {
      episodeData = await this.options.hooks.createEpisode(
        logs,
        contextState,
        agent
      );
    }

    if (this.options.hooks?.classifyEpisode) {
      episodeType = this.options.hooks.classifyEpisode(
        episodeData,
        contextState
      );
    }

    if (this.options.hooks?.extractMetadata) {
      metadata = this.options.hooks.extractMetadata(
        episodeData,
        logs,
        contextState
      );
    }

    // Generate episode summary
    const summary = this.generateSummary(logs);

    const episode: Episode = {
      id: episodeId,
      contextId,
      type: episodeType,
      summary,
      logs: logs,
      metadata,
      timestamp: now,
      startTime: logs[0]?.timestamp || now,
      endTime: logs[logs.length - 1]?.timestamp || now,
    };

    await this.store(episode);
    return episode;
  }
  async delete(episodeId: string): Promise<boolean> {
    const episode = await this.get(episodeId);
    if (!episode) return false;

    // Delete from KV store
    const episodeKey = `episode:${episodeId}`;
    await this.memory.kv.delete(episodeKey);

    // Delete from vector index
    await this.memory.vector.delete([episodeId]);

    // Remove from context episode list
    const contextEpisodesKey = `episodes:context:${episode.contextId}`;
    const episodeIds =
      (await this.memory.kv.get<string[]>(contextEpisodesKey)) || [];
    const updatedIds = episodeIds.filter((id) => id !== episodeId);
    await this.memory.kv.set(contextEpisodesKey, updatedIds);

    return true;
  }

  async clearContext(contextId: string): Promise<void> {
    const contextEpisodesKey = `episodes:context:${contextId}`;
    const episodeIds =
      (await this.memory.kv.get<string[]>(contextEpisodesKey)) || [];

    // Delete all episodes for this context
    await Promise.all(episodeIds.map((id) => this.delete(id)));

    // Clear the context episode list
    await this.memory.kv.delete(contextEpisodesKey);
  }

  /**
   * Check if a new episode should be started
   */
  async shouldStartEpisode(
    ref: AnyRef,
    contextId: string,
    contextState: ContextState,
    agent: AnyAgent
  ): Promise<boolean> {
    if (this.options.hooks?.shouldStartEpisode) {
      const workingMemory = await this.memory.working.get(contextId);
      return this.options.hooks.shouldStartEpisode(
        ref,
        workingMemory,
        contextState,
        agent
      );
    }

    // Default: Start episode on first input or after gap
    const lastTime = this.lastEpisodeTime.get(contextId) || 0;
    const minGap = this.options.minEpisodeGap || 300000; // 5 minutes default

    return ref.ref === "input" && Date.now() - lastTime > minGap;
  }

  /**
   * Check if the current episode should be ended
   */
  async shouldEndEpisode(
    ref: AnyRef,
    contextId: string,
    contextState: ContextState,
    agent: AnyAgent
  ): Promise<boolean> {
    if (this.options.hooks?.shouldEndEpisode) {
      const workingMemory = await this.memory.working.get(contextId);
      return this.options.hooks.shouldEndEpisode(
        ref,
        workingMemory,
        contextState,
        agent
      );
    }

    // Default: End episode when significant interaction occurs
    const logs = this.currentEpisodeLogs.get(contextId) || [];
    return (
      logs.length > 0 && (ref.ref === "output" || ref.ref === "action_result")
    );
  }

  /**
   * Add log to current episode
   */
  addToCurrentEpisode(contextId: string, ref: AnyRef): void {
    if (!this.currentEpisodeLogs.has(contextId)) {
      this.currentEpisodeLogs.set(contextId, []);
    }
    this.currentEpisodeLogs.get(contextId)!.push(ref);
  }

  /**
   * Finalize current episode
   */
  async finalizeCurrentEpisode(
    contextId: string,
    contextState: ContextState,
    agent: AnyAgent
  ): Promise<Episode | null> {
    const logs = this.currentEpisodeLogs.get(contextId);
    if (!logs || logs.length === 0) return null;

    const episode = await this.createFromLogs(
      contextId,
      logs,
      contextState,
      agent
    );

    // Clear current episode logs
    this.currentEpisodeLogs.set(contextId, []);
    this.lastEpisodeTime.set(contextId, Date.now());

    return episode;
  }

  private generateSummary(logs: AnyRef[]): string {
    // Simple summary generation - can be enhanced with LLM later
    const inputs = logs.filter((log) => log.ref === "input");
    const outputs = logs.filter((log) => log.ref === "output");
    const actions = logs.filter((log) => log.ref === "action_call");

    const parts: string[] = [];

    if (inputs.length > 0) {
      const firstInput = inputs[0] as any;
      parts.push(
        `User: ${
          typeof firstInput.content === "string"
            ? firstInput.content
            : JSON.stringify(firstInput.content)
        }`
      );
    }

    if (actions.length > 0) {
      const actionNames = actions.map((a: any) => a.name).join(", ");
      parts.push(`Actions: ${actionNames}`);
    }

    if (outputs.length > 0) {
      const lastOutput = outputs[outputs.length - 1] as any;
      parts.push(
        `Assistant: ${
          typeof lastOutput.content === "string"
            ? lastOutput.content
            : JSON.stringify(lastOutput.content)
        }`
      );
    }

    return parts.join(" | ");
  }
}

function extractText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") {
    const s = value.trim();
    if (
      (s.startsWith("{") && s.endsWith("}")) ||
      (s.startsWith("[") && s.endsWith("]"))
    ) {
      try {
        const obj = JSON.parse(s);
        const t = pickTextField(obj);
        if (t) return t;
      } catch {}
    }
    return s;
  }
  if (typeof value === "object") {
    const t = pickTextField(value as any);
    if (t) return t;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function pickTextField(obj: any): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of ["content", "text", "message", "value"]) {
    if (typeof obj[k] === "string") return obj[k] as string;
  }
  return undefined;
}
