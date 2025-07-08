import type { AnyContext, ContextState } from "@/types/context";
import { render, type InferPromptVariables } from "../../__prompt";
import {
  formatAction,
  formatContextState,
  formatMemory,
  formatOutputInterface,
  formatWorkingMemory,
  xml,
} from "@/engines/xml/formatters";
import type { Output } from "@/types/components";
import type { AnyAction } from "@/types/action";
import type { WorkingMemory } from "@/types/wm";
import type { AnyMemory } from "@/types/memory";

export const templateSections = {
  intro: `\
You are tasked with analyzing inputs, formulating outputs, and initiating actions based on the given contexts. 
You will be provided with a set of available actions, outputs, and contexts. 
Your instructions are to analyze the situation and respond appropriately.`,
  instructions: `\
Follow these steps to process the updates:

1. Analyze the updates and available data:
  Wrap your reasoning process in <reasoning> tags. Consider:

  - Check the available data to avoid redundant action calls
  - The availabe contexts and their state
  - The available actions and their asynchronous nature
  - The content of the new updates
  - Potential dependencies between actions

  Response determination guidelines:

  a) First check if required state exists in the available contexts
  b) Respond to direct questions or requests for information

2. Plan actions:
  Before formulating a response, consider:

  - What data is already available
  - Which actions need to be initiated
  - The order of dependencies between actions
  - How to handle potential action failures
  - What information to provide while actions are processing

3. Formulate a output (if needed):
  If you decide to respond to the message, use <output> tags to enclose your output.
  Consider:

  - Using available data when possible
  - Acknowledging that certain information may not be immediately available
  - Setting appropriate expectations about action processing time
  - Indicating what will happen after actions complete
  - You can only use outputs listed in the <available_outputs> section
  - Follow the schemas provided for each output
  - Never encode the output content
  
4. Initiate actions (if needed):
  Use <action_call> tags to initiate actions. Remember:

  - Actions are processed asynchronously after your response
  - Results will not be immediately available
  - You can only use actions listed in the <available_actions> section
  - Follow the schemas provided for each action
  - Actions should be used when necessary to fulfill requests or provide information that cannot be conveyed through a simple response
  - If action belongs to a context and there is many instances of the context use <action_call contextKey="[Context key]">

5. No output or action:
  If you determine that no output or action is necessary, don't respond to that message.`,
  content: `\
Here is the current contexts:
{{contexts}}

Here is the current working memory:
{{workingMemory}}

Now, analyze the following updates:
{{updates}}

Here are the available actions you can initiate:
{{actions}}

Here are the available outputs you can use (full details):
{{outputs}}
`,
  response: `\
Here's how you structure your response:
<response>
<reasoning>
[Your reasoning of the context, think, messages, and planned actions]
</reasoning>

[List of async action calls to be initiated, if applicable]
<action_call name="[Action name]">
[action arguments using the schema and format]
</action_call>

[List of outputs, if applicable]
<output name="[Output name]">
[output content]
</output>
</response>`,

  footer: `\
Remember:
- Always correlate results with their original actions using callId
- Never repeat your outputs
- Consider the complete chain of events when formulating responses
- Address any failures or unexpected results explicitly
- Initiate follow-up actions only when necessary
- Provide clear, actionable insights based on the combined results
- Maintain context awareness between original request and final results

IMPORTANT: 
Always include the 'name' attribute in the output tag and ensure it matches one of the available output listed above.
Remember to include the other attribute in the output tag and ensure it matches the output attributes schema.
If you say you will perform an action, you MUST issue the corresponding action call here
Always check the correct format for each action: JSON or XML
</output>`,
} as const;

export const promptTemplate = `\
{{intro}}

{{instructions}}

{{content}}

{{response}}

{{footer}}
`;

export function formatPromptComponents({
  contexts,
  outputs,
  actions,
  memories,
  updates,
  maxWorkingMemorySize,
  chainOfThoughtSize,
}: {
  contexts: ContextState<AnyContext>[];
  outputs: Output[];
  actions: AnyAction[];
  memories: AnyMemory[];
  updates: AnyMemory[];
  maxWorkingMemorySize?: number;
  chainOfThoughtSize?: number;
}) {
  return {
    actions: xml("available-actions", undefined, actions.map(formatAction)),
    outputs: xml(
      "available-outputs",
      undefined,
      outputs.map(formatOutputInterface)
    ),
    contexts: xml("contexts", undefined, contexts.map(formatContextState)),
    workingMemory: xml(
      "working-memory",
      undefined,
      memories.map((i) => formatMemory(i)).flat()
    ),
    thoughts: xml("thoughts", undefined, []),
    updates: xml(
      "updates",
      undefined,
      updates.map((i) => formatMemory(i)).flat()
    ),
  };
}

// WIP

export const mainPrompt = {
  name: "main",
  template: promptTemplate,
  sections: templateSections,
  render: (data: ReturnType<typeof formatPromptComponents>) => {
    const sections = Object.fromEntries(
      Object.entries(mainPrompt.sections).map(([key, templateSection]) => [
        key,
        render(templateSection, data as any),
      ])
    ) as Record<keyof typeof templateSections, string>;
    return render(mainPrompt.template, sections);
  },
  formatter: formatPromptComponents,
} as const;

export type PromptConfig = typeof mainPrompt;
