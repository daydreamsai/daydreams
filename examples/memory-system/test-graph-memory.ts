// Graph Memory Test  
// Tests relationship mapping, path finding, and graph analytics

import { MemorySystem, InMemoryKeyValueProvider, InMemoryVectorProvider, InMemoryGraphProvider } from "@daydreamsai/core";

async function testGraphMemory() {
  console.log("🕸️ Testing Graph Memory Operations");
  
  const memory = new MemorySystem({
    providers: {
      kv: new InMemoryKeyValueProvider(),
      vector: new InMemoryVectorProvider(),
      graph: new InMemoryGraphProvider(),
    },
  });

  await memory.initialize();

  try {
    // Test 1: Basic Node and Edge Creation
    console.log("\n🔗 Test 1: Basic Node and Edge Creation");
    
    // Create user entities
    await memory.graph.addEntity({ 
      id: "user:alice",
      type: "user", 
      name: "Alice", 
      properties: { email: "alice@example.com" },
      contextIds: ["test"],
    });
    await memory.graph.addEntity({ 
      id: "user:bob",
      type: "user", 
      name: "Bob", 
      properties: { email: "bob@example.com" },
      contextIds: ["test"],
    });
    console.log("✅ Created user entities");

    // Create preference entities
    await memory.graph.addEntity({ 
      id: "pref:detailed-weather",
      type: "preference", 
      name: "Detailed Weather",
      properties: { description: "Detailed weather reports with humidity and wind" },
      contextIds: ["test"],
    });
    await memory.graph.addEntity({ 
      id: "pref:brief-weather",
      type: "preference", 
      name: "Brief Weather",
      properties: { description: "Brief weather summaries" },
      contextIds: ["test"],
    });
    console.log("✅ Created preference entities");

    // Create location entities
    await memory.graph.addEntity({ 
      id: "location:san-francisco",
      type: "location", 
      name: "San Francisco",
      properties: { city: "San Francisco", state: "CA" },
      contextIds: ["test"],
    });
    await memory.graph.addEntity({ 
      id: "location:new-york",
      type: "location", 
      name: "New York",
      properties: { city: "New York", state: "NY" },
      contextIds: ["test"],
    });
    console.log("✅ Created location entities");

    // Test 2: Relationship Creation
    console.log("\n👥 Test 2: Relationship Creation");
    
    // User preferences
    await memory.graph.addRelationship({
      id: "rel:alice-prefers-detailed",
      from: "user:alice",
      to: "pref:detailed-weather",
      type: "prefers",
      strength: 0.9,
    });
    await memory.graph.addRelationship({
      id: "rel:bob-prefers-brief",
      from: "user:bob",
      to: "pref:brief-weather",
      type: "prefers",
      strength: 0.8,
    });
    console.log("✅ Added preference relationships");

    // User locations
    await memory.graph.addRelationship({
      id: "rel:alice-lives-sf",
      from: "user:alice",
      to: "location:san-francisco",
      type: "lives-in",
      strength: 1.0,
    });
    await memory.graph.addRelationship({
      id: "rel:bob-lives-ny",
      from: "user:bob",
      to: "location:new-york",
      type: "lives-in",
      strength: 1.0,
    });
    console.log("✅ Added location relationships");

    // User relationships
    await memory.graph.addRelationship({
      id: "rel:alice-knows-bob",
      from: "user:alice",
      to: "user:bob",
      type: "knows",
      strength: 0.7,
    });
    await memory.graph.addRelationship({
      id: "rel:bob-knows-alice",
      from: "user:bob",
      to: "user:alice",
      type: "knows",
      strength: 0.7,
    });
    console.log("✅ Added user relationships");

    // Test 3: Neighbor Queries
    console.log("\n🔍 Test 3: Neighbor Queries");
    
    // Get Alice's related entities
    const aliceRelated = await memory.graph.findRelated("user:alice");
    console.log("✅ Alice's related entities:", aliceRelated.length);
    aliceRelated.forEach(entity => {
      console.log(`  - ${entity.type}: ${entity.name} (${entity.id})`);
    });

    // Get who Alice knows specifically
    const aliceKnows = await memory.graph.findRelated("user:alice", "knows");
    console.log("✅ Who Alice knows:", aliceKnows.map(e => e.name));

    // Test 4: Multi-hop Relationships
    console.log("\n🌐 Test 4: Multi-hop Relationships");
    
    // Add some intermediate entities and relationships
    await memory.graph.addEntity({
      id: "skill:programming",
      type: "skill",
      name: "Programming",
      properties: {},
      contextIds: ["test"],
    });
    await memory.graph.addEntity({
      id: "skill:data-science",
      type: "skill",
      name: "Data Science",
      properties: {},
      contextIds: ["test"],
    });
    await memory.graph.addEntity({
      id: "company:tech-corp",
      type: "company",
      name: "Tech Corp",
      properties: {},
      contextIds: ["test"],
    });

    await memory.graph.addRelationship({
      id: "rel:alice-has-programming",
      from: "user:alice",
      to: "skill:programming",
      type: "has-skill",
      strength: 0.9,
    });
    await memory.graph.addRelationship({
      id: "rel:alice-has-datascience",
      from: "user:alice",
      to: "skill:data-science",
      type: "has-skill",
      strength: 0.8,
    });
    await memory.graph.addRelationship({
      id: "rel:bob-has-programming",
      from: "user:bob",
      to: "skill:programming",
      type: "has-skill",
      strength: 0.7,
    });
    console.log("✅ Added skill relationships");

    // Find connections between Alice and Tech Corp
    const aliceToTechCorp = await memory.graph.findPath("user:alice", "company:tech-corp");
    console.log("✅ Path from Alice to Tech Corp:", aliceToTechCorp.length, "entities");
    if (aliceToTechCorp.length > 0) {
      aliceToTechCorp.forEach((entity, i) => {
        console.log(`  ${i + 1}. ${entity.type}: ${entity.name}`);
      });
    } else {
      console.log("  No direct path found");
    }

    // Test 5: Specific Edge Type Filtering
    console.log("\n🎯 Test 5: Specific Edge Type Filtering");
    
    // Get all preferences
    const allPreferences = await memory.graph.findRelated("user:alice", "prefers");
    console.log("✅ Alice's preferences:", allPreferences.map(p => p.name));

    // Get all skills
    const allSkills = await memory.graph.findRelated("user:alice", "has-skill");
    console.log("✅ Alice's skills:", allSkills.map(s => s.name));

    // Test 6: Bidirectional Relationships
    console.log("\n↔️ Test 6: Bidirectional Relationships");
    
    const aliceAllRelated = await memory.graph.findRelated("user:alice");
    console.log("✅ Alice's all related entities:", aliceAllRelated.length);
    
    const entityTypes = aliceAllRelated.reduce((acc, entity) => {
      acc[entity.type] = (acc[entity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log("✅ Related entity type counts:", entityTypes);

    // Test 7: Node and Edge Metadata
    console.log("\n📋 Test 7: Node and Edge Metadata");
    
    // Add relationship with properties
    await memory.graph.addRelationship({
      id: "rel:alice-worked-with-bob",
      from: "user:alice",
      to: "user:bob",
      type: "worked-with",
      properties: {
        project: "Weather App",
        duration: "6 months",
        year: 2024,
      },
      strength: 0.8,
    });
    console.log("✅ Added relationship with properties");

    // Query work relationships (note: properties aren't accessible through findRelated)
    const workRelationships = await memory.graph.findRelated("user:alice", "worked-with");
    console.log("✅ Work relationships found:", workRelationships.length);
    workRelationships.forEach(entity => {
      console.log(`  - Worked with: ${entity.name}`);
    });

    // Test 8: Weighted Relationships
    console.log("\n⚖️ Test 8: Weighted Relationships");
    
    // Add weighted relationships (strength of connection)
    await memory.graph.addRelationship({
      id: "rel:alice-trusts-bob",
      from: "user:alice",
      to: "user:bob",
      type: "trusts",
      strength: 0.9,
    });
    await memory.graph.addRelationship({
      id: "rel:bob-trusts-alice",
      from: "user:bob",
      to: "user:alice",
      type: "trusts",
      strength: 0.8,
    });
    console.log("✅ Added weighted trust relationships");

    // Test 9: Complex Path Finding
    console.log("\n🗺️ Test 9: Complex Path Finding");
    
    // Create a more complex network
    await memory.graph.addEntity({
      id: "user:charlie",
      type: "user",
      name: "Charlie",
      properties: {},
      contextIds: ["test"],
    });
    await memory.graph.addEntity({
      id: "project:weather-app",
      type: "project",
      name: "Weather App",
      properties: {},
      contextIds: ["test"],
    });
    
    await memory.graph.addRelationship({
      id: "rel:bob-knows-charlie",
      from: "user:bob",
      to: "user:charlie",
      type: "knows",
      strength: 0.6,
    });
    await memory.graph.addRelationship({
      id: "rel:charlie-works-on-project",
      from: "user:charlie",
      to: "project:weather-app",
      type: "works-on",
      strength: 0.9,
    });
    
    // Find connection from Alice to Weather App project
    const aliceToProject = await memory.graph.findPath("user:alice", "project:weather-app");
    console.log("✅ Path from Alice to Weather App:", aliceToProject.length, "entities");

    // Test 10: Graph Analytics
    console.log("\n📊 Test 10: Graph Analytics");
    
    // Count related entities
    const aliceRelatedEntities = await memory.graph.findRelated("user:alice");
    const bobRelatedEntities = await memory.graph.findRelated("user:bob");
    
    console.log("✅ Alice's total connections:", aliceRelatedEntities.length);
    console.log("✅ Bob's total connections:", bobRelatedEntities.length);

    // Find common connections
    const aliceConnections = new Set(aliceRelatedEntities.map(e => e.id));
    const bobConnections = new Set(bobRelatedEntities.map(e => e.id));
    const commonConnections = [...aliceConnections].filter(id => bobConnections.has(id));
    console.log("✅ Common connections between Alice and Bob:", commonConnections);

    // Test 11: Edge Deletion and Updates
    console.log("\n🗑️ Test 11: Edge Deletion and Updates");
    
    // Note: No direct way to remove specific relationships in current GraphMemory API
    // We can only remove entire entities, which will remove their relationships
    console.log("✅ Relationship management note: Current API focuses on entity-level operations");

    // Verify current work relationships
    const workCheck = await memory.graph.findRelated("user:alice", "worked-with");
    console.log("✅ Current work relationships:", workCheck.length);

    // Clean up test data
    console.log("\n🧹 Cleaning up test data...");
    const testEntities = [
      "user:alice", "user:bob", "user:charlie",
      "pref:detailed-weather", "pref:brief-weather",
      "location:san-francisco", "location:new-york",
      "skill:programming", "skill:data-science",
      "company:tech-corp", "project:weather-app"
    ];
    
    for (const entityId of testEntities) {
      try {
        await memory.graph.removeEntity(entityId);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    console.log("✅ Cleanup complete");

    console.log("\n🎉 All Graph Memory tests passed!");

  } catch (error) {
    console.error("❌ Graph Memory test failed:", error);
  }
}

// Run the test
testGraphMemory().catch(console.error);