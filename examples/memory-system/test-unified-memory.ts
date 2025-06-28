// Unified Memory Test
// Tests how KV, Vector, and Graph memory work together in a unified system

import {
  MemorySystem,
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "@daydreamsai/core";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences: {
    weatherDetail: "brief" | "detailed";
    notifications: boolean;
    theme: "light" | "dark";
  };
  createdAt: string;
  lastActive: string;
}

interface Conversation {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  topic: string;
  sentiment: "positive" | "neutral" | "negative";
}

async function testUnifiedMemory() {
  console.log("🌐 Testing Unified Memory System");

  const memory = new MemorySystem({
    providers: {
      kv: new InMemoryKeyValueProvider(),
      vector: new InMemoryVectorProvider(),
      graph: new InMemoryGraphProvider(),
    },
  });

  await memory.initialize();

  try {
    // Test 1: Unified User Profile Management
    console.log("\n👤 Test 1: Unified User Profile Management");

    const userProfile: UserProfile = {
      id: "user123",
      name: "Alice Johnson",
      email: "alice@example.com",
      preferences: {
        weatherDetail: "detailed",
        notifications: true,
        theme: "dark",
      },
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    // Store in KV for fast profile access
    await memory.kv.set(`profile:${userProfile.id}`, userProfile);
    console.log("✅ Stored user profile in KV memory");

    // Create user entity in graph
    await memory.graph.addEntity({
      id: `user:${userProfile.id}`,
      type: "user",
      name: userProfile.name,
      properties: { email: userProfile.email },
      contextIds: ["unified-test"],
    });
    console.log("✅ Created user entity in graph memory");

    // Index user for semantic search
    await memory.vector.index([
      {
        id: `profile:${userProfile.id}`,
        content: `User ${userProfile.name} prefers ${userProfile.preferences.weatherDetail} weather reports and uses ${userProfile.preferences.theme} theme`,
        metadata: {
          type: "profile",
          userId: userProfile.id,
          preferences: userProfile.preferences,
        },
      },
    ]);
    console.log("✅ Indexed user profile in vector memory");

    // Test 2: Cross-Memory Conversation Storage
    console.log("\n💬 Test 2: Cross-Memory Conversation Storage");

    const conversations: Conversation[] = [
      {
        id: "conv1",
        userId: userProfile.id,
        content:
          "I'd like to know the weather forecast for San Francisco with humidity details",
        timestamp: new Date().toISOString(),
        topic: "weather",
        sentiment: "neutral",
      },
      {
        id: "conv2",
        userId: userProfile.id,
        content:
          "Thanks! That detailed weather report was exactly what I needed",
        timestamp: new Date(Date.now() + 60000).toISOString(),
        topic: "weather",
        sentiment: "positive",
      },
      {
        id: "conv3",
        userId: userProfile.id,
        content: "Can you help me plan a trip to New York next week?",
        timestamp: new Date(Date.now() + 120000).toISOString(),
        topic: "travel",
        sentiment: "neutral",
      },
    ];

    for (const conv of conversations) {
      // Store conversation metadata in KV
      await memory.kv.set(`conversation:${conv.id}`, conv);

      // Index conversation content for semantic search
      await memory.vector.index([
        {
          id: `conversation:${conv.id}`,
          content: conv.content,
          metadata: {
            type: "conversation",
            userId: conv.userId,
            topic: conv.topic,
            sentiment: conv.sentiment,
            timestamp: conv.timestamp,
          },
        },
      ]);

      // Create conversation entity and relationships in graph
      await memory.graph.addEntity({
        id: `conversation:${conv.id}`,
        type: "conversation",
        name: `Conversation ${conv.id}`,
        properties: { topic: conv.topic, sentiment: conv.sentiment },
        contextIds: ["unified-test"],
      });

      await memory.graph.addRelationship({
        id: `rel:user-conv-${conv.id}`,
        from: `user:${conv.userId}`,
        to: `conversation:${conv.id}`,
        type: "had-conversation",
        strength: 0.8,
      });
    }
    console.log("✅ Stored conversations across all memory types");

    // Test 3: Unified Information Retrieval
    console.log("\n🔍 Test 3: Unified Information Retrieval");

    // Get user profile from KV (fast access)
    const retrievedProfile = await memory.kv.get<UserProfile>(
      `profile:${userProfile.id}`
    );
    console.log("✅ Retrieved profile from KV:", retrievedProfile?.name);

    // Search conversations semantically
    const weatherConversations = await memory.vector.search({
      query: "weather forecast information",
      filter: { userId: userProfile.id, type: "conversation" },
      limit: 5,
      includeContent: true,
      includeMetadata: true,
    });
    console.log("✅ Found weather conversations:", weatherConversations.length);

    // Get user's conversation history from graph
    const userConversations = await memory.graph.findRelated(
      `user:${userProfile.id}`,
      "had-conversation"
    );
    console.log("✅ Found conversations in graph:", userConversations.length);

    // Test 4: Topic-based Analysis
    console.log("\n📊 Test 4: Topic-based Analysis");

    // Add topic entities to graph
    await memory.graph.addEntity({
      id: "topic:weather",
      type: "topic",
      name: "Weather",
      properties: {},
      contextIds: ["unified-test"],
    });
    await memory.graph.addEntity({
      id: "topic:travel",
      type: "topic",
      name: "Travel",
      properties: {},
      contextIds: ["unified-test"],
    });
    console.log("✅ Added topic entities");

    // Find all weather-related conversations
    const weatherTopicConversations = await memory.vector.search({
      query: "weather forecast temperature humidity",
      filter: { topic: "weather" },
      limit: 10,
      includeContent: true,
      includeMetadata: true,
    });
    console.log(
      "✅ Weather topic conversations:",
      weatherTopicConversations.length
    );

    // Get entities related to weather topic from graph
    const topicConnections = await memory.graph.findRelated("topic:weather");
    console.log(
      "✅ Graph connections to weather topic:",
      topicConnections.length
    );

    // Test 5: User Preference Inference
    console.log("\n🎯 Test 5: User Preference Inference");

    // Search for user preference patterns
    const preferenceIndicators = await memory.vector.search({
      query: "detailed weather reports preferences",
      filter: { userId: userProfile.id },
      minScore: 0.5,
      includeContent: true,
      includeMetadata: true,
    });
    console.log("✅ Preference indicators found:", preferenceIndicators.length);

    // Get user preference relationships from graph
    const preferenceEntities = await memory.graph.findRelated(
      `user:${userProfile.id}`,
      "prefers"
    );
    console.log("✅ User preferences in graph:", preferenceEntities.length);

    // Test 6: Context-Aware Recommendations
    console.log("\n💡 Test 6: Context-Aware Recommendations");

    // Add some recommendation data
    await memory.kv.set("recommendations:weather", {
      detailed: ["Include humidity", "Include wind speed", "Include UV index"],
      brief: ["Temperature only", "Basic conditions"],
    });

    // Store recommendation rules in vector memory
    await memory.vector.index([
      {
        id: "rec:detailed-weather",
        content:
          "For users who prefer detailed weather reports, include humidity, wind speed, and UV index",
        metadata: {
          type: "recommendation",
          category: "weather",
          level: "detailed",
        },
      },
    ]);

    // Get user's preference from KV
    const userPref = retrievedProfile?.preferences.weatherDetail;
    console.log("✅ User weather preference:", userPref);

    // Find relevant recommendations
    const recommendations = await memory.vector.search({
      query: `${userPref} weather report recommendations`,
      filter: { type: "recommendation", category: "weather" },
      limit: 3,
      includeContent: true,
      includeMetadata: true,
    });
    console.log("✅ Relevant recommendations:", recommendations.length);

    // Test 7: Memory Consistency Check
    console.log("\n✅ Test 7: Memory Consistency Check");

    // Verify data exists across all memory types
    const kvConversation = await memory.kv.get<Conversation>(
      "conversation:conv1"
    );

    // Search for the conversation in vector memory
    const vectorConversationResults = await memory.vector.search({
      query: "weather forecast San Francisco humidity",
      filter: { type: "conversation" },
      limit: 1,
    });
    const vectorConversation =
      vectorConversationResults.length > 0
        ? vectorConversationResults[0]
        : null;

    const graphConversation = await memory.graph.findRelated(
      "conversation:conv1"
    );

    console.log("✅ Conversation in KV:", kvConversation ? "✓" : "✗");
    console.log("✅ Conversation in Vector:", vectorConversation ? "✓" : "✗");
    console.log(
      "✅ Conversation in Graph:",
      graphConversation.length > 0 ? "✓" : "✗"
    );

    // Test 8: Complex Query Combining All Memory Types
    console.log("\n🔄 Test 8: Complex Query Combining All Memory Types");

    // Scenario: Find conversations about a topic, get user preferences, and recommend similar users

    // 1. Find weather conversations (Vector)
    const relatedConversations = await memory.vector.search({
      query: "weather forecast temperature",
      limit: 10,
    });

    // 2. Get user IDs from conversations (KV)
    const userIds = new Set<string>();
    for (const conv of relatedConversations) {
      if (conv.metadata?.userId) {
        userIds.add(conv.metadata.userId);
      }
    }

    // 3. Find user relationships (Graph)
    const userConnections = [];
    for (const userId of userIds) {
      const connections = await memory.graph.findRelated(`user:${userId}`);
      userConnections.push({ userId, connections: connections.length });
    }

    console.log("✅ Complex query results:");
    console.log(
      `  - Found ${relatedConversations.length} related conversations`
    );
    console.log(`  - Involving ${userIds.size} users`);
    console.log(
      `  - User connections: ${userConnections
        .map((u) => `${u.userId}: ${u.connections}`)
        .join(", ")}`
    );

    // Test 9: Memory Performance Comparison
    console.log("\n⚡ Test 9: Memory Performance Comparison");

    // KV lookup (should be fastest)
    const kvStart = Date.now();
    await memory.kv.get(`profile:${userProfile.id}`);
    const kvTime = Date.now() - kvStart;

    // Vector search (moderate speed)
    const vectorStart = Date.now();
    await memory.vector.search({
      query: "user profile",
      limit: 1,
      includeContent: true,
    });
    const vectorTime = Date.now() - vectorStart;

    // Graph traversal (variable speed)
    const graphStart = Date.now();
    await memory.graph.findRelated(`user:${userProfile.id}`);
    const graphTime = Date.now() - graphStart;

    console.log("✅ Performance comparison:");
    console.log(`  - KV lookup: ${kvTime}ms`);
    console.log(`  - Vector search: ${vectorTime}ms`);
    console.log(`  - Graph traversal: ${graphTime}ms`);

    // Clean up test data
    console.log("\n🧹 Cleaning up test data...");

    // Clean KV data (using individual delete operations)
    const kvKeys = [
      `profile:${userProfile.id}`,
      "recommendations:weather",
      ...conversations.map((c) => `conversation:${c.id}`),
    ];
    const kvDeletePromises = kvKeys.map((key) => memory.kv.delete(key));
    await Promise.all(kvDeletePromises);

    // Clean vector data (using array of IDs)
    const vectorIds = [
      `profile:${userProfile.id}`,
      "rec:detailed-weather",
      ...conversations.map((c) => `conversation:${c.id}`),
    ];
    try {
      await memory.vector.delete(vectorIds);
    } catch (error) {
      // Ignore cleanup errors - delete individual IDs if batch fails
      for (const id of vectorIds) {
        try {
          await memory.vector.delete([id]);
        } catch (individualError) {
          // Ignore individual cleanup errors
        }
      }
    }

    // Clean graph data (using removeEntity)
    const graphNodes = [
      `user:${userProfile.id}`,
      "topic:weather",
      "topic:travel",
      ...conversations.map((c) => `conversation:${c.id}`),
    ];
    for (const nodeId of graphNodes) {
      try {
        await memory.graph.removeEntity(nodeId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    console.log("✅ Cleanup complete");
    console.log("\n🎉 All Unified Memory tests passed!");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Unified Memory test failed:", errorMessage);
  }
}

// Run the test
testUnifiedMemory().catch(console.error);
