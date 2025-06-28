import { action } from "@daydreamsai/core";
import * as z from "zod/v4";
import { researchMemory, loadTask } from "../utils/research-memory.js";
import { generateSearchQueries } from "../utils/research-helpers.js";

// Action: Start Subagent Research
export const startSubagentResearchAction = action({
  name: "research.startSubagentResearch",
  description:
    "Start research for a specific subagent by providing it with generated search queries",
  schema: z.object({
    taskId: z.string().describe("The task ID of the subagent to start"),
  }),
  actionState: researchMemory,
  async handler({ taskId }, ctx, agent) {
    const task = await loadTask(taskId, agent.memory, ctx.actionMemory);
    if (!task) {
      return `<error>Task ${taskId} not found</error>`;
    }

    // Generate search queries based on the task objective and role
    const queries = generateSearchQueries(task);

    return `<subagent_research_started>
Starting research for ${task.role} subagent (Task: ${taskId})

<generated_queries>
**Generated Search Queries:**
${queries.map((q, i) => `${i + 1}. "${q}"`).join("\n")}
</generated_queries>

<task_context>
**Task Objective:** ${task.objective}
**Query Count:** ${queries.length}
</task_context>

<execution_instructions>
The subagent should now execute these ${
      queries.length
    } search queries using the research.executeResearchSearches action.

**IMPORTANT**: When calling research.executeResearchSearches, include:
- taskId: "${taskId}" 
- searchQueries: [list of the generated queries above]
- synthesisInstructions: "${task.outputFormat}"
</execution_instructions>

<thinking>
Review the queries and think about how they align with my domain expertise before executing
</thinking>
</subagent_research_started>`;
  },
});
