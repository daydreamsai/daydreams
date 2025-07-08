import { z } from "zod";
import type { EventsRecord, Optional, Schema } from "./types/utils";
import type { AnyContext, Context, ContextCapabilities } from "./types/context";

export function getContextId<TContext extends AnyContext>(
  context: TContext,
  args: z.infer<TContext["schema"]>
) {
  return context.id ? context.id(args) : "default";
}

const defaultSchema = z.string().default("default");
type DefaultSchema = typeof defaultSchema;

export function context<
  TState = undefined,
  TSchema extends Schema = DefaultSchema,
  Deps = any,
  const Events extends EventsRecord = EventsRecord,
  const TContextCapabilities extends ContextCapabilities = ContextCapabilities,
>(
  config: Optional<
    Context<TState, TSchema, Deps, Events, TContextCapabilities>,
    "schema"
  >
): Context<TState, TSchema, Deps, Events, TContextCapabilities> {
  return {
    // kind: "context" as const,
    ...config,
    schema: (config.schema ?? defaultSchema) as TSchema,
  };
}

// function actions<TAction extends AnyAction>(
//   fn: Record<string, TAction>
// ): Actions extends Record<string, AnyAction>
//   ? {
//       [Name in keyof Actions]: Actions[Name] extends Action<
//         infer TContext,
//         infer TSchema
//       >
//         ? Action<TContext, TSchema>
//         : never;
//     }
//   : never {
//   return fn as any;
// }

// const weather = action({
//   name: "weather",
//   schema: { location: z.string() },
//   handler: async (args) => {
//     return { data: true };
//   },
// });

// const ctx = context({
//   name: "test",
//   schema: { id: z.string() },

//   events: {
//     test: { foo: z.string() },
//   },

//   state: memory({
//     name: "",
//     create(params, ctx) {
//       return { foo: "bar" };
//     },
//   }),

//   uses: {
//     actions: {},
//     memories: {
//       test: {
//         name: "yes",
//         create(params, ctx) {
//           return {
//             yes: true,
//           };
//         },
//       },
//     },
//   },

//   async start({ ctx }) {
//     ctx.state;
//   },

//   async run({ ctx, wm }) {
//     ctx.state;
//   },

//   async render() {
//     // context enginier
//     return;
//   },
// });

// // function sequential(config: {}) {}

// // function orchestrator<TState, TSchema extends Schema, Deps>(schema: TSchema) {
// //   return context<TState, TSchema, Deps, EventsRecord, ContextCapabilities>({
// //     name: "test",
// //     schema,
// //   });
// // }

// type Task<
//   TInput extends InputConfig = InputConfig,
//   TOutput extends OutputConfig = OutputConfig,
// > = {
//   name: string;
//   input: TInput;
//   output: TOutput;

//   prompt: (input: InferSchema<TInput["schema"]>) => string;
//   handler: (input: InferSchema<TOutput["schema"]>) => any;
// };

// function task<
//   TInput extends InputConfig = InputConfig,
//   TOutput extends OutputConfig = OutputConfig,
// >(config: Task<TInput, TOutput>) {
//   return config;
// }

// const analyze = task({
//   name: "analyze",
//   input: {
//     topic: z.string(),
//     depth: z.enum(["brief", "detailed", "comprehensive"]),
//   },
//   output: { title: z.string(), content: z.string() },

//   // model: select a model?

//   prompt: ({ topic, depth }) => {
//     // Function implementation
//     let depthInstructions = {
//       brief: "Provide a high-level overview with 1-2 key points.",
//       detailed: "Explore major aspects with supporting evidence.",
//       comprehensive:
//         "Conduct an exhaustive analysis with nuanced considerations.",
//     };

//     return `
// Task: Analyze ${topic} at a ${depth} level.

// Instructions:
// ${depthInstructions[depth]}
// `;
//   },

//   handler: ({ title, content }) => {},

//   // instructions
//   // prompt?
//   // actions?

//   // context? could run on a context? or we create a taskContext?

//   // render() compose prompt
//   // run
// });

// function flow(t: any) {}
// function orchestrator(t: any) {}

// const contentCreator = orchestrator({

//   // context: {},
//   // uses: {},

//   experts: {
//     planner: agent({

//     }),
//     researcher: context({
//       uses: {},
//     }),
//     writer: task({

//     }),
//     editor: {},
//   },
//   run(ctx) {
//     const plan = await ctx.experts.planner.send()
//     const response = await ctx.agent.run(ctx.experts.researcher, { plan }
//     // get research from response
//     let reasearch;
//     ....
//   }

// });

// // function flow({})

// sequential({
//   steps: {
//     write: task({}),
//     research: task({}),
//     analyze: task({}),
//   },
//   flow: ["analyze", "research", "write"]
// })

/*
┌───────────────────────────────────┐  ┌───────────────────────────────────┐
│ SEQUENTIAL (PIPELINE)             │  │ PARALLEL (MAP-REDUCE)             │
├───────────────────────────────────┤  ├───────────────────────────────────┤
│                                   │  │                                   │
│  ┌─────┐    ┌─────┐    ┌─────┐   │  │          ┌─────┐                  │
│  │     │    │     │    │     │   │  │    ┌────►│Cell │────┐             │
│  │Cell │───►│Cell │───►│Cell │   │  │    │     └─────┘    │             │
│  │     │    │     │    │     │   │  │    │                │             │
│  └─────┘    └─────┘    └─────┘   │  │ ┌─────┐         ┌─────┐           │
│                                   │  │ │     │         │     │           │
│ Best for: Step-by-step processes  │  │ │Split│         │Merge│           │
│ with clear dependencies           │  │ │     │         │     │           │
│                                   │  │ └─────┘         └─────┘           │
│                                   │  │    │                │             │
│                                   │  │    │     ┌─────┐    │             │
│                                   │  │    └────►│Cell │────┘             │
│                                   │  │          └─────┘                  │
│                                   │  │                                   │
│                                   │  │ Best for: Independent subtasks    │
│                                   │  │ that can be processed in parallel │
└───────────────────────────────────┘  └───────────────────────────────────┘

┌───────────────────────────────────┐  ┌───────────────────────────────────┐
│ FEEDBACK LOOP                     │  │ HIERARCHICAL                      │
├───────────────────────────────────┤  ├───────────────────────────────────┤
│                                   │  │                ┌─────┐             │
│  ┌─────┐    ┌─────┐    ┌─────┐   │  │                │Boss │             │
│  │     │    │     │    │     │   │  │                │Cell │             │
│  │Cell │───►│Cell │───►│Cell │   │  │                └─────┘             │
│  │     │    │     │    │     │   │  │                   │                │
│  └─────┘    └─────┘    └─────┘   │  │         ┌─────────┴─────────┐      │
│    ▲                      │      │  │         │                   │      │
│    └──────────────────────┘      │  │    ┌─────┐             ┌─────┐     │
│                                   │  │    │Team │             │Team │     │
│ Best for: Iterative refinement,   │  │    │Lead │             │Lead │     │
│ quality improvement loops         │  │    └─────┘             └─────┘     │
│                                   │  │       │                   │        │
│                                   │  │ ┌─────┴─────┐       ┌─────┴─────┐  │
│                                   │  │ │     │     │       │     │     │  │
│                                   │  │ │Cell │Cell │       │Cell │Cell │  │
│                                   │  │ │     │     │       │     │     │  │
│                                   │  │ └─────┴─────┘       └─────┴─────┘  │
│                                   │  │                                    │
│                                   │  │ Best for: Complex tasks requiring  │
│                                   │  │ multilevel coordination            │
└───────────────────────────────────┘  └────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                            THE ReAct PATTERN                              │
│                                                                           │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐               │
│  │             │      │             │      │             │               │
│  │  Thought    │─────►│   Action    │─────►│ Observation │─────┐         │
│  │             │      │             │      │             │     │         │
│  └─────────────┘      └─────────────┘      └─────────────┘     │         │
│        ▲                                                        │         │
│        └────────────────────────────────────────────────────────┘         │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

*/
