import type {
  SemanticMemory,
  SemanticConcept,
  Pattern,
  SearchOptions,
  Memory,
} from "./types";

export class SemanticMemoryImpl implements SemanticMemory {
  constructor(private memory: Memory) {}

  async store(concept: SemanticConcept): Promise<void> {
    if (!concept.id) {
      concept.id = `concept:${concept.type}:${Date.now()}`;
    }

    // Generate context-aware storage key
    const storageKey = concept.contextId 
      ? `semantic:${concept.contextId}:${concept.id}`
      : `semantic:global:${concept.id}`;

    // Store in KV
    await this.memory.kv.set(storageKey, concept);

    // Index for vector search with context metadata
    await this.memory.vector.index([
      {
        id: concept.id,
        content: concept.content,
        metadata: {
          type: "semantic",
          conceptType: concept.type,
          confidence: concept.confidence,
          occurrences: concept.occurrences,
          contextId: concept.contextId, // Include context for filtering
          ...concept.metadata,
        },
      },
    ]);

    await this.memory.lifecycle.emit("semantic.stored", concept);
  }

  async get(id: string, contextId?: string): Promise<SemanticConcept | null> {
    // Try context-specific first if contextId provided
    if (contextId) {
      const contextSpecific = await this.memory.kv.get<SemanticConcept>(`semantic:${contextId}:${id}`);
      if (contextSpecific) return contextSpecific;
    }
    
    // Try global
    const global = await this.memory.kv.get<SemanticConcept>(`semantic:global:${id}`);
    if (global) return global;
    
    // Fallback to old format for backward compatibility
    return this.memory.kv.get<SemanticConcept>(`semantic:${id}`);
  }

  async search(
    query: string,
    options?: SearchOptions & { contextId?: string }
  ): Promise<SemanticConcept[]> {
    // Build filter with context support
    const filter: Record<string, any> = { 
      type: "semantic", 
      ...options?.filter 
    };
    
    // Add context filter if specified
    if (options?.contextId) {
      filter.contextId = options.contextId;
    }

    const results = await this.memory.vector.search({
      query,
      filter,
      limit: options?.limit || 10,
    });

    const concepts: SemanticConcept[] = [];
    for (const result of results) {
      const concept = await this.get(result.id, options?.contextId);
      if (concept) concepts.push(concept);
    }

    // Sort by confidence if requested
    if (options?.sort === "confidence") {
      concepts.sort((a, b) => b.confidence - a.confidence);
    }

    return concepts;
  }

  async getRelevantPatterns(contextId: string): Promise<Pattern[]> {
    const contextPatterns: Pattern[] = [];
    const globalPatterns: Pattern[] = [];

    // Get context-specific patterns first
    const contextIterator = this.memory.kv.scan(`semantic:${contextId}:*`);
    let contextResult = await contextIterator.next();
    while (!contextResult.done) {
      const [key, concept] = contextResult.value;
      if (concept.type === "pattern") {
        contextPatterns.push(concept as Pattern);
      }
      contextResult = await contextIterator.next();
    }

    // Get global patterns
    const globalIterator = this.memory.kv.scan("semantic:global:*");
    let globalResult = await globalIterator.next();
    while (!globalResult.done) {
      const [key, concept] = globalResult.value;
      if (concept.type === "pattern") {
        globalPatterns.push(concept as Pattern);
      }
      globalResult = await globalIterator.next();
    }

    // Get legacy patterns for backward compatibility
    const legacyIterator = this.memory.kv.scan("semantic:pattern:*");
    let legacyResult = await legacyIterator.next();
    while (!legacyResult.done) {
      const [key, concept] = legacyResult.value;
      if (concept.type === "pattern") {
        globalPatterns.push(concept as Pattern);
      }
      legacyResult = await legacyIterator.next();
    }

    // Sort each group by success rate and occurrences
    const sortPatterns = (patterns: Pattern[]) => 
      patterns.sort((a, b) => {
        const scoreA = a.successRate * a.occurrences;
        const scoreB = b.successRate * b.occurrences;
        return scoreB - scoreA;
      });

    sortPatterns(contextPatterns);
    sortPatterns(globalPatterns);

    // Prioritize context-specific patterns, then add global patterns
    const allPatterns = [...contextPatterns, ...globalPatterns];
    
    return allPatterns.slice(0, 10);
  }

  async learnFromAction(action: any, result: any, contextId?: string): Promise<void> {
    // Extract pattern from action-result pair
    const patternId = `pattern:${action.name}:${Date.now()}`;

    const pattern: Pattern = {
      id: patternId,
      type: "pattern",
      content: `When action ${action.name} is called with similar input, expect similar result`,
      trigger: JSON.stringify(action.input),
      response: JSON.stringify(result.data),
      confidence: result.error ? 0.3 : 0.8,
      occurrences: 1,
      successRate: result.error ? 0 : 1,
      contextId, // Associate with context if provided
      examples: [
        `${action.name}(${JSON.stringify(action.input)}) => ${JSON.stringify(
          result.data
        )}`,
      ],
    };

    // Check if similar pattern exists (prefer context-specific)
    const similar = await this.findSimilarPattern(pattern, contextId);

    if (similar) {
      // Update existing pattern
      similar.occurrences++;
      similar.confidence =
        (similar.confidence * (similar.occurrences - 1) + pattern.confidence) /
        similar.occurrences;
      similar.successRate = result.error
        ? (similar.successRate * (similar.occurrences - 1)) /
          similar.occurrences
        : (similar.successRate * (similar.occurrences - 1) + 1) /
          similar.occurrences;
      similar.examples.push(pattern.examples[0]);

      await this.store(similar);
    } else {
      // Store new pattern
      await this.store(pattern);
    }
  }

  async updateConfidence(id: string, delta: number, contextId?: string): Promise<void> {
    const concept = await this.get(id, contextId);
    if (!concept) throw new Error(`Concept ${id} not found`);

    concept.confidence = Math.max(0, Math.min(1, concept.confidence + delta));
    await this.store(concept);
  }

  private async findSimilarPattern(pattern: Pattern, contextId?: string): Promise<Pattern | null> {
    const allPatterns: Pattern[] = [];
    
    // Priority 1: Look for context-specific patterns first if contextId provided
    if (contextId) {
      const contextIterator = this.memory.kv.scan(`semantic:${contextId}:*`);
      let contextResult = await contextIterator.next();
      while (!contextResult.done) {
        const [key, concept] = contextResult.value;
        if (concept.type === "pattern") {
          allPatterns.push(concept as Pattern);
        }
        contextResult = await contextIterator.next();
      }

      // Find exact trigger match in context-specific patterns
      for (const existingPattern of allPatterns) {
        if (existingPattern.trigger === pattern.trigger) {
          return existingPattern;
        }
      }
    }
    
    // Priority 2: Look in global patterns
    const globalPatterns: Pattern[] = [];
    
    const globalIterator = this.memory.kv.scan("semantic:global:*");
    let globalResult = await globalIterator.next();
    while (!globalResult.done) {
      const [key, concept] = globalResult.value;
      if (concept.type === "pattern") {
        globalPatterns.push(concept as Pattern);
      }
      globalResult = await globalIterator.next();
    }

    // Priority 3: Look in legacy patterns for backward compatibility
    const legacyIterator = this.memory.kv.scan("semantic:pattern:*");
    let legacyResult = await legacyIterator.next();
    while (!legacyResult.done) {
      const [key, concept] = legacyResult.value;
      if (concept.type === "pattern") {
        globalPatterns.push(concept as Pattern);
      }
      legacyResult = await legacyIterator.next();
    }

    // Find exact trigger match in global patterns
    for (const existingPattern of globalPatterns) {
      if (existingPattern.trigger === pattern.trigger) {
        return existingPattern;
      }
    }

    return null;
  }
}
