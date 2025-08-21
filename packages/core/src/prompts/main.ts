import { formatWorkingMemory } from "../context";
import {
  formatAction,
  formatContextLog,
  formatContextState,
  formatOutputInterface,
  render,
  xml,
} from "../formatters";
import type { Prompt } from "../prompt";
import type {
  AnyAction,
  AnyContext,
  ContextState,
  Output,
  WorkingMemory,
} from "../types";
import type { MemoryResult } from "../memory/types";

export const templateSections = {
  intro: `\
  You are an expert AI agent controlling a multi-context software application.`,

  instructions: `\
## Primary Objective
Your main goal is to analyze the user's request in the <current-task> and use the available tools to resolve it. Prioritize completing this task above all else.

## Core Directives
1.  **Analyze**: Start by understanding the <current-task> and the current <context-state>.
2.  **Reason**: Plan your steps inside a <reasoning> tag. Your plan must reference the available tools and decide the best course of action.
3.  **Execute**: Use <action_call> and <output> tags to execute your plan. You MUST provide the corresponding calls for any actions you mention in your reasoning.

## Response Format & Rules
Your entire response MUST be a single, valid XML block enclosed in <response> tags.

- **<reasoning> (Required):** Your step-by-step thought process.
- **<action_call> (Optional):** Must have a 'name' attribute. The content MUST be valid JSON.
- **<output> (Optional):** Must have a 'name' attribute. The content MUST be valid JSON.
- **Adherence**: You must strictly follow the provided examples for formatting.

---
## Examples of High-Quality Responses

//--- START OF EXAMPLE 1 ---//
### Situation:
The user has provided their name, and the assistant needs to save it.

### Context:
<current-task>
  <input name="text" timestamp="123456789">my name is Clara</input>
</current-task>
<context-state>
  ... (state shows name is unknown)
</context-state>

### Correct Response:
<response>
  <reasoning>The user stated their name is Clara. I must use the 'remember-name' action to save it and then confirm with an output.</reasoning>
  <action_call name="remember-name">{"name":"Clara"}</action_call>
  <output name="text">{"content": "Thanks, Clara! I'll remember that."}</output>
</response>
//--- END OF EXAMPLE 1 ---//

### Template Engine
<template-engine>
Purpose: Utilize the template engine ({{...}} syntax) primarily to streamline workflows by transferring data between different components within the same turn. This includes passing outputs from actions into subsequent action arguments, or embedding data from various sources directly into response outputs. This enhances efficiency and reduces interaction latency.

Data Referencing: You can reference data from:
Action Results: Use {{calls[index].path.to.value}} to access outputs from preceding actions in the current turn (e.g., {{calls[0].sandboxId}}). Ensure the index correctly points to the intended action call.
Short-Term Memory: Retrieve values stored in short-term memory using {{shortTermMemory.key}}

When to Use:
Data Injection: Apply templating when an action argument or a response output requires specific data (like an ID, filename, status, or content) from an action result, configuration, or short-term memory available within the current turn.
Direct Dependencies: Particularly useful when an action requires a specific result from an action called immediately before it in the same turn.
</template-engine>
`,

  content: `\
## CURRENT SITUATION

### Active Task
{{currentTask}}

### Context State
{{contextState}}

### Operations in Progress
{{activeOperations}}

---

## AVAILABLE TOOLS

### Actions You Can Initiate
{{actions}}

### Output Methods
{{outputs}}

---

## CONTEXTUAL KNOWLEDGE

### Relevant Prior Knowledge
{{semanticContext}}

### Recent Interaction History
{{recentHistory}}

### Decision Context
{{decisionContext}}`,

  response: `\
Now, generate your response based on the rules and examples above. Begin with the opening <response> tag.
`,

  footer: `
`,
} as const;

export const promptTemplate = `\
{{intro}}

{{instructions}}

{{content}}

{{response}}

{{footer}}
`;

// Helper function to reduce XML wrapper duplication
function xmlSection(
  tag: string,
  content: any[],
  fallback: string[]
): ReturnType<typeof xml> {
  return xml(tag, undefined, content.length > 0 ? content : fallback);
}

export function formatPromptSections({
  contexts,
  outputs,
  actions,
  workingMemory,
  maxWorkingMemorySize,
  chainOfThoughtSize,
}: {
  contexts: ContextState<AnyContext>[];
  outputs: Output[];
  actions: AnyAction[];
  workingMemory: WorkingMemory;
  maxWorkingMemorySize?: number;
  chainOfThoughtSize?: number;
}) {
  // Get unprocessed items that need attention
  const unprocessedLogs = [
    ...(workingMemory.inputs?.filter((log) => !log.processed) ?? []),
    ...(workingMemory.calls?.filter((log) => !log.processed) ?? []),
    ...(workingMemory.results?.filter((log) => !log.processed) ?? []),
  ].sort((a, b) => a.timestamp - b.timestamp);

  // Get pending action calls
  const pendingActions =
    workingMemory.calls?.filter((call) => {
      const hasResult = workingMemory.results?.some(
        (result) => result.callId === call.id
      );
      return !hasResult;
    }) ?? [];

  // Get recent conversation flow (processed inputs/outputs)
  const recentConversation = [
    ...(workingMemory.inputs?.filter((log) => log.processed) ?? []),
    ...(workingMemory.outputs?.filter((log) => log.processed) ?? []),
  ]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-(maxWorkingMemorySize ?? 10));

  // Get key reasoning from recent thoughts
  const keyThoughts =
    workingMemory.thoughts
      ?.slice(-(chainOfThoughtSize ?? 3))
      ?.map((log) => formatContextLog(log)) ?? [];

  // Format relevant memories for semantic context
  const formatMemory = (memory: MemoryResult) => {
    const score = memory.score
      ? ` (relevance: ${(memory.score * 100).toFixed(0)}%)`
      : "";
    const timestamp = memory.timestamp
      ? ` [${new Date(memory.timestamp).toLocaleString()}]`
      : "";

    if (memory.type === "episode") {
      return `**Episode Memory**${score}${timestamp}: ${JSON.stringify(
        memory.content
      )}`;
    } else {
      return `**${
        memory.type || "Memory"
      }**${score}${timestamp}: ${JSON.stringify(memory.content)}`;
    }
  };

  const relevantMemories =
    workingMemory.relevantMemories && workingMemory.relevantMemories.length > 0
      ? workingMemory.relevantMemories.map(formatMemory)
      : ["No relevant memories found."];

  return {
    // CURRENT SITUATION
    currentTask: xmlSection(
      "current-task",
      unprocessedLogs.map((log) => formatContextLog(log)),
      ["No pending tasks."]
    ),
    contextState: xml(
      "context-state",
      undefined,
      contexts.map(formatContextState)
    ),
    activeOperations: xmlSection(
      "active-operations",
      pendingActions.map((call) => formatContextLog(call)),
      ["No operations in progress."]
    ),

    // AVAILABLE TOOLS
    actions: xmlSection("available-actions", actions.map(formatAction), [
      "No actions available.",
    ]),
    outputs: xmlSection(
      "available-outputs",
      outputs.map(formatOutputInterface),
      ["No outputs available."]
    ),

    // CONTEXTUAL KNOWLEDGE
    semanticContext: xml("semantic-context", undefined, relevantMemories),
    recentHistory: xmlSection(
      "recent-history",
      recentConversation.map((log) => formatContextLog(log)),
      ["No recent conversation history."]
    ),
    decisionContext: xmlSection("decision-context", keyThoughts, [
      "No recent reasoning available.",
    ]),
  };
}

// WIP
export const mainPrompt = {
  name: "main",
  template: promptTemplate,
  sections: templateSections,
  render: (data: ReturnType<typeof formatPromptSections>) => {
    const sections = Object.fromEntries(
      Object.entries(mainPrompt.sections).map(([key, templateSection]) => [
        key,
        render(templateSection, data as any),
      ])
    ) as Record<keyof typeof templateSections, string>;
    return render(mainPrompt.template, sections);
  },
  formatter: formatPromptSections,
} as const;

export type PromptConfig = typeof mainPrompt;
