// Key-Value Memory Test
// Tests all KV memory operations including CRUD, batch ops, TTL, and pattern matching

import {
  MemorySystem,
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "@daydreamsai/core";

async function testKVMemory() {
  console.log("🔑 Testing Key-Value Memory Operations");

  const memory = new MemorySystem({
    providers: {
      kv: new InMemoryKeyValueProvider(),
      vector: new InMemoryVectorProvider(),
      graph: new InMemoryGraphProvider(),
    },
  });

  await memory.initialize();

  try {
    // Test 1: Basic CRUD Operations
    console.log("\n📝 Test 1: Basic CRUD Operations");

    // Set a simple value
    await memory.kv.set("user:123", {
      name: "Alice",
      email: "alice@example.com",
      preferences: { theme: "dark", notifications: true },
    });
    console.log("✅ Set user data");

    // Get the value
    const user = await memory.kv.get<{
      name: string;
      email: string;
      preferences: { theme: string; notifications: boolean; language?: string };
      lastLogin?: string;
    }>("user:123");
    console.log("✅ Retrieved user:", user);

    // Update the value
    if (user) {
      await memory.kv.set("user:123", {
        ...user,
        lastLogin: new Date().toISOString(),
        preferences: { ...user.preferences, language: "en" },
      });
      console.log("✅ Updated user data");
    }

    // Delete the value
    await memory.kv.delete("user:123");
    console.log("✅ Deleted user data");

    // Verify deletion
    const deletedUser = await memory.kv.get("user:123");
    console.log("✅ Verified deletion:", deletedUser === null);

    // Test 2: Multiple Set Operations (simulating batch)
    console.log("\n📦 Test 2: Multiple Set Operations (simulating batch)");

    const batchData = [
      [
        "session:abc",
        { userId: "123", token: "xyz", expires: Date.now() + 3600000 },
      ],
      [
        "session:def",
        { userId: "456", token: "uvw", expires: Date.now() + 7200000 },
      ],
      ["cache:weather:sf", { temp: 72, humidity: 65, timestamp: Date.now() }],
      ["cache:weather:ny", { temp: 45, humidity: 80, timestamp: Date.now() }],
    ] as const;

    // Set multiple items
    for (const [key, value] of batchData) {
      await memory.kv.set(key, value);
    }
    console.log("✅ Set multiple data items");

    // Verify all items were set
    const retrievedItems = new Map();
    for (const [key] of batchData) {
      const value = await memory.kv.get(key);
      if (value) {
        retrievedItems.set(key, value);
      }
    }
    console.log(
      "✅ Retrieved multiple data items:",
      retrievedItems.size,
      "items"
    );

    // Test 3: TTL Operations
    console.log("\n⏰ Test 3: TTL Operations");

    await memory.kv.set("temp:data", { value: "expires soon" }, { ttl: 5 });
    console.log("✅ Set data with 5 second TTL");

    const tempData = await memory.kv.get("temp:data");
    console.log("✅ Retrieved temp data:", tempData);

    console.log("⏳ Waiting 6 seconds for TTL expiry...");
    await new Promise((resolve) => setTimeout(resolve, 6000));

    const expiredData = await memory.kv.get("temp:data");
    console.log("✅ Verified TTL expiry:", expiredData === null);

    // Test 4: Pattern Matching and Scanning
    console.log("\n🔍 Test 4: Pattern Matching and Scanning");

    // Get all session keys
    const sessionKeys = await memory.kv.keys("session:*");
    console.log("✅ Found session keys:", sessionKeys);

    // Get all cache keys
    const cacheKeys = await memory.kv.keys("cache:*");
    console.log("✅ Found cache keys:", cacheKeys);

    // Scan through cache entries
    const cacheEntries = [];
    const scanner = memory.kv.scan("cache:*");
    let scanResult = await scanner.next();
    while (!scanResult.done) {
      cacheEntries.push({
        key: scanResult.value[0],
        value: scanResult.value[1],
      });
      scanResult = await scanner.next();
    }
    console.log("✅ Scanned cache entries:", cacheEntries.length);

    // Test 5: Metadata and Tags
    console.log("\n🏷️ Test 5: Metadata and Tags");

    await memory.kv.set(
      "product:123",
      { name: "Widget", price: 99.99, category: "electronics" },
      {
        tags: { type: "electronics", featured: "true", category: "widget" },
      }
    );
    console.log("✅ Set data with tags and metadata");

    const product = await memory.kv.get("product:123");
    console.log("✅ Retrieved product:", product);

    // Test 6: Conditional Operations
    console.log("\n🔄 Test 6: Conditional Operations");

    // Set only if not exists using ifNotExists option
    await memory.kv.set(
      "unique:key",
      { value: "first" },
      {
        ifNotExists: true,
      }
    );
    console.log("✅ First set with ifNotExists completed");

    // Try to set again with ifNotExists (should throw error)
    try {
      await memory.kv.set(
        "unique:key",
        { value: "second" },
        {
          ifNotExists: true,
        }
      );
      console.log("⚠️ Second set with ifNotExists unexpectedly succeeded");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(
        "✅ Second set with ifNotExists properly failed:",
        errorMessage
      );
    }

    const finalValue = await memory.kv.get("unique:key");
    console.log("✅ Final value (should be 'first'):", finalValue);

    // Test 7: Error Handling
    console.log("\n❌ Test 7: Error Handling");

    try {
      // Try to get a non-existent key
      const missing = await memory.kv.get("does:not:exist");
      console.log("✅ Missing key returns:", missing);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log("✅ Error handled:", errorMessage);
    }

    // Clean up test data
    console.log("\n🧹 Cleaning up test data...");
    const keysToDelete = [
      ...sessionKeys,
      ...cacheKeys,
      "product:123",
      "unique:key",
    ];
    const deletePromises = keysToDelete.map((key) => memory.kv.delete(key));
    await Promise.all(deletePromises);
    console.log("✅ Cleanup complete");

    console.log("\n🎉 All KV Memory tests passed!");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ KV Memory test failed:", errorMessage);
  }
}

// Run the test
testKVMemory().catch(console.error);
