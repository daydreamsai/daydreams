# Synthetic Data Generation Examples

This directory contains examples of how to use the `@daydreamsai/synthetic`
package to automatically generate training data from agent interactions.

## Examples

### 1. Simple Example (`simple-example.ts`)

A basic math tutor demonstrating minimal synthetic data setup.

### 2. Comprehensive Example (`comprehensive-example.ts`) ⭐

**Recommended for testing all features**

Demonstrates ALL synthetic data formats with different interaction types:

```bash
# Set your API key
export OPENROUTER_API_KEY="your-key-here"

# Run the comprehensive example
bun run comprehensive-example.ts
```

This example generates:

#### 📚 Instruction-Tuning Format

Input/output pairs for fine-tuning models:

```json
{
  "instruction": "What is the capital of France?",
  "response": "The capital of France is Paris.",
  "system": "You are a helpful AI assistant agent.",
  "context": "Context: assistant, ID: comprehensive-demo"
}
```

#### 💬 Conversation Format

Multi-turn dialogue sequences:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Calculate 25 * 8",
      "timestamp": 1704067200000
    },
    {
      "role": "assistant",
      "content": "25 * 8 = 200",
      "timestamp": 1704067201000
    }
  ],
  "summary": "Mathematical calculation conversation"
}
```

#### 🧠 Reasoning-Chains Format

Step-by-step thinking processes:

```json
{
  "problem": "Calculate the area of a circle with radius 5",
  "reasoning": [
    { "step": 1, "thought": "I need to use the formula A = πr²" },
    { "step": 2, "thought": "With radius 5, that's π × 5² = π × 25" },
    { "step": 3, "action": "calculate(π * 25)", "result": "78.54" }
  ],
  "conclusion": "The area is approximately 78.54 square units"
}
```

#### ⚡ Action-Sequences Format

Function calls and results:

```json
{
  "situation": "User wants to search for machine learning information",
  "actions": [
    {
      "name": "webSearch",
      "arguments": {"query": "machine learning", "maxResults": 3},
      "result": {"results": [...], "totalFound": 3},
      "timestamp": 1704067300000,
      "success": true
    }
  ],
  "outcome": "Successfully provided search results"
}
```

#### 🎬 Episodes Format

Complete interaction episodes:

```json
{
  "episodeId": "comprehensive-demo",
  "observation": "User wants to add a task",
  "thoughts": ["I should help them organize their tasks"],
  "actions": [
    {
      "name": "addTask",
      "arguments": { "task": "Review quarterly reports", "priority": "high" },
      "result": { "taskId": "abc123", "success": true }
    }
  ],
  "result": "Task added successfully",
  "success": true,
  "duration": 2500
}
```

#### 🏆 GRPO Format

Preference data for reinforcement learning:

```json
{
  "prompt": "Explain photosynthesis",
  "responses": [
    {
      "text": "Photosynthesis is the process by which...",
      "score": 0.9,
      "rank": 1,
      "success": true,
      "model": "test-model"
    },
    {
      "text": "Plants make food using sunlight...",
      "score": 0.7,
      "rank": 2,
      "success": true,
      "model": "test-model"
    }
  ],
  "comparisons": [{ "preferred": 0, "rejected": 1, "confidence": 0.8 }]
}
```

### 3. Game Training Example (`game-training-example.ts`) 🎮

**Practical GRPO training from gameplay**

An agent plays a number guessing game and generates training data from
self-play:

```bash
# Set your API key
export OPENROUTER_API_KEY="your-key-here"

# Run the game training example
bun run game-training-example.ts
```

This example demonstrates practical AI training through gameplay:

#### 🎯 Game-Playing Agent

- **Number Guessing Game**: Agent tries to guess a number 1-100
- **Multiple Strategies**: Binary search, random exploration, pattern-based
  learning
- **Self-Play Training**: Agent plays against itself to generate data
- **Strategy Comparison**: Generates GRPO preference data by comparing strategy
  effectiveness

#### 🏆 GRPO Training Data Generated

```json
{
  "prompt": "Current game state: range 25-75, 3 guesses made",
  "responses": [
    {
      "text": "Use binary search: guess 50 (optimal mathematical approach)",
      "score": 0.95,
      "rank": 1,
      "strategy": "binary_search",
      "expectedGuesses": 3
    },
    {
      "text": "Random guess within range (exploration)",
      "score": 0.3,
      "rank": 2,
      "strategy": "random",
      "expectedGuesses": 12
    }
  ],
  "comparisons": [{ "preferred": 0, "rejected": 1, "confidence": 0.8 }]
}
```

#### 🎮 Interactive Commands

```
'Start a new game' - Begin manual gameplay
'Use binary search strategy' - Optimal approach
'Make a random guess' - Exploration
'Compare all strategies' - Generate preference data
'Run auto-play demo' - See how bulk generation would work
```

#### 📊 Training Use Cases

- **Strategy Learning**: Train agents to choose optimal game strategies
- **Decision Making**: Learn when to explore vs exploit
- **RLHF Data**: Generate preference comparisons for reinforcement learning
- **Game AI**: Create datasets for training game-playing agents
- **Multi-Agent Training**: Self-play data for competitive scenarios

### Choose Your Example Based on Goal:

## Testing Different Data Types

Use these specific commands to generate different synthetic data types:

### Instruction-Tuning Data

```
What is the capital of France?
How does photosynthesis work?
Explain quantum computing
```

### Conversation Data

Have multi-turn conversations:

```
User: Hello!
Agent: Hi! How can I help you?
User: What's the weather like?
Agent: I'd need to search for that information...
```

### Reasoning-Chains Data

Ask for step-by-step explanations:

```
Calculate 25 * 8 and show your work
Solve this step by step: What's 15% of 240?
```

### Action-Sequences Data

Request actions be performed:

```
Search for information about machine learning
Add a task: Review quarterly reports
```

### Episodes Data

Complete interactions with multiple steps:

```
I need to research AI and add it to my task list
Help me calculate my monthly budget and save it
```

### GRPO Data

Request multiple alternatives:

```
Generate 3 different explanations of photosynthesis
Give me several ways to explain machine learning
```

## Commands

While running any example, use these commands:

- `!synthetic.status` - Check if data is being captured
- `!synthetic.process` - Generate training data files
- `!synthetic.analyze` - Analyze data quality
- `!synthetic.clear` - Clear the buffer

## Output Files

Generated files appear in `./training-data/`:

- `synthetic-instruction-tuning-[timestamp].jsonl`
- `synthetic-conversation-[timestamp].jsonl`
- `synthetic-reasoning-chains-[timestamp].jsonl`
- `synthetic-action-sequences-[timestamp].jsonl`
- `synthetic-episodes-[timestamp].jsonl`
- `synthetic-grpo-[timestamp].jsonl`

Each file contains records in JSONL format (one JSON object per line).

## API Configuration

Set your API key:

```bash
export OPENROUTER_API_KEY="your-openrouter-api-key"
```

Or create a `.env` file:

```env
OPENROUTER_API_KEY=your-openrouter-api-key
```

## Synthetic Data Configuration

The synthetic data extension supports extensive configuration:

```typescript
createSyntheticData({
  enabled: true,
  outputDir: "./training-data",
  formats: ["instruction-tuning", "conversation", "reasoning-chains"],
  capture: {
    conversations: true, // Input/output pairs
    reasoning: true, // Step-by-step thinking
    actions: true, // Function calls
    episodes: true, // Complete interactions
    preferences: true, // GRPO preference data
  },
  mode: "realtime", // Process immediately
  batchSize: 1, // Process every N interactions
  filters: {
    minConversationLength: 1,
    successfulOnly: false,
    contexts: ["assistant"], // Only capture specific contexts
  },
});
```

## Use Cases

### Fine-tuning Models

Use `instruction-tuning` and `conversation` formats to create datasets for
fine-tuning language models on your specific use case.

### Training Reasoning Models

Use `reasoning-chains` format to teach models step-by-step thinking processes.

### Function Calling Training

Use `action-sequences` format to train models on when and how to use
tools/functions.

### Reinforcement Learning

Use `grpo` format for preference learning and RLHF (Reinforcement Learning from
Human Feedback).

### Behavior Cloning

Use `episodes` format to train agents to mimic expert behavior patterns.

## Troubleshooting

**Buffer Size: 0** - The synthetic data collector isn't capturing logs. This
usually means:

- Extension order issue (synthetic extension should be first)
- Context timing issue (fixed in latest version)
- No interactions have occurred yet

**No data processed** - Make sure you've:

- Had actual conversations with the agent
- Called `!synthetic.process` to generate files
- Enabled the right capture settings for your use case
