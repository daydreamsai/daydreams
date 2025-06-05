import type { SyntheticRecord } from "../../types";

/**
 * Sample instruction tuning records for testing
 */
export const sampleInstructionTuningRecords: SyntheticRecord[] = [
  {
    id: "instruction_001",
    timestamp: 1704067200000,
    type: "instruction-tuning",
    data: {
      instruction: "What is the capital of France?",
      response: "The capital of France is Paris.",
      system: "You are a helpful AI assistant agent.",
      context: "Context: cli, ID: session_001",
    },
    metadata: {
      contextType: "cli",
      contextId: "session_001",
      success: true,
      quality: 0.9,
      tags: ["geography", "facts", "synthetic-data"],
    },
  },
  {
    id: "instruction_002",
    timestamp: 1704067260000,
    type: "instruction-tuning",
    data: {
      instruction: "Calculate 15 + 27",
      response: "15 + 27 = 42",
      system: "You are a helpful AI assistant agent.",
      context: "Context: cli, ID: session_002",
    },
    metadata: {
      contextType: "cli",
      contextId: "session_002",
      success: true,
      quality: 0.8,
      tags: ["math", "calculation", "synthetic-data"],
    },
  },
];

/**
 * Sample conversation records for testing
 */
export const sampleConversationRecords: SyntheticRecord[] = [
  {
    id: "conversation_001",
    timestamp: 1704067300000,
    type: "conversation",
    data: {
      messages: [
        { role: "user", content: "Hello!" },
        { role: "assistant", content: "Hi! How can I help you today?" },
        { role: "user", content: "Can you explain AI?" },
        {
          role: "assistant",
          content:
            "AI stands for Artificial Intelligence. It's the simulation of human intelligence in machines.",
        },
      ],
      summary:
        "Conversation with 2 user messages and 2 assistant responses about AI",
    },
    metadata: {
      contextType: "cli",
      contextId: "session_003",
      success: true,
      quality: 0.85,
      tags: ["ai", "explanation", "synthetic-data"],
    },
  },
];

/**
 * Sample reasoning chain records for testing
 */
export const sampleReasoningChainRecords: SyntheticRecord[] = [
  {
    id: "reasoning_001",
    timestamp: 1704067400000,
    type: "reasoning-chains",
    data: {
      problem: "A train travels 120 km in 2 hours. What is its average speed?",
      reasoning: [
        {
          step: 1,
          thought: "I need to calculate average speed using distance/time",
        },
        { step: 2, thought: "Distance = 120 km, Time = 2 hours" },
        {
          step: 3,
          action: 'calculate({"operation": "divide", "a": 120, "b": 2})',
          result: "60",
        },
      ],
      conclusion: "The average speed is 60 km/h",
    },
    metadata: {
      contextType: "cli",
      contextId: "session_004",
      success: true,
      quality: 0.95,
      tags: ["physics", "calculation", "synthetic-data"],
    },
  },
];

/**
 * Sample action sequence records for testing
 */
export const sampleActionSequenceRecords: SyntheticRecord[] = [
  {
    id: "actions_001",
    timestamp: 1704067500000,
    type: "action-sequences",
    data: {
      situation: "User wants to know the current weather",
      actions: [
        {
          name: "web_search",
          arguments: { query: "current weather London" },
          result: { temperature: "18°C", conditions: "cloudy" },
          timestamp: 1704067510000,
          success: true,
        },
      ],
      outcome: "Successfully provided weather information for London",
    },
    metadata: {
      contextType: "cli",
      contextId: "session_005",
      success: true,
      quality: 0.88,
      tags: ["weather", "search", "synthetic-data"],
    },
  },
];

/**
 * Sample episode records for testing
 */
export const sampleEpisodeRecords: SyntheticRecord[] = [
  {
    id: "episode_001",
    timestamp: 1704067600000,
    type: "episodes",
    data: {
      episodeId: "session_006",
      observation: "User asked for help with debugging code",
      thoughts: [
        "The user has a coding problem",
        "I need to understand the issue first",
        "Then provide debugging suggestions",
      ],
      actions: [
        {
          name: "analyze_code",
          arguments: { code: "console.log('Hello World')" },
          result: { analysis: "Code looks correct" },
          timestamp: 1704067610000,
          success: true,
        },
      ],
      result: "Successfully helped user debug their code",
      success: true,
      duration: 120000,
    },
    metadata: {
      contextType: "cli",
      contextId: "session_006",
      success: true,
      quality: 0.92,
      tags: ["debugging", "coding", "synthetic-data"],
    },
  },
];

/**
 * Sample GRPO records for testing
 */
export const sampleGRPORecords: SyntheticRecord[] = [
  {
    id: "grpo_001",
    timestamp: 1704067700000,
    type: "grpo",
    data: {
      prompt: "Explain the concept of machine learning in simple terms.",
      responses: [
        {
          text: "Machine learning is a type of artificial intelligence where computers learn to make predictions or decisions by finding patterns in data, rather than being explicitly programmed for every scenario.",
          score: 0.9,
          rank: 1,
          success: true,
          model: "gpt-4",
          metadata: { outputId: "out_001", timestamp: 1704067705000 },
        },
        {
          text: "Machine learning is when computers learn stuff from data to make predictions.",
          score: 0.6,
          rank: 2,
          success: true,
          model: "gpt-3.5",
          metadata: { outputId: "out_002", timestamp: 1704067706000 },
        },
        {
          text: "I'm not sure how to explain machine learning.",
          score: 0.2,
          rank: 3,
          success: false,
          model: "basic-model",
          metadata: { outputId: "out_003", timestamp: 1704067707000 },
        },
      ],
      system: "You are a helpful AI assistant agent.",
      context: "Context: cli, ID: session_011",
      comparisons: [
        { preferred: 0, rejected: 1, confidence: 0.6 },
        { preferred: 0, rejected: 2, confidence: 0.9 },
        { preferred: 1, rejected: 2, confidence: 0.8 },
      ],
    },
    metadata: {
      contextType: "cli",
      contextId: "session_011",
      success: true,
      quality: 0.9,
      tags: ["grpo", "machine-learning", "synthetic-data"],
    },
  },
  {
    id: "grpo_002",
    timestamp: 1704067800000,
    type: "grpo",
    data: {
      prompt: "What is the capital of France?",
      responses: [
        {
          text: "The capital of France is Paris. It's also the largest city in France and a major European cultural center.",
          score: 0.95,
          rank: 1,
          success: true,
          model: "gpt-4",
          metadata: { outputId: "out_004", timestamp: 1704067805000 },
        },
        {
          text: "Paris is the capital of France.",
          score: 0.8,
          rank: 2,
          success: true,
          model: "gpt-3.5",
          metadata: { outputId: "out_005", timestamp: 1704067806000 },
        },
      ],
      system: "You are a helpful AI assistant agent.",
      context: "Context: cli, ID: session_012",
      comparisons: [{ preferred: 0, rejected: 1, confidence: 0.3 }],
    },
    metadata: {
      contextType: "cli",
      contextId: "session_012",
      success: true,
      quality: 0.85,
      tags: ["grpo", "geography", "synthetic-data"],
    },
  },
];

/**
 * Mixed sample records for comprehensive testing
 */
export const sampleMixedRecords: SyntheticRecord[] = [
  ...sampleInstructionTuningRecords,
  ...sampleConversationRecords,
  ...sampleReasoningChainRecords,
  ...sampleActionSequenceRecords,
  ...sampleEpisodeRecords,
  ...sampleGRPORecords,
];

/**
 * Sample records with quality issues for testing analytics
 */
export const sampleLowQualityRecords: SyntheticRecord[] = [
  {
    id: "low_quality_001",
    timestamp: 1704067700000,
    type: "instruction-tuning",
    data: {
      instruction: "Hi",
      response: "Hi",
      system: "You are a helpful AI assistant agent.",
      context: "Context: cli, ID: session_007",
    },
    metadata: {
      contextType: "cli",
      contextId: "session_007",
      success: true,
      quality: 0.2, // Low quality
      tags: ["low-quality", "synthetic-data"],
    },
  },
];

/**
 * Sample records with privacy issues for testing
 */
export const samplePrivacyIssueRecords: SyntheticRecord[] = [
  {
    id: "privacy_001",
    timestamp: 1704067800000,
    type: "instruction-tuning",
    data: {
      instruction: "What is my email?",
      response: "Your email is john.doe@example.com",
      system: "You are a helpful AI assistant agent.",
      context: "Context: cli, ID: session_008",
    },
    metadata: {
      contextType: "cli",
      contextId: "session_008",
      success: true,
      quality: 0.7,
      tags: ["privacy-issue", "synthetic-data"],
    },
  },
];

/**
 * Sample duplicate records for testing
 */
export const sampleDuplicateRecords: SyntheticRecord[] = [
  {
    id: "duplicate_001",
    timestamp: 1704067900000,
    type: "instruction-tuning",
    data: {
      instruction: "What is 2+2?",
      response: "2+2 equals 4",
      system: "You are a helpful AI assistant agent.",
      context: "Context: cli, ID: session_009",
    },
    metadata: {
      contextType: "cli",
      contextId: "session_009",
      success: true,
      quality: 0.8,
      tags: ["math", "synthetic-data"],
    },
  },
  {
    id: "duplicate_002",
    timestamp: 1704067910000,
    type: "instruction-tuning",
    data: {
      instruction: "What is 2+2?",
      response: "2+2 equals 4",
      system: "You are a helpful AI assistant agent.",
      context: "Context: cli, ID: session_010",
    },
    metadata: {
      contextType: "cli",
      contextId: "session_010",
      success: true,
      quality: 0.8,
      tags: ["math", "synthetic-data"],
    },
  },
];
