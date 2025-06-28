import type {
  KeyValueProvider,
  VectorProvider,
  GraphProvider,
  HealthStatus,
  SetOptions,
  VectorDocument,
  VectorQuery,
  VectorResult,
  GraphNode,
  GraphEdge,
  GraphFilter,
  GraphTraversal,
  GraphPath,
} from "../types";

/**
 * In-memory Key-Value Provider for testing
 */
export class InMemoryKeyValueProvider implements KeyValueProvider {
  private store = new Map<string, any>();
  private ready = false;

  async initialize(): Promise<void> {
    this.ready = true;
  }

  async close(): Promise<void> {
    this.store.clear();
    this.ready = false;
  }

  async health(): Promise<HealthStatus> {
    return {
      status: this.ready ? "healthy" : "unhealthy",
      message: this.ready ? "In-memory KV provider operational" : "Not initialized",
      details: {
        ready: this.ready,
        size: this.store.size,
      },
    };
  }

  async get<T>(key: string): Promise<T | null> {
    this.ensureReady();
    return this.store.get(key) ?? null;
  }

  async set<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    this.ensureReady();
    
    if (options?.ifNotExists && this.store.has(key)) {
      throw new Error(`Key ${key} already exists`);
    }

    this.store.set(key, value);

    // Handle TTL
    if (options?.ttl) {
      setTimeout(() => {
        this.store.delete(key);
      }, options.ttl * 1000);
    }
  }

  async delete(key: string): Promise<boolean> {
    this.ensureReady();
    return this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    this.ensureReady();
    return this.store.has(key);
  }

  async keys(pattern?: string): Promise<string[]> {
    this.ensureReady();
    const allKeys = Array.from(this.store.keys());

    if (!pattern) return allKeys;

    // Simple pattern matching (supports * wildcard)
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return allKeys.filter((key) => regex.test(key));
  }

  async count(pattern?: string): Promise<number> {
    const keys = await this.keys(pattern);
    return keys.length;
  }

  async *scan(pattern?: string): AsyncIterator<[string, any]> {
    const keys = await this.keys(pattern);
    for (const key of keys) {
      const value = await this.get(key);
      if (value !== null) {
        yield [key, value];
      }
    }
  }

  async getBatch<T>(keys: string[]): Promise<Map<string, T>> {
    this.ensureReady();
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const value = this.store.get(key);
      if (value !== undefined) {
        results.set(key, value);
      }
    }
    
    return results;
  }

  async setBatch<T>(entries: Map<string, T>, options?: SetOptions): Promise<void> {
    this.ensureReady();
    
    for (const [key, value] of entries) {
      await this.set(key, value, options);
    }
  }

  async deleteBatch(keys: string[]): Promise<number> {
    this.ensureReady();
    let deleted = 0;
    
    for (const key of keys) {
      if (this.store.delete(key)) {
        deleted++;
      }
    }
    
    return deleted;
  }

  private ensureReady(): void {
    if (!this.ready) {
      throw new Error("Provider not initialized");
    }
  }
}

/**
 * In-memory Vector Provider for testing
 */
export class InMemoryVectorProvider implements VectorProvider {
  private documents = new Map<string, VectorDocument>();
  private ready = false;

  async initialize(): Promise<void> {
    this.ready = true;
  }

  async close(): Promise<void> {
    this.documents.clear();
    this.ready = false;
  }

  async health(): Promise<HealthStatus> {
    return {
      status: this.ready ? "healthy" : "unhealthy",
      message: this.ready ? "In-memory vector provider operational" : "Not initialized",
      details: {
        ready: this.ready,
        documents: this.documents.size,
      },
    };
  }

  async index(documents: VectorDocument[]): Promise<void> {
    this.ensureReady();
    
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
    }
  }

  async search(query: VectorQuery): Promise<VectorResult[]> {
    this.ensureReady();
    const results: VectorResult[] = [];

    for (const [id, doc] of this.documents) {
      // Apply namespace filter
      if (query.namespace && doc.namespace !== query.namespace) continue;

      // Apply metadata filters
      if (query.filter) {
        let match = true;
        for (const [key, value] of Object.entries(query.filter)) {
          if (doc.metadata?.[key] !== value) {
            match = false;
            break;
          }
        }
        if (!match) continue;
      }

      // Simple similarity - check if query matches content
      let score = 0;
      if (query.query && query.query.trim() !== "") {
        const contentLower = doc.content.toLowerCase();
        const queryLower = query.query.toLowerCase();
        
        // Check for exact match first
        if (contentLower.includes(queryLower)) {
          const exactMatch = contentLower === queryLower;
          const startsWith = contentLower.startsWith(queryLower);
          score = exactMatch ? 1.0 : startsWith ? 0.9 : 0.7;
        } else {
          // For similarity, check if most of the query words appear as whole words in content
          const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
          if (queryWords.length === 0) {
            continue; // Skip if no meaningful words in query
          }
          
          const matchingWords = queryWords.filter(qw => {
            const wordRegex = new RegExp(`\\b${qw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
            return wordRegex.test(contentLower);
          });
          
          // Require at least half the query words to match for a valid result
          if (matchingWords.length >= Math.ceil(queryWords.length / 2)) {
            score = (matchingWords.length / queryWords.length) * 0.6;
          } else {
            continue; // Skip non-matching content entirely
          }
        }
      } else {
        score = Math.random() * 0.5 + 0.5; // Random score if no query
      }
      
      if (!query.minScore || score >= query.minScore) {
        results.push({
          id,
          score,
          content: query.includeContent ? doc.content : undefined,
          metadata: query.includeMetadata ? doc.metadata : undefined,
        });
      }
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // Apply limit
    return results.slice(0, query.limit || 10);
  }

  async delete(ids: string[]): Promise<void> {
    this.ensureReady();
    
    for (const id of ids) {
      this.documents.delete(id);
    }
  }

  async update(id: string, updates: Partial<VectorDocument>): Promise<void> {
    this.ensureReady();
    
    const doc = this.documents.get(id);
    if (!doc) throw new Error(`Document ${id} not found`);

    this.documents.set(id, { ...doc, ...updates });
  }

  async count(namespace?: string): Promise<number> {
    this.ensureReady();
    
    if (!namespace) return this.documents.size;

    let count = 0;
    for (const doc of this.documents.values()) {
      if (doc.namespace === namespace) count++;
    }
    
    return count;
  }

  private ensureReady(): void {
    if (!this.ready) {
      throw new Error("Provider not initialized");
    }
  }
}

/**
 * In-memory Graph Provider for testing
 */
export class InMemoryGraphProvider implements GraphProvider {
  private nodes = new Map<string, GraphNode>();
  private edges = new Map<string, GraphEdge>();
  private nodeEdges = new Map<string, Set<string>>(); // node id -> edge ids
  private ready = false;

  async initialize(): Promise<void> {
    this.ready = true;
  }

  async close(): Promise<void> {
    this.nodes.clear();
    this.edges.clear();
    this.nodeEdges.clear();
    this.ready = false;
  }

  async health(): Promise<HealthStatus> {
    return {
      status: this.ready ? "healthy" : "unhealthy",
      message: this.ready ? "In-memory graph provider operational" : "Not initialized",
      details: {
        ready: this.ready,
        nodes: this.nodes.size,
        edges: this.edges.size,
      },
    };
  }

  async addNode(node: GraphNode): Promise<string> {
    this.ensureReady();
    
    if (!node.id) {
      node.id = `node:${Date.now()}:${Math.random()}`;
    }

    this.nodes.set(node.id, node);
    
    if (!this.nodeEdges.has(node.id)) {
      this.nodeEdges.set(node.id, new Set());
    }
    
    return node.id;
  }

  async getNode(id: string): Promise<GraphNode | null> {
    this.ensureReady();
    return this.nodes.get(id) ?? null;
  }

  async updateNode(id: string, updates: Partial<GraphNode>): Promise<void> {
    this.ensureReady();
    
    const node = this.nodes.get(id);
    if (!node) throw new Error(`Node ${id} not found`);

    this.nodes.set(id, { ...node, ...updates, id });
  }

  async deleteNode(id: string): Promise<boolean> {
    this.ensureReady();
    
    if (!this.nodes.has(id)) return false;

    // Delete all edges connected to this node
    const edgeIds = this.nodeEdges.get(id) || new Set();
    for (const edgeId of edgeIds) {
      this.edges.delete(edgeId);
    }

    // Remove from other nodes' edge lists
    for (const [nodeId, edges] of this.nodeEdges) {
      if (nodeId !== id) {
        for (const edgeId of edges) {
          const edge = this.edges.get(edgeId);
          if (edge && (edge.from === id || edge.to === id)) {
            edges.delete(edgeId);
          }
        }
      }
    }

    this.nodes.delete(id);
    this.nodeEdges.delete(id);
    
    return true;
  }

  async addEdge(edge: GraphEdge): Promise<string> {
    this.ensureReady();
    
    if (!edge.id) {
      edge.id = `relationship:${Date.now()}:${Math.random()}`;
    }

    // Verify nodes exist
    if (!this.nodes.has(edge.from)) {
      throw new Error(`Source entity ${edge.from} not found`);
    }
    if (!this.nodes.has(edge.to)) {
      throw new Error(`Target entity ${edge.to} not found`);
    }

    this.edges.set(edge.id, edge);

    // Update node edge mappings
    this.nodeEdges.get(edge.from)?.add(edge.id);
    this.nodeEdges.get(edge.to)?.add(edge.id);

    return edge.id;
  }

  async getEdges(nodeId: string, direction: "in" | "out" | "both" = "both"): Promise<GraphEdge[]> {
    this.ensureReady();
    
    const edgeIds = this.nodeEdges.get(nodeId) || new Set();
    const result: GraphEdge[] = [];

    for (const edgeId of edgeIds) {
      const edge = this.edges.get(edgeId);
      if (!edge) continue;

      if (direction === "out" && edge.from === nodeId) {
        result.push(edge);
      } else if (direction === "in" && edge.to === nodeId) {
        result.push(edge);
      } else if (direction === "both") {
        result.push(edge);
      }
    }

    return result;
  }

  async deleteEdge(id: string): Promise<boolean> {
    this.ensureReady();
    
    const edge = this.edges.get(id);
    if (!edge) return false;

    // Remove from node edge mappings
    this.nodeEdges.get(edge.from)?.delete(id);
    this.nodeEdges.get(edge.to)?.delete(id);

    this.edges.delete(id);
    
    return true;
  }

  async findNodes(filter: GraphFilter): Promise<GraphNode[]> {
    this.ensureReady();
    const results: GraphNode[] = [];

    for (const node of this.nodes.values()) {
      let match = true;

      if (filter.type && node.type !== filter.type) {
        match = false;
      }

      if (filter.labels && filter.labels.length > 0) {
        const nodeLabels = new Set(node.labels || []);
        for (const label of filter.labels) {
          if (!nodeLabels.has(label)) {
            match = false;
            break;
          }
        }
      }

      if (filter.properties) {
        for (const [key, value] of Object.entries(filter.properties)) {
          if (node.properties[key] !== value) {
            match = false;
            break;
          }
        }
      }

      if (match) {
        results.push(node);
      }
    }

    return results;
  }

  async traverse(traversal: GraphTraversal): Promise<GraphPath[]> {
    this.ensureReady();
    // Simple BFS traversal
    const paths: GraphPath[] = [];
    const visited = new Set<string>();
    const queue: { nodeId: string; path: GraphPath }[] = [];

    const startNode = this.nodes.get(traversal.start);
    if (!startNode) return paths;

    queue.push({
      nodeId: traversal.start,
      path: { nodes: [startNode], edges: [], length: 0 },
    });

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      if (path.length > 0) {
        paths.push(path);
      }

      if (traversal.maxDepth && path.length >= traversal.maxDepth) continue;

      const edges = await this.getEdges(nodeId, traversal.direction);
      
      for (const edge of edges) {
        const nextNodeId = edge.from === nodeId ? edge.to : edge.from;
        const nextNode = this.nodes.get(nextNodeId);
        
        if (!nextNode) continue;

        // Apply filter
        if (traversal.filter) {
          let match = true;
          if (traversal.filter.type && nextNode.type !== traversal.filter.type) {
            match = false;
          }
          if (!match) continue;
        }

        queue.push({
          nodeId: nextNodeId,
          path: {
            nodes: [...path.nodes, nextNode],
            edges: [...path.edges, edge],
            length: path.length + 1,
          },
        });
      }
    }

    return paths;
  }

  async shortestPath(from: string, to: string): Promise<GraphPath | null> {
    this.ensureReady();
    
    // Simple BFS to find shortest path
    const queue: GraphPath[] = [];
    const visited = new Set<string>();

    const startNode = this.nodes.get(from);
    if (!startNode) return null;

    queue.push({ nodes: [startNode], edges: [], length: 0 });

    while (queue.length > 0) {
      const path = queue.shift()!;
      const currentNode = path.nodes[path.nodes.length - 1];

      if (currentNode.id === to) {
        return path;
      }

      if (visited.has(currentNode.id)) continue;
      visited.add(currentNode.id);

      const edges = await this.getEdges(currentNode.id, "both");
      
      for (const edge of edges) {
        const nextNodeId = edge.from === currentNode.id ? edge.to : edge.from;
        
        if (visited.has(nextNodeId)) continue;

        const nextNode = this.nodes.get(nextNodeId);
        if (!nextNode) continue;

        queue.push({
          nodes: [...path.nodes, nextNode],
          edges: [...path.edges, edge],
          length: path.length + 1,
        });
      }
    }

    return null;
  }

  private ensureReady(): void {
    if (!this.ready) {
      throw new Error("Provider not initialized");
    }
  }
}