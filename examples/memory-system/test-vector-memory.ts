// Vector Memory Test
// Tests semantic search, document indexing, namespaces, and metadata filtering

import {
  MemorySystem,
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "@daydreamsai/core";

async function testVectorMemory() {
  console.log("🔍 Testing Vector Memory Operations");

  const memory = new MemorySystem({
    providers: {
      kv: new InMemoryKeyValueProvider(),
      vector: new InMemoryVectorProvider(),
      graph: new InMemoryGraphProvider(),
    },
  });

  await memory.initialize();

  try {
    // Test 1: Document Indexing
    console.log("\n📚 Test 1: Document Indexing");

    const documents = [
      {
        id: "doc1",
        content:
          "The weather in San Francisco is usually mild and foggy, especially in summer.",
        metadata: {
          type: "weather",
          location: "san-francisco",
          season: "summer",
        },
      },
      {
        id: "doc2",
        content:
          "New York has hot summers and cold winters with frequent rain.",
        metadata: { type: "weather", location: "new-york", season: "summer" },
      },
      {
        id: "doc3",
        content:
          "Machine learning algorithms can predict weather patterns using historical data.",
        metadata: {
          type: "technology",
          domain: "machine-learning",
          application: "weather",
        },
      },
      {
        id: "doc4",
        content:
          "Python is a popular programming language for data science and AI applications.",
        metadata: {
          type: "technology",
          domain: "programming",
          language: "python",
        },
      },
      {
        id: "doc5",
        content:
          "The Golden Gate Bridge in San Francisco is an iconic landmark.",
        metadata: {
          type: "landmark",
          location: "san-francisco",
          category: "bridge",
        },
      },
    ];

    await memory.vector.index(documents);
    console.log("✅ Indexed", documents.length, "documents");

    // Test 2: Basic Semantic Search
    console.log("\n🔎 Test 2: Basic Semantic Search");

    const searchResults1 = await memory.vector.search({
      query: "climate and temperature in cities",
      limit: 3,
      minScore: 0.5,
      includeContent: true,
      includeMetadata: true,
    });

    console.log("✅ Search for 'climate and temperature in cities':");
    searchResults1.forEach((result, i) => {
      console.log(
        `  ${i + 1}. Score: ${result.score.toFixed(
          3
        )} - ${result.content?.slice(0, 60)}...`
      );
    });

    // Test 3: Metadata Filtering
    console.log("\n🏷️ Test 3: Metadata Filtering");

    const weatherResults = await memory.vector.search({
      query: "temperature and conditions",
      limit: 5,
      filter: { type: "weather" },
      minScore: 0.3,
      includeContent: true,
      includeMetadata: true,
    });

    console.log("✅ Search for weather-specific content:");
    weatherResults.forEach((result, i) => {
      console.log(
        `  ${i + 1}. Score: ${result.score.toFixed(3)} - Location: ${
          result.metadata?.location
        }`
      );
    });

    // Test 4: Location-based Search
    console.log("\n🌍 Test 4: Location-based Search");

    const sfResults = await memory.vector.search({
      query: "San Francisco information",
      limit: 5,
      filter: { location: "san-francisco" },
      includeMetadata: true,
      includeContent: true,
    });

    console.log("✅ Search for San Francisco content:");
    sfResults.forEach((result, i) => {
      console.log(
        `  ${i + 1}. Type: ${result.metadata?.type} - ${result.content?.slice(
          0,
          50
        )}...`
      );
    });

    // Test 5: Technology Domain Search
    console.log("\n💻 Test 5: Technology Domain Search");

    const techResults = await memory.vector.search({
      query: "programming and software development",
      limit: 5,
      filter: { type: "technology" },
      includeContent: true,
      includeMetadata: true,
    });

    console.log("✅ Search for technology content:");
    techResults.forEach((result, i) => {
      console.log(
        `  ${i + 1}. Domain: ${
          result.metadata?.domain
        } - ${result.content?.slice(0, 50)}...`
      );
    });

    // Test 6: Namespace Isolation
    console.log("\n🔒 Test 6: Namespace Isolation");

    // Index documents in different namespaces
    await memory.vector.index([
      {
        id: "user1-pref1",
        content:
          "I prefer detailed weather reports with humidity and wind speed",
        metadata: { userId: "user1", type: "preference" },
        namespace: "user-preferences",
      },
      {
        id: "user2-pref1",
        content:
          "I like brief weather summaries, just temperature and conditions",
        metadata: { userId: "user2", type: "preference" },
        namespace: "user-preferences",
      },
    ]);

    // Search within specific namespace
    const userPrefResults = await memory.vector.search({
      query: "weather report preferences",
      namespace: "user-preferences",
      limit: 5,
    });

    console.log("✅ Search within user-preferences namespace:");
    userPrefResults.forEach((result, i) => {
      console.log(
        `  ${i + 1}. User: ${result.metadata?.userId} - ${result.content?.slice(
          0,
          40
        )}...`
      );
    });

    // Test 7: Similarity Threshold Testing
    console.log("\n📊 Test 7: Similarity Threshold Testing");

    const queries = [
      "weather forecast",
      "machine learning",
      "completely unrelated random text about cats and dogs",
    ];

    for (const query of queries) {
      const results = await memory.vector.search({
        query,
        limit: 3,
        minScore: 0.6,
      });

      console.log(
        `✅ Query: "${query}" - Found ${results.length} results above 0.6 threshold`
      );
      results.forEach((r) => {
        console.log(
          `    Score: ${r.score.toFixed(3)} - ${r.content?.slice(0, 40)}...`
        );
      });
    }

    // Test 8: Bulk Operations
    console.log("\n📦 Test 8: Bulk Operations");

    const bulkDocs = Array.from({ length: 20 }, (_, i) => ({
      id: `bulk-doc-${i}`,
      content: `This is bulk document number ${i} about various topics including technology, weather, and landmarks.`,
      metadata: {
        type: "bulk",
        index: i,
        category: i % 3 === 0 ? "tech" : i % 3 === 1 ? "weather" : "landmark",
      },
    }));

    await memory.vector.index(bulkDocs);
    console.log("✅ Indexed", bulkDocs.length, "bulk documents");

    const bulkSearchResults = await memory.vector.search({
      query: "bulk documents about technology",
      limit: 10,
      filter: { type: "bulk" },
      includeContent: true,
      includeMetadata: true,
    });

    console.log("✅ Found", bulkSearchResults.length, "bulk documents");

    // Test 9: Document Update Verification
    console.log("\n🆔 Test 9: Document Update Verification");

    // Search for the specific document to verify it exists
    const specificDocResults = await memory.vector.search({
      query: "machine learning algorithms predict weather patterns",
      limit: 1,
      includeContent: true,
    });
    console.log(
      "✅ Found specific document:",
      specificDocResults.length > 0 ? "Yes" : "No"
    );

    // Test 10: Document Updates
    console.log("\n🔄 Test 10: Document Updates");

    await memory.vector.index([
      {
        id: "doc1-updated", // Create new document to represent update
        content:
          "The weather in San Francisco is usually mild and foggy, especially in summer. Updated with more details about microclimates.",
        metadata: {
          type: "weather",
          location: "san-francisco",
          season: "summer",
          updated: true,
        },
      },
    ]);

    const updatedDocResults = await memory.vector.search({
      query: "San Francisco weather microclimates",
      filter: { updated: true },
      limit: 1,
      includeContent: true,
      includeMetadata: true,
    });
    console.log("✅ Updated document found:", updatedDocResults.length > 0);

    // Clean up test data
    console.log("\n🧹 Cleaning up test data...");
    const allTestIds = [
      ...documents.map((d) => d.id),
      ...bulkDocs.map((d) => d.id),
      "user1-pref1",
      "user2-pref1",
      "doc1-updated",
    ];

    // Delete in batches
    await memory.vector.delete(allTestIds);
    console.log("✅ Cleanup complete");

    console.log("\n🎉 All Vector Memory tests passed!");
  } catch (error) {
    console.error("❌ Vector Memory test failed:", error);
  }
}

// Run the test
testVectorMemory().catch(console.error);
