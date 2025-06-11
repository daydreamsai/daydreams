import type {
  AnyRef,
  InputRef,
  OutputRef,
  ActionCall,
  ActionResult,
  Thought,
  AgentContext,
  AnyContext,
  AnyAgent,
} from "@daydreamsai/core";

import type {
  SyntheticConfig,
  SyntheticRecord,
  InstructionTuningRecord,
  ConversationRecord,
  ReasoningChainRecord,
  ActionSequenceRecord,
  EpisodeRecord,
  GRPORecord,
} from "../../types";

/**
 * Generate mock input log
 */
export function createMockInputRef(
  overrides: Partial<InputRef> = {}
): InputRef {
  return {
    id: `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ref: "input",
    type: "cli",
    content: "Hello, how can you help me?",
    data: { message: "Hello, how can you help me?" },
    timestamp: Date.now(),
    processed: false,
    ...overrides,
  };
}

/**
 * Generate mock output log
 */
export function createMockOutputRef(
  overrides: Partial<OutputRef> = {}
): OutputRef {
  return {
    id: `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ref: "output",
    type: "cli",
    content:
      "I'm here to help you with various tasks. What would you like to know?",
    data: {
      message:
        "I'm here to help you with various tasks. What would you like to know?",
    },
    timestamp: Date.now(),
    processed: false,
    ...overrides,
  };
}

/**
 * Generate mock thought log
 */
export function createMockThought(overrides: Partial<Thought> = {}): Thought {
  return {
    id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ref: "thought",
    content:
      "The user is asking for help. I should provide a helpful response.",
    timestamp: Date.now(),
    processed: false,
    ...overrides,
  };
}

/**
 * Generate mock action call
 */
export function createMockActionCall(
  overrides: Partial<ActionCall> = {}
): ActionCall {
  return {
    id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ref: "action_call",
    name: "web_search",
    content: "Searching for information",
    data: { query: "test search" },
    timestamp: Date.now(),
    processed: false,
    ...overrides,
  };
}

/**
 * Generate mock action result
 */
export function createMockActionResult(
  callId: string,
  overrides: Partial<ActionResult> = {}
): ActionResult {
  return {
    id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ref: "action_result",
    callId,
    name: "web_search",
    data: { results: ["Search result 1", "Search result 2"] },
    timestamp: Date.now(),
    processed: false,
    ...overrides,
  };
}

/**
 * Generate mock agent context
 */
export function createMockAgentContext(
  overrides: Partial<AgentContext<AnyContext>> = {}
): AgentContext<AnyContext> {
  return {
    id: `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    context: {
      type: "cli",
      key: () => "test-key",
    } as unknown as AnyContext,
    args: {},
    options: {},
    settings: {},
    memory: {},
    workingMemory: {
      inputs: [],
      outputs: [],
      thoughts: [],
      calls: [],
      results: [],
      runs: [],
      steps: [],
      events: [],
    },
    ...overrides,
  };
}

/**
 * Generate mock agent
 */
export function createMockAgent(): Partial<AnyAgent> {
  return {
    getContexts: () => Promise.resolve([]),
    getContextById: () => Promise.resolve(null),
    getWorkingMemory: () =>
      Promise.resolve({
        inputs: [],
        outputs: [],
        thoughts: [],
        calls: [],
        results: [],
        runs: [],
        steps: [],
        events: [],
      }),
    subscribeContext:
      (contextId: string, handler: (log: AnyRef, done: boolean) => void) =>
      () => {},
    exportAllTrainingData: () => Promise.resolve(undefined),
  };
}

/**
 * Generate mock synthetic config
 */
export function createMockSyntheticConfig(
  overrides: Partial<SyntheticConfig> = {}
): SyntheticConfig {
  return {
    enabled: true,
    outputDir: "./test-output",
    formats: ["instruction-tuning", "conversation"],
    capture: {
      conversations: true,
      reasoning: true,
      actions: true,
      episodes: true,
      preferences: true,
    },
    mode: "batch",
    batchSize: 10,
    filters: {
      minConversationLength: 2,
      successfulOnly: false,
    },
    ...overrides,
  };
}

/**
 * Generate mock instruction tuning record
 */
export function createMockInstructionTuningRecord(): SyntheticRecord {
  return {
    id: `instruction_${Date.now()}`,
    timestamp: Date.now(),
    type: "instruction-tuning",
    data: {
      instruction: "What is the weather like?",
      response:
        "I can help you check the weather. What city would you like me to check?",
      system: "You are a helpful AI assistant agent.",
      context: "Context: cli, ID: test-context",
    } as InstructionTuningRecord,
    metadata: {
      contextType: "cli",
      contextId: "test-context",
      success: true,
      quality: 0.8,
      tags: ["cli", "weather", "synthetic-data"],
    },
  };
}

/**
 * Generate mock conversation record
 */
export function createMockConversationRecord(): SyntheticRecord {
  return {
    id: `conversation_${Date.now()}`,
    timestamp: Date.now(),
    type: "conversation",
    data: {
      messages: [
        { role: "user", content: "Hello!" },
        { role: "assistant", content: "Hi! How can I help you today?" },
        { role: "user", content: "Can you help me with coding?" },
        {
          role: "assistant",
          content:
            "Absolutely! What programming language or topic would you like help with?",
        },
      ],
      summary: "Conversation with 2 user messages and 2 assistant responses",
    } as ConversationRecord,
    metadata: {
      contextType: "cli",
      contextId: "test-context",
      success: true,
      quality: 0.9,
      tags: ["cli", "coding", "synthetic-data"],
    },
  };
}

/**
 * Generate mock reasoning chain record
 */
export function createMockReasoningChainRecord(): SyntheticRecord {
  return {
    id: `reasoning_${Date.now()}`,
    timestamp: Date.now(),
    type: "reasoning-chains",
    data: {
      problem: "Calculate 15% tip on a $80 bill",
      reasoning: [
        { step: 1, thought: "I need to calculate 15% of $80" },
        { step: 2, thought: "15% as decimal is 0.15" },
        {
          step: 3,
          action: 'calculate({"operation": "multiply", "a": 80, "b": 0.15})',
          result: "12",
        },
      ],
      conclusion: "The 15% tip on an $80 bill is $12",
    } as ReasoningChainRecord,
    metadata: {
      contextType: "cli",
      contextId: "test-context",
      success: true,
      quality: 0.85,
      tags: ["cli", "math", "synthetic-data"],
    },
  };
}

/**
 * Generate mock action sequence record
 */
export function createMockActionSequenceRecord(): SyntheticRecord {
  return {
    id: `actions_${Date.now()}`,
    timestamp: Date.now(),
    type: "action-sequences",
    data: {
      situation: "User wants current weather information",
      actions: [
        {
          name: "web_search",
          arguments: { query: "current weather San Francisco" },
          result: { temperature: "72°F", conditions: "sunny" },
          timestamp: Date.now(),
          success: true,
        },
      ],
      outcome: "Successfully provided weather information for San Francisco",
    } as ActionSequenceRecord,
    metadata: {
      contextType: "cli",
      contextId: "test-context",
      success: true,
      quality: 0.9,
      tags: ["cli", "weather", "synthetic-data"],
    },
  };
}

/**
 * Generate mock episode record
 */
export function createMockEpisodeRecord(): SyntheticRecord {
  return {
    id: `episode_${Date.now()}`,
    timestamp: Date.now(),
    type: "episodes",
    data: {
      episodeId: "test-episode",
      observation: "User asked for help with a task",
      thoughts: [
        "The user needs assistance",
        "I should ask for more details",
        "Let me provide helpful guidance",
      ],
      actions: [
        {
          name: "clarify_request",
          arguments: { question: "What specific task do you need help with?" },
          result: { clarification: "User wants help with coding" },
          timestamp: Date.now(),
          success: true,
        },
      ],
      result: "Successfully helped user with their coding question",
      success: true,
      duration: 15000,
    } as EpisodeRecord,
    metadata: {
      contextType: "cli",
      contextId: "test-context",
      success: true,
      quality: 0.95,
      tags: ["cli", "help", "synthetic-data"],
    },
  };
}

/**
 * Create a sequence of mock logs for testing conversation flow
 */
export function createMockConversationLogs(): Array<{
  log: AnyRef;
  context: AgentContext<AnyContext>;
}> {
  const context = createMockAgentContext();
  const input1 = createMockInputRef({ content: "Hello!" });
  const output1 = createMockOutputRef({ content: "Hi! How can I help you?" });
  const input2 = createMockInputRef({ content: "What's the weather like?" });
  const thought = createMockThought({
    content: "User wants weather information",
  });
  const actionCall = createMockActionCall({
    name: "web_search",
    data: { query: "current weather" },
  });
  const actionResult = createMockActionResult(actionCall.id, {
    data: { temperature: "72°F" },
  });
  const output2 = createMockOutputRef({
    content: "It's 72°F and sunny today!",
  });

  return [
    { log: input1, context },
    { log: output1, context },
    { log: input2, context },
    { log: thought, context },
    { log: actionCall, context },
    { log: actionResult, context },
    { log: output2, context },
  ];
}

/**
 * Validation helpers
 */
export function isValidSyntheticRecord(record: any): record is SyntheticRecord {
  return (
    record &&
    typeof record.id === "string" &&
    typeof record.timestamp === "number" &&
    typeof record.type === "string" &&
    record.data &&
    record.metadata &&
    typeof record.metadata.contextType === "string" &&
    typeof record.metadata.contextId === "string"
  );
}

export function hasQualityScore(
  record: SyntheticRecord,
  min: number,
  max: number = 1
): boolean {
  const quality = record.metadata?.quality;
  return typeof quality === "number" && quality >= min && quality <= max;
}

/**
 * Generate mock GRPO record
 */
export function createMockGRPORecord(): SyntheticRecord {
  return {
    id: `grpo_${Date.now()}`,
    timestamp: Date.now(),
    type: "grpo",
    data: {
      prompt: "Explain how photosynthesis works",
      responses: [
        {
          text: "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen. This occurs in the chloroplasts using chlorophyll.",
          score: 0.9,
          rank: 1,
          success: true,
          model: "gpt-4",
          metadata: { outputId: "out_001", timestamp: Date.now() },
        },
        {
          text: "Plants use sunlight to make food from CO2 and water.",
          score: 0.6,
          rank: 2,
          success: true,
          model: "gpt-3.5",
          metadata: { outputId: "out_002", timestamp: Date.now() },
        },
        {
          text: "I don't know about photosynthesis.",
          score: 0.2,
          rank: 3,
          success: false,
          model: "basic-model",
          metadata: { outputId: "out_003", timestamp: Date.now() },
        },
      ],
      system: "You are a helpful AI assistant agent.",
      context: "Context: cli, ID: test-context",
      comparisons: [
        { preferred: 0, rejected: 1, confidence: 0.6 },
        { preferred: 0, rejected: 2, confidence: 0.9 },
        { preferred: 1, rejected: 2, confidence: 0.8 },
      ],
    } as GRPORecord,
    metadata: {
      contextType: "cli",
      contextId: "test-context",
      success: true,
      quality: 0.88,
      tags: ["cli", "science", "grpo", "synthetic-data"],
    },
  };
}
