/**
 * {{MODEL_NAME}} template for a Daydreams agent
 * This template includes context for goals and tasks, and actions for managing them
 */
import { {{MODEL_IMPORT_FUNCTION}} } from "{{MODEL_IMPORT_PATH}}";
import {
    createDreams,
    context,
    render,
    action,
    validateEnv,
} from "@daydreamsai/core";
import { cliExtension } from "@daydreamsai/cli";
import { string, z } from "zod";

// Initialize {{MODEL_NAME}} client
const env = validateEnv(
    z.object({
        {{ENV_VAR_KEY}}: z.string().min(1, "{{ENV_VAR_KEY}} is required"),
    })
);

// Initialize {{MODEL_NAME}} client
const {{MODEL_VARIABLE}} = {{MODEL_IMPORT_FUNCTION}}({
    apiKey: env.{{ENV_VAR_KEY}}!,
});

const template = `
Goal: {{goal}} 
`;

type GoalMemory = {
    goal: string;
};

const goalContexts = context({
    type: "goal",
    schema: z.object({
        id: string(),
    }),

    key({ id }: { id: string }) {
        return id;
    },

    create(state) {
        return {
            id: state.args.id,
        };
    },

    render({ memory }: { memory: GoalMemory }) {
        return render(template, {
            goal: memory.goal,
        });
    },
});

createDreams({
    model: {{MODEL_VARIABLE}}("{{MODEL_VERSION}}"),
    extensions: [cliExtension],
    context: goalContexts,
    actions: [
        action({
            name: "addTask",
            description: "Add a task to the goal",
            schema: z.object({ task: z.string() }),
            handler(call, ctx, agent) {
              const agentMemory = ctx.agentMemory as GoalMemory;
              agentMemory.goal = call.data.task;
              return {};
            },
          }),
    ],
}).start({ id: "test" });
