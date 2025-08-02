import type {
  AnyRef,
  InputRef,
  OutputRef,
  ActionCall,
  ActionResult,
  ThoughtRef,
  AgentContext,
  AnyContext,
  AnyAgent,
} from "@daydreamsai/core";

import type {
  SyntheticConfig,
  SyntheticRecord,
  SyntheticCollector,
  InstructionTuningRecord,
  ConversationRecord,
  ReasoningChainRecord,
  ActionSequenceRecord,
  EpisodeRecord,
  GRPORecord,
} from "./types";

/**
 * Real-time collector that processes agent logs into synthetic training data
 */
export class RealtimeSyntheticCollector implements SyntheticCollector {
  private logBuffer: Array<{ log: AnyRef; context: AgentContext<AnyContext> }> =
    [];
  private config: SyntheticConfig;
  private agent: AnyAgent;

  constructor(config: SyntheticConfig, agent: AnyAgent) {
    this.config = config;
    this.agent = agent;
  }

  async addLog(log: AnyRef, context: AgentContext<AnyContext>): Promise<void> {
    // Apply filters
    if (!this.shouldIncludeLog(log, context)) {
      return;
    }

    // Apply privacy controls
    const sanitizedLog = this.sanitizeLog(log);

    this.logBuffer.push({ log: sanitizedLog, context });

    // Process in real-time if buffer is full
    if (
      this.config.mode === "realtime" &&
      this.logBuffer.length >= (this.config.batchSize || 10)
    ) {
      await this.process();
    }
  }

  async process(): Promise<SyntheticRecord[]> {
    if (this.logBuffer.length === 0) {
      return [];
    }

    const records: SyntheticRecord[] = [];

    // Group logs by conversation/session
    const conversationGroups = this.groupByConversation(this.logBuffer);

    for (const group of conversationGroups) {
      // Generate instruction tuning records
      if (
        this.config.capture.conversations &&
        this.config.formats.includes("instruction-tuning")
      ) {
        records.push(...this.generateInstructionTuningRecords(group));
      }

      // Generate conversation records
      if (
        this.config.capture.conversations &&
        this.config.formats.includes("conversation")
      ) {
        records.push(...this.generateConversationRecords(group));
      }

      // Generate reasoning chain records
      if (
        this.config.capture.reasoning &&
        this.config.formats.includes("reasoning-chains")
      ) {
        records.push(...this.generateReasoningChainRecords(group));
      }

      // Generate action sequence records
      if (
        this.config.capture.actions &&
        this.config.formats.includes("action-sequences")
      ) {
        records.push(...this.generateActionSequenceRecords(group));
      }

      // Generate episode records
      if (
        this.config.capture.episodes &&
        this.config.formats.includes("episodes")
      ) {
        records.push(...this.generateEpisodeRecords(group));
      }

      // Generate GRPO records
      if (
        this.config.capture.preferences &&
        this.config.formats.includes("grpo")
      ) {
        records.push(...this.generateGRPORecords(group));
      }
    }

    return records;
  }

  clear(): void {
    this.logBuffer = [];
  }

  getBufferSize(): number {
    return this.logBuffer.length;
  }

  private shouldIncludeLog(
    log: AnyRef,
    context: AgentContext<AnyContext>
  ): boolean {
    const filters = this.config.filters;
    if (!filters) return true;

    // Context type filter
    if (filters.contexts && !filters.contexts.includes(context.context.type)) {
      return false;
    }

    // Action name filter
    if (filters.actions && log.ref === "action_call") {
      const actionCall = log as ActionCall;
      if (!filters.actions.includes(actionCall.name)) {
        return false;
      }
    }

    return true;
  }

  private sanitizeLog(log: AnyRef): AnyRef {
    if (!this.config.privacy) return log;

    const sanitized = { ...log } as any;

    // Remove timestamps if configured
    if (this.config.privacy.removeTimestamps && "timestamp" in sanitized) {
      delete sanitized.timestamp;
    }

    // Redact sensitive patterns
    if (this.config.privacy.redactPatterns) {
      for (const pattern of this.config.privacy.redactPatterns) {
        if ("content" in sanitized && typeof sanitized.content === "string") {
          sanitized.content = sanitized.content.replace(pattern, "[REDACTED]");
        }
      }
    }

    // Anonymize user identifiers
    if (this.config.privacy.anonymizeUsers) {
      // Replace user IDs with generic identifiers
      if ("content" in sanitized && typeof sanitized.content === "string") {
        sanitized.content = sanitized.content.replace(
          /user_\w+/g,
          (_match: string, index: number) => `user_${index % 100}`
        );
      }
    }

    return sanitized;
  }

  private groupByConversation(
    bufferedLogs: Array<{ log: AnyRef; context: AgentContext<AnyContext> }>
  ): Array<Array<{ log: AnyRef; context: AgentContext<AnyContext> }>> {
    const groups = new Map<
      string,
      Array<{ log: AnyRef; context: AgentContext<AnyContext> }>
    >();

    for (const item of bufferedLogs) {
      const key = item.context.id;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }

    return Array.from(groups.values());
  }

  private generateInstructionTuningRecords(
    group: Array<{ log: AnyRef; context: AgentContext<AnyContext> }>
  ): SyntheticRecord[] {
    const records: SyntheticRecord[] = [];

    // Find input/output pairs
    for (let i = 0; i < group.length - 1; i++) {
      const current = group[i];
      const next = group[i + 1];

      if (current.log.ref === "input" && next.log.ref === "output") {
        const inputLog = current.log as InputRef;
        const outputLog = next.log as OutputRef;

        const record: SyntheticRecord = {
          id: `instruction_${inputLog.id}_${outputLog.id}`,
          timestamp: inputLog.timestamp,
          type: "instruction-tuning",
          data: {
            instruction: this.extractContent(inputLog.content),
            response: this.extractContent(outputLog.content),
            system: "You are a helpful AI assistant agent.",
            context: this.extractContextDescription(current.context),
          } as InstructionTuningRecord,
          metadata: {
            contextType: current.context.context.type,
            contextId: current.context.id,
            success: !outputLog.error,
            quality: this.calculateQualityScore(inputLog, outputLog),
            tags: this.extractTags(current.context),
          },
        };

        records.push(record);
      }
    }

    return records;
  }

  private generateConversationRecords(
    group: Array<{ log: AnyRef; context: AgentContext<AnyContext> }>
  ): SyntheticRecord[] {
    const messages: ConversationRecord["messages"] = [];

    for (const item of group) {
      if (item.log.ref === "input") {
        const inputLog = item.log as InputRef;
        messages.push({
          role: "user",
          content: this.extractContent(inputLog.content),
          timestamp: inputLog.timestamp,
        });
      } else if (item.log.ref === "output") {
        const outputLog = item.log as OutputRef;
        messages.push({
          role: "assistant",
          content: this.extractContent(outputLog.content),
          timestamp: outputLog.timestamp,
        });
      }
    }

    if (messages.length < 2) return [];

    // Apply conversation length filters
    const minLength = this.config.filters?.minConversationLength || 2;
    const maxLength = this.config.filters?.maxConversationLength || 100;

    if (messages.length < minLength || messages.length > maxLength) {
      return [];
    }

    const record: SyntheticRecord = {
      id: `conversation_${group[0].context.id}_${Date.now()}`,
      timestamp: messages[0].timestamp || Date.now(),
      type: "conversation",
      data: {
        messages,
        summary: this.generateConversationSummary(messages),
      } as ConversationRecord,
      metadata: {
        contextType: group[0].context.context.type,
        contextId: group[0].context.id,
        quality: this.calculateConversationQuality(messages),
        tags: this.extractTags(group[0].context),
      },
    };

    return [record];
  }

  private generateReasoningChainRecords(
    group: Array<{ log: AnyRef; context: AgentContext<AnyContext> }>
  ): SyntheticRecord[] {
    const records: SyntheticRecord[] = [];

    // Find sequences with thoughts, actions, and results
    const thoughtSequences = this.extractThoughtSequences(group);

    for (const sequence of thoughtSequences) {
      if (sequence.length < 2) continue;

      const reasoning: ReasoningChainRecord["reasoning"] = [];
      let stepNumber = 1;

      for (const item of sequence) {
        if (item.log.ref === "thought") {
          const thought = item.log as ThoughtRef;
          reasoning.push({
            step: stepNumber++,
            thought: thought.content,
          });
        } else if (item.log.ref === "action_call") {
          const actionCall = item.log as ActionCall;
          const lastStep = reasoning[reasoning.length - 1];
          if (lastStep) {
            lastStep.action = `${actionCall.name}(${JSON.stringify(
              actionCall.data
            )})`;
          }
        } else if (item.log.ref === "action_result") {
          const actionResult = item.log as ActionResult;
          const lastStep = reasoning[reasoning.length - 1];
          if (lastStep) {
            lastStep.result = JSON.stringify(actionResult.data);
          }
        }
      }

      const firstInput = group.find((item) => item.log.ref === "input")
        ?.log as InputRef;
      const lastOutput = group.find((item) => item.log.ref === "output")
        ?.log as OutputRef;

      if (firstInput && lastOutput) {
        const record: SyntheticRecord = {
          id: `reasoning_${firstInput.id}_${lastOutput.id}`,
          timestamp: firstInput.timestamp,
          type: "reasoning-chains",
          data: {
            problem: this.extractContent(firstInput.content),
            reasoning,
            conclusion: this.extractContent(lastOutput.content),
          } as ReasoningChainRecord,
          metadata: {
            contextType: group[0].context.context.type,
            contextId: group[0].context.id,
            quality: this.calculateReasoningQuality(reasoning),
            tags: this.extractTags(group[0].context),
          },
        };

        records.push(record);
      }
    }

    return records;
  }

  private generateActionSequenceRecords(
    group: Array<{ log: AnyRef; context: AgentContext<AnyContext> }>
  ): SyntheticRecord[] {
    const actions: ActionSequenceRecord["actions"] = [];
    const actionCalls = new Map<string, ActionCall>();

    // Collect action calls and results
    for (const item of group) {
      if (item.log.ref === "action_call") {
        const actionCall = item.log as ActionCall;
        actionCalls.set(actionCall.id, actionCall);
      } else if (item.log.ref === "action_result") {
        const actionResult = item.log as ActionResult;
        const call = actionCalls.get(actionResult.callId);

        if (call) {
          actions.push({
            name: call.name,
            arguments: call.data,
            result: actionResult.data,
            timestamp: call.timestamp,
            success:
              !actionResult.formatted ||
              (typeof actionResult.formatted === "string" &&
                !actionResult.formatted.includes("error")),
          });
        }
      }
    }

    if (actions.length === 0) return [];

    const firstInput = group.find((item) => item.log.ref === "input")
      ?.log as InputRef;
    const lastOutput = group.find((item) => item.log.ref === "output")
      ?.log as OutputRef;

    const record: SyntheticRecord = {
      id: `actions_${group[0].context.id}_${Date.now()}`,
      timestamp: actions[0].timestamp,
      type: "action-sequences",
      data: {
        situation: firstInput
          ? this.extractContent(firstInput.content)
          : "Agent interaction",
        actions,
        outcome: lastOutput
          ? this.extractContent(lastOutput.content)
          : "Action sequence completed",
      } as ActionSequenceRecord,
      metadata: {
        contextType: group[0].context.context.type,
        contextId: group[0].context.id,
        success: actions.every((a) => a.success),
        quality: this.calculateActionSequenceQuality(actions),
        tags: this.extractTags(group[0].context),
      },
    };

    return [record];
  }

  private generateEpisodeRecords(
    group: Array<{ log: AnyRef; context: AgentContext<AnyContext> }>
  ): SyntheticRecord[] {
    const thoughts: string[] = [];
    const actions: ActionSequenceRecord["actions"] = [];
    const actionCalls = new Map<string, ActionCall>();

    // Extract thoughts and actions
    for (const item of group) {
      if (item.log.ref === "thought") {
        const thought = item.log as ThoughtRef;
        thoughts.push(thought.content);
      } else if (item.log.ref === "action_call") {
        const actionCall = item.log as ActionCall;
        actionCalls.set(actionCall.id, actionCall);
      } else if (item.log.ref === "action_result") {
        const actionResult = item.log as ActionResult;
        const call = actionCalls.get(actionResult.callId);

        if (call) {
          actions.push({
            name: call.name,
            arguments: call.data,
            result: actionResult.data,
            timestamp: call.timestamp,
            success:
              !actionResult.formatted ||
              (typeof actionResult.formatted === "string" &&
                !actionResult.formatted.includes("error")),
          });
        }
      }
    }

    const firstInput = group.find((item) => item.log.ref === "input")
      ?.log as InputRef;
    const lastOutput = group.find((item) => item.log.ref === "output")
      ?.log as OutputRef;
    const firstTimestamp = group[0]?.log.timestamp || Date.now();
    const lastTimestamp = group[group.length - 1]?.log.timestamp || Date.now();

    const success = actions.length === 0 || actions.every((a) => a.success);

    // Apply success filter
    if (this.config.filters?.successfulOnly && !success) {
      return [];
    }

    const record: SyntheticRecord = {
      id: `episode_${group[0].context.id}_${Date.now()}`,
      timestamp: firstTimestamp,
      type: "episodes",
      data: {
        episodeId: group[0].context.id,
        observation: firstInput
          ? this.extractContent(firstInput.content)
          : "Episode started",
        thoughts,
        actions,
        result: lastOutput
          ? this.extractContent(lastOutput.content)
          : "Episode completed",
        success,
        duration: lastTimestamp - firstTimestamp,
      } as EpisodeRecord,
      metadata: {
        contextType: group[0].context.context.type,
        contextId: group[0].context.id,
        success,
        quality: this.calculateEpisodeQuality(thoughts, actions, success),
        tags: this.extractTags(group[0].context),
      },
    };

    return [record];
  }

  private generateGRPORecords(
    group: Array<{ log: AnyRef; context: AgentContext<AnyContext> }>
  ): SyntheticRecord[] {
    const records: SyntheticRecord[] = [];

    // Find input/output pairs and their quality variations
    const inputOutputPairs = this.extractInputOutputPairs(group);

    for (const pair of inputOutputPairs) {
      if (pair.responses.length >= 2) {
        // Need at least 2 responses for preference learning
        // Sort responses by quality score (higher is better)
        const sortedResponses = pair.responses.sort(
          (a, b) => b.score - a.score
        );

        // Assign ranks (1 = best)
        const rankedResponses = sortedResponses.map((response, index) => ({
          ...response,
          rank: index + 1,
        }));

        // Generate preference comparisons (best vs others)
        const comparisons = [];
        const bestResponse = rankedResponses[0];
        for (let i = 1; i < rankedResponses.length; i++) {
          comparisons.push({
            preferred: 0, // Index of best response
            rejected: i, // Index of other response
            confidence: Math.min(
              0.9,
              (bestResponse.score - rankedResponses[i].score) * 2
            ),
          });
        }

        const record: SyntheticRecord = {
          id: `grpo_${pair.inputId}_${Date.now()}`,
          timestamp: pair.timestamp,
          type: "grpo",
          data: {
            prompt: pair.input,
            responses: rankedResponses,
            system: "You are a helpful AI assistant agent.",
            context: this.extractContextDescription(pair.context),
            comparisons,
          } as GRPORecord,
          metadata: {
            contextType: pair.context.context.type,
            contextId: pair.context.id,
            success: pair.responses.some((r) => r.success),
            quality: this.calculateGRPOQuality(rankedResponses),
            tags: this.extractTags(pair.context),
          },
        };

        records.push(record);
      }
    }

    return records;
  }

  private extractInputOutputPairs(
    group: Array<{ log: AnyRef; context: AgentContext<AnyContext> }>
  ): Array<{
    inputId: string;
    input: string;
    responses: Array<{
      text: string;
      score: number;
      success: boolean;
      model?: string;
      metadata?: Record<string, any>;
    }>;
    timestamp: number;
    context: AgentContext<AnyContext>;
  }> {
    const pairs: Array<{
      inputId: string;
      input: string;
      responses: Array<{
        text: string;
        score: number;
        success: boolean;
        model?: string;
        metadata?: Record<string, any>;
      }>;
      timestamp: number;
      context: AgentContext<AnyContext>;
    }> = [];

    // Group by input to collect multiple potential responses
    const inputGroups = new Map<
      string,
      {
        input: InputRef;
        outputs: OutputRef[];
        context: AgentContext<AnyContext>;
      }
    >();

    for (const item of group) {
      if (item.log.ref === "input") {
        const inputLog = item.log as InputRef;
        const inputContent = this.extractContent(inputLog.content);
        inputGroups.set(inputLog.id, {
          input: inputLog,
          outputs: [],
          context: item.context,
        });
      } else if (item.log.ref === "output") {
        const outputLog = item.log as OutputRef;
        // Find corresponding input (simple approach - could be more sophisticated)
        for (const [inputId, inputGroup] of inputGroups.entries()) {
          if (
            Math.abs(outputLog.timestamp - inputGroup.input.timestamp) < 60000
          ) {
            // Within 1 minute
            inputGroup.outputs.push(outputLog);
            break;
          }
        }
      }
    }

    // Convert to pairs format
    for (const [inputId, inputGroup] of inputGroups.entries()) {
      if (inputGroup.outputs.length > 0) {
        const responses = inputGroup.outputs.map((output) => ({
          text: this.extractContent(output.content),
          score: this.calculateResponseScore(inputGroup.input, output),
          success: !output.error,
          model: "unknown",
          metadata: {
            outputId: output.id,
            timestamp: output.timestamp,
          },
        }));

        pairs.push({
          inputId,
          input: this.extractContent(inputGroup.input.content),
          responses,
          timestamp: inputGroup.input.timestamp,
          context: inputGroup.context,
        });
      }
    }

    return pairs;
  }

  private calculateResponseScore(input: InputRef, output: OutputRef): number {
    let score = 0.5; // Base score

    // Length appropriateness
    const inputLength = this.extractContent(input.content).length;
    const outputLength = this.extractContent(output.content).length;

    if (outputLength > inputLength * 0.5 && outputLength < inputLength * 10) {
      score += 0.2;
    }

    // No errors
    if (!output.error) {
      score += 0.3;
    }

    // Response time (faster is better, within reason)
    const responseTime = output.timestamp - input.timestamp;
    if (responseTime < 5000) {
      // Less than 5 seconds
      score += 0.1;
    }

    // Content quality (basic heuristics)
    const content = this.extractContent(output.content).toLowerCase();
    if (content.includes("sorry") || content.includes("i don't know")) {
      score -= 0.1;
    }

    if (content.length > 50 && !content.includes("error")) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateGRPOQuality(
    responses: Array<{ score: number; rank: number }>
  ): number {
    if (responses.length < 2) return 0.3;

    // Quality based on score diversity and ranking clarity
    const scores = responses.map((r) => r.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const scoreRange = maxScore - minScore;

    // Good GRPO data has clear preferences
    let quality = 0.5;

    // Reward score diversity
    if (scoreRange > 0.3) quality += 0.2;
    if (scoreRange > 0.5) quality += 0.1;

    // Reward having high-quality top response
    if (maxScore > 0.7) quality += 0.2;

    return Math.min(1, quality);
  }

  // Helper methods

  private extractContent(content: any): string {
    if (typeof content === "string") {
      return content;
    }
    if (typeof content === "object") {
      return JSON.stringify(content);
    }
    return String(content);
  }

  private extractContextDescription(context: AgentContext<AnyContext>): string {
    return `Context: ${context.context.type}, ID: ${context.id}`;
  }

  private extractTags(context: AgentContext<AnyContext>): string[] {
    return [
      context.context.type,
      `context-${context.id.slice(0, 8)}`,
      "synthetic-data",
    ];
  }

  private extractThoughtSequences(
    group: Array<{ log: AnyRef; context: AgentContext<AnyContext> }>
  ): Array<Array<{ log: AnyRef; context: AgentContext<AnyContext> }>> {
    const sequences: Array<
      Array<{ log: AnyRef; context: AgentContext<AnyContext> }>
    > = [];
    let currentSequence: Array<{
      log: AnyRef;
      context: AgentContext<AnyContext>;
    }> = [];

    for (const item of group) {
      if (
        item.log.ref === "thought" ||
        item.log.ref === "action_call" ||
        item.log.ref === "action_result"
      ) {
        currentSequence.push(item);
      } else {
        if (currentSequence.length > 0) {
          sequences.push(currentSequence);
          currentSequence = [];
        }
      }
    }

    if (currentSequence.length > 0) {
      sequences.push(currentSequence);
    }

    return sequences;
  }

  private generateConversationSummary(
    messages: ConversationRecord["messages"]
  ): string {
    const userMessages = messages.filter((m) => m.role === "user").length;
    const assistantMessages = messages.filter(
      (m) => m.role === "assistant"
    ).length;
    return `Conversation with ${userMessages} user messages and ${assistantMessages} assistant responses`;
  }

  // Quality scoring methods

  private calculateQualityScore(input: InputRef, output: OutputRef): number {
    let score = 0.5; // Base score

    // Length check
    const inputLength = this.extractContent(input.content).length;
    const outputLength = this.extractContent(output.content).length;

    if (inputLength > 10 && outputLength > 20) score += 0.2;
    if (inputLength > 50 && outputLength > 100) score += 0.1;

    // Error check
    if (!output.error) score += 0.2;

    return Math.min(score, 1.0);
  }

  private calculateConversationQuality(
    messages: ConversationRecord["messages"]
  ): number {
    let score = 0.5;

    // Length and diversity
    if (messages.length >= 4) score += 0.2;
    if (messages.length >= 8) score += 0.1;

    // Content quality
    const avgLength =
      messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
    if (avgLength > 50) score += 0.2;

    return Math.min(score, 1.0);
  }

  private calculateReasoningQuality(
    reasoning: ReasoningChainRecord["reasoning"]
  ): number {
    let score = 0.3;

    // Number of steps
    if (reasoning.length >= 3) score += 0.3;
    if (reasoning.length >= 5) score += 0.2;

    // Completeness
    const stepsWithActions = reasoning.filter((r) => r.action).length;
    if (stepsWithActions > 0) score += 0.2;

    return Math.min(score, 1.0);
  }

  private calculateActionSequenceQuality(
    actions: ActionSequenceRecord["actions"]
  ): number {
    let score = 0.4;

    // Success rate
    const successRate =
      actions.filter((a) => a.success).length / actions.length;
    score += successRate * 0.4;

    // Diversity
    const uniqueActions = new Set(actions.map((a) => a.name)).size;
    if (uniqueActions > 1) score += 0.2;

    return Math.min(score, 1.0);
  }

  private calculateEpisodeQuality(
    thoughts: string[],
    actions: ActionSequenceRecord["actions"],
    success: boolean
  ): number {
    let score = 0.2;

    // Success bonus
    if (success) score += 0.3;

    // Thought quality
    if (thoughts.length >= 3) score += 0.2;

    // Action quality
    if (actions.length > 0) score += 0.2;

    // Coherence (basic check)
    const totalContent =
      thoughts.join(" ") + actions.map((a) => a.name).join(" ");
    if (totalContent.length > 100) score += 0.1;

    return Math.min(score, 1.0);
  }
}
