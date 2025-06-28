import { action } from "@daydreamsai/core";
import * as z from "zod/v4";
import { researchMemory, saveSession } from "../utils/research-memory.js";
import {
  analyzeComplexity,
  getSubagentCount,
  getResearchStrategy,
  createDetailedPlan,
} from "../utils/research-helpers.js";
import type { ResearchSession } from "../types/research-types.js";

// Action: Create Research Plan (replaces planning phase)
export const createResearchPlanAction = action({
  name: "research.createResearchPlan",
  description:
    "Analyze a research query and create a detailed research plan with specialized subagent tasks",
  schema: z.object({
    query: z.string().describe("The research question or topic to analyze"),
    maxSubagents: z.number().min(1).max(10).default(5).optional(),
  }),
  actionState: researchMemory,
  async handler({ query, maxSubagents = 5 }, ctx, agent) {
    // Determine complexity based on query analysis
    const complexity = analyzeComplexity(query);
    const numSubagents = getSubagentCount(complexity, maxSubagents);

    // Create the research session
    const sessionId = `research-${Date.now()}`;
    const session: ResearchSession = {
      id: sessionId,
      query,
      status: "planning",
      startTime: Date.now(),
      subagentResults: [],
    };

    await saveSession(sessionId, session, agent.memory, ctx.actionMemory);

    return `<research_plan_created>
I'll create a comprehensive research plan for: "${query}"

<analysis>
**Query complexity:** ${complexity}
**Recommended subagents:** ${numSubagents}
**Research strategy:** ${getResearchStrategy(complexity)}
</analysis>

<proposed_plan>
**Proposed Research Plan:**
${createDetailedPlan(query, complexity, numSubagents)}
</proposed_plan>

<plan_summary>
The plan divides the research into specialized subtasks with clear boundaries to prevent overlap and ensure comprehensive coverage. Each subagent will have specific objectives and output requirements.
</plan_summary>

<session_info>
**Session ID:** ${sessionId}
**Status:** Ready to delegate tasks to subagents
</session_info>

<next_action>
Use research.delegateResearchTask to assign work to specialized subagents
</next_action>
</research_plan_created>`;
  },
});
