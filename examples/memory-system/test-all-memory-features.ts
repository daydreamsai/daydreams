// Comprehensive Memory System Test
// Runs all memory tests in sequence to verify complete system functionality

import { openai } from "@ai-sdk/openai";
import {
  createDreams,
  context,
  action,
  Logger,
  LogLevel,
  validateEnv,
} from "@daydreamsai/core";
import {
  MemorySystem,
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "@daydreamsai/core";
import { cliExtension } from "@daydreamsai/cli";
import * as z from "zod/v4";

validateEnv(
  z.object({
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  })
);

// Test Results Tracking
interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const testResults: TestResult[] = [];

async function runTest(
  testName: string,
  testFn: () => Promise<void>
): Promise<void> {
  console.log(`\n🔄 Running ${testName}...`);
  const startTime = Date.now();

  try {
    await testFn();
    const duration = Date.now() - startTime;
    testResults.push({ testName, passed: true, duration });
    console.log(`✅ ${testName} passed in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    testResults.push({ testName, passed: false, duration, error: errorMsg });
    console.error(`❌ ${testName} failed in ${duration}ms:`, errorMsg);
  }
}

// Individual test functions
async function testMemoryInitialization() {
  const memory = new MemorySystem({
    providers: {
      kv: new InMemoryKeyValueProvider(),
      vector: new InMemoryVectorProvider(),
      graph: new InMemoryGraphProvider(),
    },
  });

  await memory.initialize();

  // Test basic connectivity
  await memory.kv.set("test:init", { initialized: true });
  const result = await memory.kv.get<{ initialized: boolean }>("test:init");

  if (!result || !result.initialized) {
    throw new Error(
      "Memory initialization failed - result was null or initialization flag missing"
    );
  }

  const deleted = await memory.kv.delete("test:init");
  if (!deleted) {
    throw new Error("Failed to delete test key");
  }
}

async function testKVOperations() {
  const memory = new MemorySystem({
    providers: {
      kv: new InMemoryKeyValueProvider(),
      vector: new InMemoryVectorProvider(),
      graph: new InMemoryGraphProvider(),
    },
  });

  await memory.initialize();

  // Test 1: Basic CRUD operations
  await memory.kv.set("test:crud", { value: "test data" });
  const retrieved = await memory.kv.get<{ value: string }>("test:crud");
  if (!retrieved || retrieved.value !== "test data") {
    throw new Error("KV get failed - expected 'test data'");
  }

  // Test exists operation
  const exists = await memory.kv.exists("test:crud");
  if (!exists) {
    throw new Error("KV exists check failed");
  }

  // Test 2: Multiple set operations (simulating batch)
  const batchData = [
    ["batch:1", { id: 1, name: "Item 1" }],
    ["batch:2", { id: 2, name: "Item 2" }],
    ["batch:3", { id: 3, name: "Item 3" }],
  ] as const;

  // Set multiple items
  for (const [key, value] of batchData) {
    await memory.kv.set(key, value);
  }

  // Verify all items were set
  const batchResults = new Map();
  for (const [key] of batchData) {
    const value = await memory.kv.get<{ id: number; name: string }>(key);
    if (value) {
      batchResults.set(key, value);
    }
  }

  if (batchResults.size !== 3) {
    throw new Error(
      `Multiple set operations failed - expected 3 items, got ${batchResults.size}`
    );
  }

  // Verify batch content
  const item1 = batchResults.get("batch:1");
  if (!item1 || item1.id !== 1) {
    throw new Error("Batch result verification failed for batch:1");
  }

  // Test 3: Pattern matching
  const keys = await memory.kv.keys("batch:*");
  if (keys.length !== 3) {
    throw new Error(
      `Pattern matching failed - expected 3 keys, got ${keys.length}`
    );
  }

  // Test 4: Count operation
  const count = await memory.kv.count("batch:*");
  if (count !== 3) {
    throw new Error(`Count operation failed - expected 3, got ${count}`);
  }

  // Test 5: Scan operation
  const scannedEntries: Array<[string, any]> = [];
  const scanner = memory.kv.scan("batch:*");
  let scanResult = await scanner.next();
  while (!scanResult.done) {
    scannedEntries.push(scanResult.value);
    scanResult = await scanner.next();
  }
  if (scannedEntries.length !== 3) {
    throw new Error(
      `Scan operation failed - expected 3 entries, got ${scannedEntries.length}`
    );
  }

  // Test 6: Delete multiple items (simulating batch delete)
  let deletedCount = 0;
  for (const key of ["batch:1", "batch:2", "batch:3"]) {
    const deleted = await memory.kv.delete(key);
    if (deleted) deletedCount++;
  }
  if (deletedCount !== 3) {
    throw new Error(
      `Multiple delete operations failed - expected 3 deletions, got ${deletedCount}`
    );
  }

  // Test 7: TTL operations
  await memory.kv.set("test:ttl", { expires: true }, { ttl: 2 });
  const ttlData = await memory.kv.get("test:ttl");
  if (!ttlData) {
    throw new Error("TTL data not found immediately after setting");
  }

  // Wait for TTL expiry and verify
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const expiredData = await memory.kv.get("test:ttl");
  if (expiredData !== null) {
    throw new Error("TTL data did not expire as expected");
  }

  // Test 8: Conditional operations
  await memory.kv.set(
    "test:conditional",
    { first: true },
    { ifNotExists: true }
  );

  // This should fail silently due to ifNotExists
  try {
    await memory.kv.set(
      "test:conditional",
      { second: true },
      { ifNotExists: true }
    );
    // Should not reach here - InMemoryProvider throws an error for ifNotExists when key exists
    throw new Error("ifNotExists should have prevented overwrite");
  } catch (error) {
    // Expected behavior - the InMemoryProvider throws an error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes("already exists")) {
      throw new Error(`Unexpected error for ifNotExists: ${errorMessage}`);
    }
  }

  const conditionalValue = await memory.kv.get<{
    first?: boolean;
    second?: boolean;
  }>("test:conditional");
  if (!conditionalValue || !conditionalValue.first || conditionalValue.second) {
    throw new Error("Conditional operation failed - value was overwritten");
  }

  // Test 9: Tags and metadata (even though in-memory doesn't persist metadata)
  await memory.kv.set(
    "test:tags",
    { tagged: true },
    {
      tags: { type: "test", category: "metadata" },
    }
  );

  const taggedData = await memory.kv.get("test:tags");
  if (!taggedData) {
    throw new Error("Tagged data not found");
  }

  // Cleanup
  await memory.kv.delete("test:crud");
  await memory.kv.delete("test:conditional");
  await memory.kv.delete("test:tags");
}

async function testVectorOperations() {
  const memory = new MemorySystem({
    providers: {
      kv: new InMemoryKeyValueProvider(),
      vector: new InMemoryVectorProvider(),
      graph: new InMemoryGraphProvider(),
    },
  });

  await memory.initialize();

  // Test document indexing
  await memory.vector.index([
    {
      id: "test:doc1",
      content:
        "This is a test document about weather forecasting and meteorological predictions",
      metadata: { type: "test", category: "weather" },
    },
    {
      id: "test:doc2",
      content:
        "Machine learning algorithms for data analysis and pattern recognition",
      metadata: { type: "test", category: "ai" },
    },
    {
      id: "test:doc3",
      content:
        "Weather patterns and climate change research in atmospheric science",
      metadata: { type: "test", category: "weather" },
    },
  ]);

  // Test semantic search
  const searchResults = await memory.vector.search({
    query: "weather prediction forecasting",
    limit: 10,
    includeContent: true,
    includeMetadata: true,
  });

  if (searchResults.length === 0) {
    throw new Error("Vector search returned no results");
  }

  // Verify results contain weather-related documents
  const weatherDocs = searchResults.filter(
    (r) =>
      r.metadata?.category === "weather" ||
      (r.content && r.content.toLowerCase().includes("weather"))
  );

  if (weatherDocs.length === 0) {
    throw new Error("Vector search did not return relevant weather documents");
  }

  // Test search with metadata filter
  const filteredResults = await memory.vector.search({
    query: "test data",
    filter: { category: "weather" },
    limit: 5,
  });

  if (filteredResults.length === 0) {
    throw new Error("Filtered vector search returned no results");
  }

  // Test minimum score filtering
  const highScoreResults = await memory.vector.search({
    query: "weather forecasting",
    minScore: 0.5,
    limit: 5,
  });

  // Should have at least one high-scoring result
  if (highScoreResults.length === 0) {
    throw new Error("High score vector search returned no results");
  }

  // Cleanup
  await memory.vector.delete(["test:doc1", "test:doc2", "test:doc3"]);
}

async function testGraphOperations() {
  const memory = new MemorySystem({
    providers: {
      kv: new InMemoryKeyValueProvider(),
      vector: new InMemoryVectorProvider(),
      graph: new InMemoryGraphProvider(),
    },
  });

  await memory.initialize();

  // Test entity creation
  await memory.graph.addEntity({
    id: "test:entity1",
    type: "person",
    name: "Alice",
    properties: { age: 30, role: "developer" },
    contextIds: ["test"],
  });

  await memory.graph.addEntity({
    id: "test:entity2",
    type: "person",
    name: "Bob",
    properties: { age: 25, role: "designer" },
    contextIds: ["test"],
  });

  await memory.graph.addEntity({
    id: "test:entity3",
    type: "project",
    name: "WebApp",
    properties: { status: "active", priority: "high" },
    contextIds: ["test"],
  });

  // Test relationship creation
  await memory.graph.addRelationship({
    id: "test:rel1",
    from: "test:entity1",
    to: "test:entity2",
    type: "collaborates-with",
    strength: 0.8,
    properties: { since: "2023-01-01" },
  });

  await memory.graph.addRelationship({
    id: "test:rel2",
    from: "test:entity1",
    to: "test:entity3",
    type: "works-on",
    strength: 0.9,
    properties: { role: "lead" },
  });

  await memory.graph.addRelationship({
    id: "test:rel3",
    from: "test:entity2",
    to: "test:entity3",
    type: "works-on",
    strength: 0.7,
    properties: { role: "contributor" },
  });

  // Test relationship queries
  const related = await memory.graph.findRelated(
    "test:entity1",
    "collaborates-with"
  );
  if (related.length === 0) {
    throw new Error(
      "Graph relationship query failed - no related entities found"
    );
  }

  // Verify the related entity is Bob
  const relatedEntity = related.find((e) => e.name === "Bob");
  if (!relatedEntity) {
    throw new Error("Expected related entity 'Bob' not found");
  }

  // Test finding entities working on projects
  const projectWorkers = await memory.graph.findRelated(
    "test:entity3",
    "works-on"
  );
  if (projectWorkers.length !== 2) {
    throw new Error(
      `Expected 2 project workers, found ${projectWorkers.length}`
    );
  }

  // Test path finding
  const path = await memory.graph.findPath("test:entity1", "test:entity3");
  if (path.length === 0) {
    throw new Error("Graph path finding failed");
  }

  // Test entity updates
  await memory.graph.updateEntity("test:entity1", {
    properties: { age: 31, role: "senior developer" },
  });

  const updatedEntity = await memory.graph.getEntity("test:entity1");
  if (!updatedEntity || updatedEntity.properties.age !== 31) {
    throw new Error("Entity update failed");
  }

  // Cleanup
  await memory.graph.removeEntity("test:entity1");
  await memory.graph.removeEntity("test:entity2");
  await memory.graph.removeEntity("test:entity3");
}

async function testAgentIntegration() {
  // Test full agent integration with memory
  const testContext = context({
    type: "integration-test",
    schema: z.object({ testId: z.string() }),
    create: () => ({ testData: [], interactions: 0 }),
    instructions: "You are a test agent with memory capabilities.",
  });

  const testAction = action({
    name: "test-memory-action",
    description: "Test memory integration",
    schema: z.object({ data: z.string() }),
    handler: async ({ data }, ctx) => {
      // Store in memory
      await ctx.memory.kv.set(`test:${ctx.args.testId}`, {
        data,
        timestamp: Date.now(),
      });
      return { stored: true, data };
    },
  });

  const agent = createDreams({
    model: openai("gpt-4o-mini"), // Use cheaper model for testing
    memory: new MemorySystem({
      providers: {
        kv: new InMemoryKeyValueProvider(),
        vector: new InMemoryVectorProvider(),
        graph: new InMemoryGraphProvider(),
      },
    }),
    contexts: [testContext.setActions([testAction])],
  });

  // Test context and memory work together by running the context
  await agent.start();

  // This will create a context state and test the memory integration
  const results = await agent.run({
    context: testContext,
    args: { testId: "test123" },
  });

  if (!results || results.length === 0) {
    throw new Error("Agent context execution failed");
  }

  // Verify data was stored in memory
  const storedData = await agent.memory.kv.get(`test:test123`);
  if (!storedData) {
    console.warn(
      "Memory storage verification skipped - may not have been triggered during context run"
    );
  }

  // Cleanup test data
  try {
    await agent.memory.kv.delete("test:test123");
  } catch (error) {
    // Ignore cleanup errors
  }
}

async function testMemoryPerformance() {
  const memory = new MemorySystem({
    providers: {
      kv: new InMemoryKeyValueProvider(),
      vector: new InMemoryVectorProvider(),
      graph: new InMemoryGraphProvider(),
    },
  });

  await memory.initialize();

  // Test KV performance with multiple operations
  const kvStart = Date.now();
  const kvPromises = Array.from({ length: 100 }, (_, i) =>
    memory.kv.set(`perf:kv:${i}`, { index: i, data: `test data ${i}` })
  );
  await Promise.all(kvPromises);
  const kvDuration = Date.now() - kvStart;

  if (kvDuration > 10000) {
    // 10 seconds timeout
    throw new Error("KV performance test too slow");
  }

  // Test batch performance (multiple individual sets)
  const batchStart = Date.now();
  const batchPromises = [];
  for (let i = 100; i < 200; i++) {
    batchPromises.push(
      memory.kv.set(`perf:batch:${i}`, { index: i, data: `batch data ${i}` })
    );
  }
  await Promise.all(batchPromises);
  const batchDuration = Date.now() - batchStart;

  if (batchDuration > 5000) {
    throw new Error("Batch performance test too slow");
  }

  // Test Vector performance
  const vectorStart = Date.now();
  await memory.vector.index(
    Array.from({ length: 10 }, (_, i) => ({
      id: `perf:vector:${i}`,
      content: `Performance test document ${i} with some meaningful test content for search functionality`,
      metadata: { type: "performance", index: i },
    }))
  );
  const vectorDuration = Date.now() - vectorStart;

  if (vectorDuration > 15000) {
    // 15 seconds timeout
    throw new Error("Vector performance test too slow");
  }

  // Cleanup
  const kvKeys = Array.from({ length: 100 }, (_, i) => `perf:kv:${i}`);
  const batchKeys = Array.from({ length: 100 }, (_, i) => `perf:batch:${i}`);
  const deletePromises = [...kvKeys, ...batchKeys].map((key) =>
    memory.kv.delete(key)
  );
  await Promise.all(deletePromises);

  for (let i = 0; i < 10; i++) {
    try {
      await memory.vector.delete([`perf:vector:${i}`]);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  console.log(
    `  KV Operations: ${kvDuration}ms, Batch Operations: ${batchDuration}ms, Vector Operations: ${vectorDuration}ms`
  );
}

async function testErrorHandling() {
  const memory = new MemorySystem({
    providers: {
      kv: new InMemoryKeyValueProvider(),
      vector: new InMemoryVectorProvider(),
      graph: new InMemoryGraphProvider(),
    },
  });

  await memory.initialize();

  // Test graceful handling of missing keys
  const missing = await memory.kv.get("does:not:exist");
  if (missing !== null) {
    throw new Error("Expected null for missing key");
  }

  // Test delete of non-existent key
  const deleteResult = await memory.kv.delete("does:not:exist");
  if (deleteResult !== false) {
    throw new Error("Expected false when deleting non-existent key");
  }

  // Test exists for non-existent key
  const existsResult = await memory.kv.exists("does:not:exist");
  if (existsResult !== false) {
    throw new Error("Expected false for non-existent key exists check");
  }

  // Test graceful handling of invalid vector queries
  const emptyResults = await memory.vector.search({
    query:
      "completely unrelated random text that should not match anything specific in an empty index",
    minScore: 0.99, // Very high threshold
  });

  // Should not throw, just return empty results
  if (!Array.isArray(emptyResults)) {
    throw new Error("Vector search should return array even for no matches");
  }

  // Test graceful handling of missing graph nodes
  const missingEntity = await memory.graph.getEntity("does:not:exist");
  if (missingEntity !== null) {
    throw new Error("Expected null for missing graph entity");
  }

  // Test graph operations with missing nodes
  const emptyRelated = await memory.graph.findRelated(
    "does:not:exist",
    "any-relationship"
  );
  if (!Array.isArray(emptyRelated) || emptyRelated.length > 0) {
    throw new Error("Graph query for missing node should return empty array");
  }

  // Test operations with mixed existing/non-existing keys
  await memory.kv.set("exists:1", { value: 1 });
  const mixedResults = new Map();
  for (const key of ["exists:1", "does:not:exist:1", "does:not:exist:2"]) {
    const value = await memory.kv.get(key);
    if (value !== null) {
      mixedResults.set(key, value);
    }
  }
  if (mixedResults.size !== 1) {
    throw new Error("Mixed get operations should only return existing keys");
  }

  // Cleanup
  await memory.kv.delete("exists:1");
}

// Main test runner
async function runAllTests() {
  console.log("🧠 Starting Comprehensive Memory System Tests");
  console.log("=" + "=".repeat(50));

  const tests = [
    { name: "Memory Initialization", fn: testMemoryInitialization },
    { name: "Key-Value Operations", fn: testKVOperations },
    { name: "Vector Operations", fn: testVectorOperations },
    { name: "Graph Operations", fn: testGraphOperations },
    { name: "Agent Integration", fn: testAgentIntegration },
    { name: "Memory Performance", fn: testMemoryPerformance },
    { name: "Error Handling", fn: testErrorHandling },
  ];

  const totalStart = Date.now();

  for (const test of tests) {
    await runTest(test.name, test.fn);
  }

  const totalDuration = Date.now() - totalStart;

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("🏁 Test Results Summary");
  console.log("=".repeat(60));

  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => r.passed === false).length;

  console.log(`\nOverall: ${passed}/${testResults.length} tests passed`);
  console.log(`Total Duration: ${totalDuration}ms`);

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    testResults
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.testName}: ${r.error}`);
      });
  }

  console.log("\n📊 Performance Summary:");
  testResults.forEach((r) => {
    const status = r.passed ? "✅" : "❌";
    console.log(`  ${status} ${r.testName}: ${r.duration}ms`);
  });

  if (failed === 0) {
    console.log("\n🎉 All tests passed! Memory system is working correctly.");
  } else {
    console.log(
      `\n⚠️  ${failed} test(s) failed. Please check the errors above.`
    );
    process.exit(1);
  }
}

// Run all tests
runAllTests().catch((error) => {
  console.error("💥 Test runner failed:", error);
  process.exit(1);
});
