import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemorySystem } from "../memory-system";
import {
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../providers/in-memory";
import type { Memory, Entity, Relationship } from "../types";

describe("GraphMemory", () => {
  let memory: Memory;

  beforeEach(async () => {
    memory = new MemorySystem({
      providers: {
        kv: new InMemoryKeyValueProvider(),
        vector: new InMemoryVectorProvider(),
        graph: new InMemoryGraphProvider(),
      },
    });
    await memory.initialize();
  });

  afterEach(async () => {
    await memory.close();
  });

  describe("entity management", () => {
    it("should add and retrieve entities", async () => {
      const entity: Entity = {
        id: "entity:person:1",
        type: "person",
        name: "Alice Johnson",
        properties: {
          age: 30,
          occupation: "Software Engineer",
          location: "San Francisco",
        },
        contextIds: ["chat:123", "project:ai"],
      };

      const entityId = await memory.graph.addEntity(entity);
      expect(entityId).toBe("entity:person:1");

      const retrieved = await memory.graph.getEntity("entity:person:1");
      expect(retrieved).toEqual(entity);
    });

    it("should auto-generate entity ID if not provided", async () => {
      const entity = {
        type: "company",
        name: "TechCorp",
        properties: { industry: "Technology" },
        contextIds: ["business:1"],
        id: "entity:company:1",
      };

      const entityId = await memory.graph.addEntity(entity as Entity);

      expect(entityId).toBeDefined();
      expect(entity.id).toBeDefined();
      expect(entity.id).toMatch(/^entity:/);
    });

    it("should update existing entity", async () => {
      const entity: Entity = {
        id: "entity:update:1",
        type: "person",
        name: "Bob Smith",
        properties: { age: 25 },
        contextIds: ["test"],
      };

      await memory.graph.addEntity(entity);

      await memory.graph.updateEntity("entity:update:1", {
        properties: { age: 26, city: "New York" },
      });

      const updated = await memory.graph.getEntity("entity:update:1");
      expect(updated?.properties.age).toBe(26);
      expect(updated?.properties.city).toBe("New York");
      expect(updated?.name).toBe("Bob Smith"); // Should preserve other fields
    });

    it("should throw error when updating non-existent entity", async () => {
      await expect(
        memory.graph.updateEntity("nonexistent", { name: "test" })
      ).rejects.toThrow("Entity nonexistent not found");
    });

    it("should remove entity and its relationships", async () => {
      // Add entities
      const person: Entity = {
        id: "entity:person:delete",
        type: "person",
        name: "Charlie",
        properties: {},
        contextIds: [],
      };

      const company: Entity = {
        id: "entity:company:delete",
        type: "company",
        name: "DeleteCorp",
        properties: {},
        contextIds: [],
      };

      await memory.graph.addEntity(person);
      await memory.graph.addEntity(company);

      // Add relationship
      const relationship: Relationship = {
        id: "rel:works:delete",
        from: "entity:person:delete",
        to: "entity:company:delete",
        type: "works_for",
        strength: 0.9,
      };

      await memory.graph.addRelationship(relationship);

      // Delete the person entity
      const deleted = await memory.graph.removeEntity("entity:person:delete");
      expect(deleted).toBe(true);

      // Entity should be gone
      const retrieved = await memory.graph.getEntity("entity:person:delete");
      expect(retrieved).toBeNull();

      // Relationship should also be gone
      const relatedEntities = await memory.graph.findRelated(
        "entity:company:delete"
      );
      expect(relatedEntities).toEqual([]);
    });

    it("should return false when removing non-existent entity", async () => {
      const deleted = await memory.graph.removeEntity("nonexistent");
      expect(deleted).toBe(false);
    });
  });

  describe("relationship management", () => {
    beforeEach(async () => {
      // Setup entities for relationship tests
      const entities: Entity[] = [
        {
          id: "entity:alice",
          type: "person",
          name: "Alice",
          properties: {},
          contextIds: [],
        },
        {
          id: "entity:bob",
          type: "person",
          name: "Bob",
          properties: {},
          contextIds: [],
        },
        {
          id: "entity:techcorp",
          type: "company",
          name: "TechCorp",
          properties: {},
          contextIds: [],
        },
      ];

      await Promise.all(entities.map((e) => memory.graph.addEntity(e)));
    });

    it("should add and retrieve relationships", async () => {
      const relationship: Relationship = {
        id: "rel:works:1",
        from: "entity:alice",
        to: "entity:techcorp",
        type: "works_for",
        properties: { startDate: "2023-01-01", role: "Engineer" },
        strength: 0.9,
      };

      const relId = await memory.graph.addRelationship(relationship);
      expect(relId).toBe("rel:works:1");
    });

    it("should auto-generate relationship ID if not provided", async () => {
      const relationship = {
        from: "entity:bob",
        to: "entity:techcorp",
        type: "works_for",
        strength: 0.8,
        // No ID provided
      } as Relationship;

      const relId = await memory.graph.addRelationship(relationship);

      expect(relId).toBeDefined();
      expect(relationship.id).toBeDefined();
      expect(relationship.id).toMatch(/^relationship:/);
    });

    it("should throw error when adding relationship with non-existent entities", async () => {
      const relationship: Relationship = {
        id: "rel:invalid:1",
        from: "nonexistent:1",
        to: "entity:alice",
        type: "knows",
      };

      await expect(memory.graph.addRelationship(relationship)).rejects.toThrow(
        "Source entity nonexistent:1 not found"
      );

      const relationship2: Relationship = {
        id: "rel:invalid:2",
        from: "entity:alice",
        to: "nonexistent:2",
        type: "knows",
      };

      await expect(memory.graph.addRelationship(relationship2)).rejects.toThrow(
        "Target entity nonexistent:2 not found"
      );
    });

    it("should find related entities", async () => {
      // Add relationships
      await memory.graph.addRelationship({
        id: "rel:alice-techcorp",
        from: "entity:alice",
        to: "entity:techcorp",
        type: "works_for",
      });

      await memory.graph.addRelationship({
        id: "rel:alice-bob",
        from: "entity:alice",
        to: "entity:bob",
        type: "knows",
      });

      const related = await memory.graph.findRelated("entity:alice");

      expect(related).toHaveLength(2);
      expect(related.map((e) => e.id)).toContain("entity:techcorp");
      expect(related.map((e) => e.id)).toContain("entity:bob");
    });

    it("should find related entities by relationship type", async () => {
      await memory.graph.addRelationship({
        id: "rel:alice-techcorp-works",
        from: "entity:alice",
        to: "entity:techcorp",
        type: "works_for",
      });

      await memory.graph.addRelationship({
        id: "rel:alice-bob-knows",
        from: "entity:alice",
        to: "entity:bob",
        type: "knows",
      });

      const colleagues = await memory.graph.findRelated(
        "entity:alice",
        "works_for"
      );

      expect(colleagues).toHaveLength(1);
      expect(colleagues[0].id).toBe("entity:techcorp");
    });

    it("should find path between entities", async () => {
      // Create a path: Alice -> TechCorp -> Bob
      await memory.graph.addRelationship({
        id: "rel:alice-techcorp-path",
        from: "entity:alice",
        to: "entity:techcorp",
        type: "works_for",
      });

      await memory.graph.addRelationship({
        id: "rel:bob-techcorp-path",
        from: "entity:bob",
        to: "entity:techcorp",
        type: "works_for",
      });

      const path = await memory.graph.findPath("entity:alice", "entity:bob");

      expect(path).toBeDefined();
      expect(path.length).toBeGreaterThan(0);
      expect(path.map((e) => e.id)).toContain("entity:alice");
      expect(path.map((e) => e.id)).toContain("entity:bob");
    });

    it("should return null when no path exists", async () => {
      // Add isolated entity
      await memory.graph.addEntity({
        id: "entity:isolated",
        type: "person",
        name: "Isolated",
        properties: {},
        contextIds: [],
      });

      const path = await memory.graph.findPath(
        "entity:alice",
        "entity:isolated"
      );
      expect(path).toEqual([]);
    });
  });

  describe("entity relationships", () => {
    beforeEach(async () => {
      const entities: Entity[] = [
        {
          id: "entity:engineer:1",
          type: "person",
          name: "John Engineer",
          properties: { role: "software", level: "senior" },
          contextIds: ["tech:team"],
        },
        {
          id: "entity:engineer:2",
          type: "person",
          name: "Jane Engineer",
          properties: { role: "software", level: "junior" },
          contextIds: ["tech:team"],
        },
        {
          id: "entity:company:1",
          type: "company",
          name: "TechCorp",
          properties: { industry: "tech" },
          contextIds: ["business"],
        },
      ];

      await Promise.all(entities.map((e) => memory.graph.addEntity(e)));

      // Add relationships
      await memory.graph.addRelationship({
        id: "rel:john-techcorp",
        from: "entity:engineer:1",
        to: "entity:company:1",
        type: "works_for",
      });

      await memory.graph.addRelationship({
        id: "rel:jane-techcorp",
        from: "entity:engineer:2", 
        to: "entity:company:1",
        type: "works_for",
      });

      await memory.graph.addRelationship({
        id: "rel:john-jane",
        from: "entity:engineer:1",
        to: "entity:engineer:2",
        type: "collaborates",
      });
    });

    it("should find all related entities", async () => {
      const related = await memory.graph.findRelated("entity:engineer:1");

      expect(related.length).toBe(2);
      expect(related.map(e => e.id)).toContain("entity:company:1");
      expect(related.map(e => e.id)).toContain("entity:engineer:2");
    });

    it("should find entities by relationship type", async () => {
      const colleagues = await memory.graph.findRelated("entity:engineer:1", "works_for");

      expect(colleagues.length).toBe(1);
      expect(colleagues[0].id).toBe("entity:company:1");
    });

    it("should return empty array for non-existent relationship type", async () => {
      const nonexistent = await memory.graph.findRelated("entity:engineer:1", "invalid_type");

      expect(nonexistent).toEqual([]);
    });

    it("should return empty array for non-existent entity", async () => {
      const related = await memory.graph.findRelated("nonexistent");

      expect(related).toEqual([]);
    });
  });


  describe("performance and edge cases", () => {
    it("should handle large number of entities efficiently", async () => {
      const startTime = Date.now();

      // Add many entities
      const entities = Array.from({ length: 100 }, (_, i) => ({
        id: `entity:perf:${i}`,
        type: "test",
        name: `Entity ${i}`,
        properties: { index: i },
        contextIds: [],
      }));

      await Promise.all(entities.map((e) => memory.graph.addEntity(e)));

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in reasonable time
    });

    it("should handle circular relationships gracefully", async () => {
      // Create circular reference: A -> B -> C -> A
      const entities = ["A", "B", "C"].map((id) => ({
        id: `entity:circle:${id}`,
        type: "node",
        name: `Node ${id}`,
        properties: {},
        contextIds: [],
      }));

      await Promise.all(entities.map((e) => memory.graph.addEntity(e)));

      await memory.graph.addRelationship({
        id: "rel:A-B",
        from: "entity:circle:A",
        to: "entity:circle:B",
        type: "connects",
      });

      await memory.graph.addRelationship({
        id: "rel:B-C",
        from: "entity:circle:B",
        to: "entity:circle:C",
        type: "connects",
      });

      await memory.graph.addRelationship({
        id: "rel:C-A",
        from: "entity:circle:C",
        to: "entity:circle:A",
        type: "connects",
      });

      // Should be able to find related entities without infinite loops
      const relatedA = await memory.graph.findRelated("entity:circle:A");
      expect(relatedA.length).toBe(2);
      expect(relatedA.map(e => e.id)).toContain("entity:circle:B");
      expect(relatedA.map(e => e.id)).toContain("entity:circle:C");
    });

    it("should return correct values for non-existent entity operations", async () => {
      const entity = await memory.graph.getEntity("nonexistent");
      expect(entity).toBeNull();

      const related = await memory.graph.findRelated("nonexistent");
      expect(related).toEqual([]);

      const path = await memory.graph.findPath("nonexistent", "entity:alice");
      expect(path).toEqual([]);
    });
  });
});
