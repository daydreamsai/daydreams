import type { GraphMemory, GraphProvider, Entity, Relationship } from "./types";

export class GraphMemoryImpl implements GraphMemory {
  constructor(private provider: GraphProvider) {}

  async addEntity(entity: Entity): Promise<string> {
    const node = {
      id: entity.id,
      type: entity.type,
      properties: {
        ...entity.properties,
        name: entity.name,
        contextIds: entity.contextIds,
      },
    };
    return this.provider.addNode(node);
  }

  async addRelationship(relationship: Relationship): Promise<string> {
    const edge = {
      id: relationship.id,
      from: relationship.from,
      to: relationship.to,
      type: relationship.type,
      properties: {
        strength: relationship.strength,
        ...relationship.properties,
      },
    };
    const edgeId = await this.provider.addEdge(edge);

    // Update the original relationship object with the generated ID
    if (!relationship.id) {
      relationship.id = edge.id;
    }

    return edgeId;
  }

  async getEntity(id: string): Promise<Entity | null> {
    const node = await this.provider.getNode(id);
    if (!node) return null;

    const { name, contextIds, ...otherProperties } = node.properties;

    return {
      id: node.id,
      type: node.type,
      name: name,
      properties: otherProperties,
      contextIds: contextIds || [],
    };
  }

  async findRelated(
    entityId: string,
    relationshipType?: string
  ): Promise<Entity[]> {
    const edges = await this.provider.getEdges(entityId, "both");
    const relatedIds = new Set<string>();

    for (const edge of edges) {
      if (!relationshipType || edge.type === relationshipType) {
        relatedIds.add(edge.from === entityId ? edge.to : edge.from);
      }
    }

    const entities: Entity[] = [];
    for (const id of relatedIds) {
      const entity = await this.getEntity(id);
      if (entity) entities.push(entity);
    }

    return entities;
  }

  async findPath(from: string, to: string): Promise<Entity[]> {
    const path = await this.provider.shortestPath(from, to);
    if (!path) return [];

    const entities: Entity[] = [];
    for (const node of path.nodes) {
      const entity = await this.getEntity(node.id);
      if (entity) entities.push(entity);
    }

    return entities;
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<void> {
    const current = await this.getEntity(id);
    if (!current) throw new Error(`Entity ${id} not found`);

    await this.provider.updateNode(id, {
      properties: {
        ...current.properties,
        ...updates.properties,
        name: updates.name || current.name,
        contextIds: updates.contextIds || current.contextIds,
      },
    });
  }

  async removeEntity(id: string): Promise<boolean> {
    return this.provider.deleteNode(id);
  }
}
