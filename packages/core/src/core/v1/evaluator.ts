// needs tags, like model we need differnt dataset if needed
// basic idea run a function that collects successful run data (examples) into db
// uses that data to generate more
// collect metrics
// collect good/bad examples
// evaluations:
// First, there's accuracy evaluation - checking if the model's outputs match expected results or ground truth. For instance, in a language model, this might involve checking if translations are correct or if responses are factually accurate.
// Then there's behavioral evaluation - assessing if the model behaves appropriately in different scenarios. This includes checking for consistency in responses, adherence to ethical guidelines, and appropriate handling of edge cases.
// Performance evaluation is another crucial aspect - measuring computational efficiency, response times, and resource usage. This helps ensure the model is practically viable for real-world applications.
// The evaluator also plays a vital role in the development cycle by providing feedback for improvement. When it identifies areas where the model falls short, this information can be used to refine training data, adjust model parameters, or modify the architecture.

type EvaluatorConfig<Data = any, Args = any, Result = any> = {
  key: string;
  load: () => Promise<Data> | Data;
  run: (args: Args, data: Data) => Promise<Result> | Result;
  save: (result: Result, data: Data) => Promise<void> | void;
};

type Evaluator = {};

function createEvaluator<Data = any, Args = any, Result = any>(
  config: EvaluatorConfig<Data, Args, Result>
): Evaluator {
  return {};
}

const myEvaluator = createEvaluator({
  key: "research",
  load: () => ({ examples: [] }),
  run: async ({ test }: { test: boolean }) => {
    return { yes: true };
  },
  save: async (result, data) => {},
});

console.log({ myEvaluator });
