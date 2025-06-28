import type {
  FactualMemory,
  Fact,
  FactVerification,
  SearchOptions,
  Memory,
} from "./types";

export class FactualMemoryImpl implements FactualMemory {
  constructor(private memory: Memory) {}

  async store(facts: Fact | Fact[]): Promise<void> {
    const factArray = Array.isArray(facts) ? facts : [facts];

    // Store each fact
    for (const fact of factArray) {
      // Validate fact
      if (!fact.id) fact.id = `fact:${Date.now()}:${Math.random()}`;
      if (!fact.timestamp) fact.timestamp = Date.now();

      // Generate context-aware storage key
      const storageKey = fact.contextId 
        ? `fact:${fact.contextId}:${fact.id}`
        : `fact:global:${fact.id}`;

      // Store in KV
      await this.memory.kv.set(storageKey, fact);

      // Index for vector search
      await this.memory.vector.index([
        {
          id: fact.id,
          content: fact.statement,
          metadata: {
            type: "fact",
            confidence: fact.confidence,
            source: fact.source,
            entities: fact.entities,
            contextId: fact.contextId,
            timestamp: fact.timestamp,
            // Flatten tags for easier filtering
            ...(fact.tags || {}),
          },
        },
      ]);

      // Add entities to graph if present
      if (fact.entities && fact.entities.length > 0) {
        for (const entityName of fact.entities) {
          await this.memory.graph.addEntity({
            id: `entity:${entityName.toLowerCase().replace(/\s+/g, "-")}`,
            type: "entity",
            name: entityName,
            properties: {
              mentionedInFacts: [fact.id],
            },
            contextIds: fact.contextId ? [fact.contextId] : [],
          });
        }
      }
    }

    await this.memory.lifecycle.emit("facts.stored", factArray);
  }

  async get(id: string, contextId?: string): Promise<Fact | null> {
    // Try context-specific first if contextId provided
    if (contextId) {
      const contextSpecific = await this.memory.kv.get<Fact>(`fact:${contextId}:${id}`);
      if (contextSpecific) return contextSpecific;
    }
    
    // Try global
    const global = await this.memory.kv.get<Fact>(`fact:global:${id}`);
    if (global) return global;
    
    // Fallback to old format for backward compatibility
    return this.memory.kv.get<Fact>(`fact:${id}`);
  }

  async search(query: string, options?: SearchOptions & { contextId?: string }): Promise<Fact[]> {
    // Build filter with context support
    const filter: Record<string, any> = { 
      type: "fact", 
      ...options?.filter 
    };
    
    // Add context filter if specified
    if (options?.contextId) {
      filter.contextId = options.contextId;
    }

    const vectorResults = await this.memory.vector.search({
      query,
      filter,
      limit: options?.limit || 20,
    });

    const facts: Fact[] = [];
    for (const result of vectorResults) {
      const fact = await this.get(result.id, options?.contextId);
      if (fact) facts.push(fact);
    }

    // Sort by confidence if requested
    if (options?.sort === "confidence") {
      facts.sort((a, b) => b.confidence - a.confidence);
    }

    return facts;
  }

  async verify(factId: string, contextId?: string): Promise<FactVerification> {
    const fact = await this.get(factId, contextId);
    if (!fact) throw new Error(`Fact ${factId} not found`);

    // Find related facts - prioritize same context
    const contextRelated = fact.contextId ? await this.memory.vector.search({
      query: fact.statement,
      filter: { type: "fact", contextId: fact.contextId },
      limit: 10,
    }) : [];

    const globalRelated = await this.memory.vector.search({
      query: fact.statement,
      filter: { type: "fact" },
      limit: 20,
    });

    // Combine with context-specific facts having higher priority
    const allRelated = [...contextRelated, ...globalRelated];
    
    // Remove duplicates and self-reference
    const uniqueRelated = allRelated.filter((result, index, array) => 
      result.id !== factId && 
      array.findIndex(r => r.id === result.id) === index
    );

    // Separate supporting and conflicting facts
    const supporting: string[] = [];
    const conflicting: string[] = [];

    for (const result of uniqueRelated) {
      // Give context-specific facts more weight in scoring
      const isContextSpecific = contextRelated.some(cr => cr.id === result.id);
      const scoreThreshold = isContextSpecific ? 0.7 : 0.8;
      const conflictThreshold = isContextSpecific ? 0.4 : 0.3;

      // Simple similarity check - in production this would use LLM
      if (result.score && result.score > scoreThreshold) {
        supporting.push(result.id);
      } else if (result.score && result.score < conflictThreshold) {
        conflicting.push(result.id);
      }
    }

    const verification: FactVerification = {
      factId,
      verified: conflicting.length === 0,
      confidence: this.calculateVerificationConfidence(
        fact,
        supporting,
        conflicting
      ),
      supportingFacts: supporting,
      conflictingFacts: conflicting,
      lastVerified: Date.now(),
    };

    // Update fact with verification using context-aware key
    fact.verification = verification;
    const storageKey = fact.contextId 
      ? `fact:${fact.contextId}:${factId}`
      : `fact:global:${factId}`;
    await this.memory.kv.set(storageKey, fact);

    return verification;
  }

  async update(id: string, updates: Partial<Fact>, contextId?: string): Promise<void> {
    const fact = await this.get(id, contextId);
    if (!fact) throw new Error(`Fact ${id} not found`);

    const updated = { ...fact, ...updates, id };
    await this.store(updated);
  }

  async delete(id: string, contextId?: string): Promise<boolean> {
    // Try to find and delete the fact using context-aware lookup
    let deleted = false;
    
    // Try context-specific first if contextId provided
    if (contextId) {
      const contextKey = `fact:${contextId}:${id}`;
      if (await this.memory.kv.exists(contextKey)) {
        await this.memory.kv.delete(contextKey);
        deleted = true;
      }
    }
    
    // Try global if not found in context
    if (!deleted) {
      const globalKey = `fact:global:${id}`;
      if (await this.memory.kv.exists(globalKey)) {
        await this.memory.kv.delete(globalKey);
        deleted = true;
      }
    }
    
    // Try legacy format for backward compatibility
    if (!deleted) {
      const legacyKey = `fact:${id}`;
      if (await this.memory.kv.exists(legacyKey)) {
        await this.memory.kv.delete(legacyKey);
        deleted = true;
      }
    }
    
    // Delete from vector index if found
    if (deleted) {
      await this.memory.vector.delete([id]);
    }

    return deleted;
  }

  async getByTag(tag: string, value: string, contextId?: string): Promise<Fact[]> {
    const contextFacts: Fact[] = [];
    const globalFacts: Fact[] = [];

    // Priority 1: Get context-specific facts if contextId provided
    if (contextId) {
      const contextIterator = this.memory.kv.scan(`fact:${contextId}:*`);
      let contextResult = await contextIterator.next();
      while (!contextResult.done) {
        const [key, fact] = contextResult.value;
        if (fact.tags && fact.tags[tag] === value) {
          contextFacts.push(fact);
        }
        contextResult = await contextIterator.next();
      }
    }

    // Priority 2: Get global facts
    const globalIterator = this.memory.kv.scan("fact:global:*");
    let globalResult = await globalIterator.next();
    while (!globalResult.done) {
      const [key, fact] = globalResult.value;
      if (fact.tags && fact.tags[tag] === value) {
        globalFacts.push(fact);
      }
      globalResult = await globalIterator.next();
    }

    // Priority 3: Get legacy facts for backward compatibility
    const legacyIterator = this.memory.kv.scan("fact:*");
    let legacyResult = await legacyIterator.next();
    while (!legacyResult.done) {
      const [key, fact] = legacyResult.value;
      // Skip context-specific and global facts we already processed
      if (!key.includes("fact:global:") && !key.includes(":fact:") && 
          fact.tags && fact.tags[tag] === value) {
        globalFacts.push(fact);
      }
      legacyResult = await legacyIterator.next();
    }

    // Prioritize context-specific facts, then add global facts
    return [...contextFacts, ...globalFacts];
  }

  async getByContext(contextId: string): Promise<Fact[]> {
    const results = await this.memory.vector.search({
      filter: { type: "fact", contextId },
      limit: 1000,
    });

    const facts: Fact[] = [];
    for (const result of results) {
      const fact = await this.get(result.id, contextId);
      if (fact) facts.push(fact);
    }

    return facts;
  }

  private calculateVerificationConfidence(
    fact: Fact,
    supporting: string[],
    conflicting: string[]
  ): number {
    // Simple confidence calculation
    const supportWeight = supporting.length * 0.1;
    const conflictWeight = conflicting.length * 0.2;

    let confidence = fact.confidence;
    confidence += Math.min(supportWeight, 0.3);
    confidence -= Math.min(conflictWeight, 0.5);

    return Math.max(0, Math.min(1, confidence));
  }
}
