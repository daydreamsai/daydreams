# Memory System Example Setup

## Prerequisites

1. **Node.js/Bun**: Make sure you have Node.js 18+ or Bun installed
2. **OpenAI API Key**: Required for embeddings and LLM functionality
3. **Supabase Account**: For the full-featured memory provider

## Quick Setup

### 1. Install Dependencies

From the project root:
```bash
cd examples/memory-system
bun install
```

### 2. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
OPENAI_API_KEY=sk-your-actual-openai-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings → API to get your URL and service key
3. The memory system will automatically create the required tables

### 4. Run Tests

Test individual components:
```bash
bun run test-kv        # Test key-value memory
bun run test-vector    # Test vector/semantic search
bun run test-graph     # Test graph relationships
bun run test-unified   # Test unified memory system
```

Or run the complete test suite:
```bash
bun run test-all       # Run all memory tests
```

### 5. Interactive Example

Run the interactive agent example:
```bash
bun run dev
```

## What Each Test Covers

### Key-Value Memory (`test-kv`)
- ✅ Basic CRUD operations (set, get, delete)
- ✅ Batch operations (setBatch, getBatch, deleteBatch)
- ✅ TTL and expiration handling
- ✅ Pattern matching with wildcards
- ✅ Scanning with iterators
- ✅ Metadata and tagging
- ✅ Conditional operations
- ✅ Error handling

### Vector Memory (`test-vector`)
- ✅ Document indexing and embedding
- ✅ Semantic search with similarity scores
- ✅ Metadata filtering
- ✅ Namespace isolation
- ✅ Similarity threshold testing
- ✅ Bulk operations
- ✅ Document retrieval by ID
- ✅ Document updates
- ✅ Performance testing

### Graph Memory (`test-graph`)
- ✅ Node and edge creation
- ✅ Relationship mapping
- ✅ Neighbor queries (incoming/outgoing/both)
- ✅ Multi-hop path finding
- ✅ Edge type filtering
- ✅ Bidirectional relationships
- ✅ Metadata on nodes and edges
- ✅ Weighted relationships
- ✅ Complex path finding
- ✅ Graph analytics

### Unified Memory (`test-unified`)
- ✅ Cross-memory-type operations
- ✅ User profile management
- ✅ Conversation storage and retrieval
- ✅ Topic-based analysis
- ✅ Preference inference
- ✅ Context-aware recommendations
- ✅ Memory consistency checks
- ✅ Complex queries combining all types
- ✅ Performance comparisons

### Complete Test Suite (`test-all`)
- ✅ Memory initialization
- ✅ All memory operations
- ✅ Agent integration
- ✅ Performance benchmarks
- ✅ Error handling
- ✅ Test result summary

## Troubleshooting

### Common Issues

**"Missing API Key" Error**
- Make sure your `.env` file has the correct API keys
- Verify the keys are valid and have the right permissions

**"Connection Failed" Error**
- Check your Supabase URL and service key
- Ensure your Supabase project is active
- Verify network connectivity

**"Slow Performance" Warning**
- This is normal for the first run (table creation)
- Subsequent runs should be much faster
- Check your internet connection for vector operations

**"Vector Search No Results"**
- The embedding model needs time to process
- Very high similarity thresholds may return no results
- Try lowering the `minScore` parameter

### Advanced Configuration

For production use, consider:

1. **Connection Pooling**: Adjust `maxConnections` in provider config
2. **Caching**: Enable middleware for better performance
3. **Batch Size**: Tune batch operations for your use case
4. **Retry Logic**: Configure retry attempts and delays
5. **Monitoring**: Add performance metrics and health checks

## Next Steps

After running the tests successfully:

1. **Integrate with Your Agent**: Use the patterns from `index.ts`
2. **Customize Memory Schema**: Adapt the examples to your data structure
3. **Add Middleware**: Implement caching, compression, or custom logic
4. **Scale Up**: Configure for production workloads
5. **Monitor Performance**: Track memory usage and query performance

## Example Output

Successful test run should show:
```
🧠 Starting Comprehensive Memory System Tests
======================================================

🔄 Running Memory Initialization...
✅ Memory Initialization passed in 250ms

🔄 Running Key-Value Operations...
✅ Key-Value Operations passed in 180ms

🔄 Running Vector Operations...
✅ Vector Operations passed in 420ms

🔄 Running Graph Operations...
✅ Graph Operations passed in 310ms

🔄 Running Agent Integration...
✅ Agent Integration passed in 890ms

🔄 Running Memory Performance...
✅ Memory Performance passed in 1200ms

🔄 Running Error Handling...
✅ Error Handling passed in 150ms

============================================================
🏁 Test Results Summary
============================================================

Overall: 7/7 tests passed
Total Duration: 3400ms

🎉 All tests passed! Memory system is working correctly.
```