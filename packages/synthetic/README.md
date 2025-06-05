# @daydreamsai/synthetic

Synthetic data generation for AI agent training - creating a symbiotic
relationship between agent reasoning and model training.

## Overview

This package captures your agent's reasoning process and converts it into
high-quality training datasets. Turn on 'synthetic' generation and your agent
automatically generates perfectly formatted datasets from its thoughts, actions,
and conversations.

## Key Features

- **Real-time data capture** - Monitor agent reasoning as it happens
- **Multiple export formats** - Instruction tuning, conversation, reasoning
  chains, action sequences, episodes, GRPO preference data
- **Quality analysis** - Built-in quality scoring and issue detection
- **Privacy controls** - Redact sensitive patterns, anonymize users
- **Seamless integration** - Works with any Daydreams agent through extensions

## Quick Start

### Basic Usage

```typescript
import { createDreams } from "@daydreamsai/core";
import { createSyntheticData } from "@daydreamsai/synthetic";

const agent = createDreams({
  model: groq("deepseek-r1-distill-llama-70b"),
  contexts: [cli],
  extensions: [
    createSyntheticData({
      enabled: true,
      outputDir: "./training-data",
      formats: ["instruction-tuning", "conversation"],
      mode: "realtime",
    }),
  ],
});
```

### Advanced Configuration

```typescript
import { createSyntheticExtension } from "@daydreamsai/synthetic";

const syntheticExtension = createSyntheticExtension({
  enabled: true,
  outputDir: "./synthetic-data",
  formats: ["instruction-tuning", "reasoning-chains", "episodes"],

  capture: {
    conversations: true,
    reasoning: true,
    actions: true,
    episodes: true,
  },

  filters: {
    minConversationLength: 3,
    successfulOnly: false,
    contexts: ["cli", "discord"],
    actions: ["web_search", "calculate"],
  },

  privacy: {
    redactPatterns: [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/],
    anonymizeUsers: true,
    removeTimestamps: false,
  },

  mode: "batch",
  batchSize: 100,
});
```

## Data Formats

### Instruction Tuning Format

Perfect for fine-tuning language models:

```json
{
  "instruction": "What's the weather like today?",
  "response": "I can search for current weather information for you. What city would you like me to check?",
  "system": "You are a helpful AI assistant agent.",
  "context": "Context: cli, ID: session_123"
}
```

### Conversation Format

Multi-turn dialogue training:

```json
{
  "messages": [
    { "role": "user", "content": "Hello!" },
    { "role": "assistant", "content": "Hi! How can I help you today?" },
    { "role": "user", "content": "I need help with my tasks" },
    {
      "role": "assistant",
      "content": "I'd be happy to help you organize your tasks. What would you like to work on?"
    }
  ],
  "summary": "Conversation with 2 user messages and 2 assistant responses"
}
```

### Reasoning Chains Format

Step-by-step thinking for chain-of-thought training:

```json
{
  "problem": "Calculate the ROI for a $10,000 investment that returned $12,500",
  "reasoning": [
    {
      "step": 1,
      "thought": "I need to calculate ROI using the formula (Returns - Investment) / Investment * 100"
    },
    { "step": 2, "thought": "Returns = $12,500, Investment = $10,000" },
    {
      "step": 3,
      "action": "calculate({\"operation\": \"subtract\", \"a\": 12500, \"b\": 10000})",
      "result": "2500"
    },
    {
      "step": 4,
      "action": "calculate({\"operation\": \"divide\", \"a\": 2500, \"b\": 10000})",
      "result": "0.25"
    },
    {
      "step": 5,
      "action": "calculate({\"operation\": \"multiply\", \"a\": 0.25, \"b\": 100})",
      "result": "25"
    }
  ],
  "conclusion": "The ROI is 25%"
}
```

### Action Sequences Format

Action usage patterns:

```json
{
  "situation": "User wants to know the weather",
  "actions": [
    {
      "name": "web_search",
      "arguments": { "query": "current weather San Francisco" },
      "result": { "temperature": "72°F", "conditions": "sunny" },
      "timestamp": 1704067200000,
      "success": true
    }
  ],
  "outcome": "Provided current weather information for San Francisco"
}
```

### Episodes Format

Complete interaction episodes:

```json
{
  "episodeId": "session_123",
  "observation": "User asked for help with productivity",
  "thoughts": [
    "The user needs help with productivity",
    "I should suggest task management strategies",
    "Let me provide specific actionable advice"
  ],
  "actions": [
    {
      "name": "suggest_tasks",
      "arguments": { "category": "productivity" },
      "result": ["Use time blocking", "Set priorities", "Take breaks"],
      "timestamp": 1704067200000,
      "success": true
    }
  ],
  "result": "Provided productivity advice and task management suggestions",
  "success": true,
  "duration": 15000
}
```

### GRPO Format

Group Relative Policy Optimization training with preference data:

```json
{
  "prompt": "Explain the concept of machine learning in simple terms",
  "responses": [
    {
      "text": "Machine learning is a type of artificial intelligence where computers learn to make predictions or decisions by finding patterns in data, rather than being explicitly programmed for every scenario.",
      "score": 0.9,
      "rank": 1,
      "success": true,
      "model": "gpt-4",
      "metadata": { "outputId": "out_001", "timestamp": 1704067705000 }
    },
    {
      "text": "Machine learning is when computers learn stuff from data to make predictions.",
      "score": 0.6,
      "rank": 2,
      "success": true,
      "model": "gpt-3.5",
      "metadata": { "outputId": "out_002", "timestamp": 1704067706000 }
    },
    {
      "text": "I'm not sure how to explain machine learning.",
      "score": 0.2,
      "rank": 3,
      "success": false,
      "model": "basic-model",
      "metadata": { "outputId": "out_003", "timestamp": 1704067707000 }
    }
  ],
  "system": "You are a helpful AI assistant agent.",
  "context": "Context: cli, ID: session_011",
  "comparisons": [
    { "preferred": 0, "rejected": 1, "confidence": 0.6 },
    { "preferred": 0, "rejected": 2, "confidence": 0.9 },
    { "preferred": 1, "rejected": 2, "confidence": 0.8 }
  ]
}
```

## Agent Actions

The extension adds these actions to your agent:

### Process Data

```typescript
// Process accumulated logs and export
await agent.callAction("synthetic.process", {
  export: true,
  analyze: true,
});
```

### Configure Settings

```typescript
// Update configuration on the fly
await agent.callAction("synthetic.configure", {
  enabled: true,
  mode: "batch",
  formats: ["instruction-tuning", "episodes"],
});
```

### Analyze Quality

```typescript
// Analyze data quality
await agent.callAction("synthetic.analyze", {
  filePath: "./synthetic-data/dataset.jsonl",
});
```

### Export Episodes

```typescript
// Export all stored episodes
await agent.callAction("synthetic.exportAllEpisodes", {
  format: "episodes",
});
```

## Quality Analysis

The package includes comprehensive quality analysis:

```typescript
import { SyntheticAnalyzer } from "@daydreamsai/synthetic";

const analyzer = new SyntheticAnalyzer();
const quality = analyzer.analyzeQuality(records);

console.log(quality);
// {
//   overallScore: 0.85,
//   diversity: 0.92,
//   completeness: 0.88,
//   consistency: 0.75,
//   byFormat: {
//     "instruction-tuning": 0.90,
//     "conversation": 0.85,
//     "reasoning-chains": 0.80
//   }
// }
```

## Privacy & Security

Built-in privacy controls:

```typescript
const config = {
  privacy: {
    // Redact email addresses
    redactPatterns: [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/],

    // Anonymize user IDs
    anonymizeUsers: true,

    // Remove timestamps for privacy
    removeTimestamps: false,
  },
};
```

## Use Cases

### Fine-tuning Personal Assistant

Capture your agent's conversations to create a personalized model:

```typescript
createSyntheticData({
  formats: ["instruction-tuning", "conversation"],
  capture: { conversations: true, reasoning: false },
  filters: { minConversationLength: 2, successfulOnly: true },
});
```

### Training Reasoning Models

Capture step-by-step thinking for chain-of-thought models:

```typescript
createSyntheticData({
  formats: ["reasoning-chains"],
  capture: { reasoning: true, actions: true },
  filters: { contexts: ["complex-problem-solving"] },
});
```

### Action Pattern Learning

Learn from successful action sequences:

```typescript
createSyntheticData({
  formats: ["action-sequences", "episodes"],
  capture: { actions: true, episodes: true },
  filters: { successfulOnly: true },
});
```

### GRPO Preference Training

Generate preference data for Group Relative Policy Optimization:

```typescript
createSyntheticData({
  formats: ["grpo"],
  capture: { preferences: true },
  filters: {
    minConversationLength: 1,
    successfulOnly: false, // Include failures for better preference learning
  },
});
```

## Integration with Training

Export data in formats ready for popular training frameworks:

### Hugging Face Transformers

```bash
# JSONL format ready for transformers
python train.py --data_path ./synthetic-data/instruction-tuning-*.jsonl
```

### OpenAI Fine-tuning

```bash
# Upload instruction tuning data
openai api fine_tunes.create -t ./synthetic-data/instruction-tuning-*.jsonl -m davinci
```

### Custom Training Scripts

```python
import json

# Load synthetic conversation data
with open('./synthetic-data/conversation-*.jsonl', 'r') as f:
    for line in f:
        record = json.loads(line)
        messages = record['messages']
        # Process for your training pipeline
```

## Best Practices

### 1. Start Small

Begin with basic conversation capture:

```typescript
createSyntheticData({
  formats: ["instruction-tuning"],
  mode: "batch",
  batchSize: 10,
});
```

### 2. Filter Quality Data

Use filters to ensure high-quality training data:

```typescript
{
  filters: {
    minConversationLength: 3,
    successfulOnly: true,
    contexts: ["production-contexts"]
  }
}
```

### 3. Monitor Quality

Regularly analyze your synthetic data:

```typescript
// Check quality metrics
await agent.callAction("synthetic.analyze");

// Export and review
await agent.callAction("synthetic.process", { export: true });
```

### 4. Privacy First

Always configure privacy controls:

```typescript
{
  privacy: {
    redactPatterns: [/sensitive-pattern/g],
    anonymizeUsers: true
  }
}
```

## API Reference

### SyntheticConfig

Complete configuration interface for synthetic data generation.

### SyntheticRecord

Individual training record with metadata and quality scoring.

### RealtimeSyntheticCollector

Processes agent logs in real-time into training records.

### SyntheticExporter

Exports records to various file formats (JSONL, JSON).

### SyntheticAnalyzer

Analyzes data quality and detects issues.

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

## License

MIT

## Contributing

Contributions welcome! Please read our contributing guidelines and submit pull
requests to our repository.
