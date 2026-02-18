import type {
  PromptBuilder,
  PromptBuildContext,
  PromptBuildResult,
} from "../types";
import { mainPrompt } from "./main";

/**
 * Default PromptBuilder adapter that wraps the existing mainPrompt implementation.
 * This preserves current behavior while allowing users to inject their own builders.
 */
export const defaultPromptBuilder: PromptBuilder = {
  name: "main",
  build(input: PromptBuildContext): PromptBuildResult {
    const data = mainPrompt.formatter({
      contexts: input.contexts,
      actions: input.actions,
      outputs: input.outputs,
      workingMemory: input.workingMemory,
      chainOfThoughtSize: input.chainOfThoughtSize ?? 0,
      maxWorkingMemorySize: input.settings?.maxWorkingMemorySize,
    });

    const prompt = mainPrompt.render(data);
    return { prompt };
  },
};

export default defaultPromptBuilder;
