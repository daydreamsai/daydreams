/**
 * Example Gigaverse Integration
 *
 * This file demonstrates integration with the Gigaverse game ecosystem.
 * It sets up an agent that can interact with the Gigaverse API to:
 * - Navigate dungeons
 * - Make combat decisions
 * - Select loot and rewards
 * - Manage inventory and character progression
 *
 * The agent uses a goal-oriented approach to plan and execute actions
 * within the game world, making strategic decisions based on the current
 * game state and available options.
 *
 * Authentication is handled via the GIGA_TOKEN environment variable,
 * which must be properly configured for API access. This is the Bearer token. You can copy this from your browser environment.
 */

import { anthropic } from "@ai-sdk/anthropic";
import {
  createDreams,
  context,
  render,
  action,
  validateEnv,
  LogLevel,
  Logger,
  type ActionCall,
  type Agent,
} from "@daydreamsai/core";
import { cliExtension } from "@daydreamsai/cli";
import { string, z } from "zod";

const env = validateEnv(
  z.object({
    ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
    GIGA_TOKEN: z.string().min(1, "GIGA_TOKEN is required"),
  })
);

// 1. Take action -> check health -> check loot phase = true -> select loot
// 2. Select the loot -> takes to new phase -> take 1. again

const template = `

// inject more information about how you want it to play....


Goal: {{goal}} 
Tasks: {{tasks}}
Current Task: {{currentTask}}
`;

const goalContexts = context({
  type: "goal",
  schema: z.object({
    id: string(),
    initialGoal: z.string(),
    initialTasks: z.array(z.string()),
  }),

  key({ id }) {
    return id;
  },

  create(state) {
    return {
      goal: state.args.initialGoal,
      tasks: state.args.initialTasks ?? [],
      currentTask: state.args.initialTasks?.[0],
    };
  },

  render({ memory }) {
    return render(template, {
      goal: memory.goal,
      tasks: memory.tasks.join("\n"),
      currentTask: memory.currentTask ?? "NONE",
    });
  },
});

// ==========================================
// ACTIONS DEFINITION
// ==========================================

/**
 * Create the Gigaverse agent with all necessary actions
 */
createDreams({
  logger: new Logger({ level: LogLevel.INFO }),
  model: anthropic("claude-3-7-sonnet-latest"),
  extensions: [cliExtension],
  context: goalContexts,
  actions: [
    // start run (sends the starting 1-2 dungeon)
    // collect loot (selects the loot from the resonse)
    /**
     * Action to attack in the rock-paper-scissors game
     */
    action({
      name: "attackInDungeon",
      description:
        "Attack in the dungeon using rock-paper-scissors game mechanics",
      schema: z
        .object({
          action: z
            .enum([
              "rock",
              "paper",
              "scissor",
              "loot_one",
              "loot_two",
              "loot_three",
            ])
            .describe("The attack move to make"),
          dungeonId: z
            .number()
            .default(0)
            .describe("The ID of the dungeon. It is always 0. "),
        })
        .describe(
          "You use this to make an action in a dungeon. If the lootPhase == true then you can select the Loot option, which will then take you to the next phase. If the lootPhase == false then you can select the Rock, Paper, Scissors option."
        ),
      async handler(data, ctx: any, agent: Agent) {
        try {
          const { action, dungeonId } = data;

          const payload = {
            action: action,
            actionToken: new Date().getTime().toString(),
            dungeonId: dungeonId,
          };

          const response = await fetch(
            "https://gigaverse.io/api/game/dungeon/action",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.GIGA_TOKEN}`,
              },
              body: JSON.stringify(payload),
            }
          );

          if (!response.ok) {
            throw new Error(
              `Attack action failed with status ${response.status}`
            );
          }

          const result = await response.json();
          return {
            success: true,
            result,
            message: `Successfully performed ${action} attack in dungeon ${0}`,
          };
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error("Error performing attack action:", error);
          return {
            success: false,
            error: errorMessage,
            message: "Failed to perform attack action",
          };
        }
      },
    }),

    /**
     * Action to fetch upcoming enemies data
     */
    action({
      name: "getUpcomingEnemies",
      description:
        "Fetch information about all upcoming enemies in the dungeon",
      schema: z.object({}), // No parameters needed for this GET request
      async handler(data, ctx: any, agent: Agent) {
        try {
          const response = await fetch(
            "https://gigaverse.io/api/indexer/enemies",
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.GIGA_TOKEN}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              `Fetch enemies failed with status ${response.status}`
            );
          }

          const result = await response.json();
          return {
            success: true,
            enemies: result,
            message: "Successfully fetched upcoming enemies data",
          };
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error("Error fetching enemies data:", error);
          return {
            success: false,
            error: errorMessage,
            message: "Failed to fetch upcoming enemies data",
          };
        }
      },
    }),

    /**
     * Action to fetch the player's current state in the dungeon
     */
    action({
      name: "getPlayerState",
      description: "Fetch the current state of the player in the dungeon",
      schema: z.object({}), // No parameters needed for this GET request
      async handler(data, ctx: any, agent: Agent) {
        try {
          const response = await fetch(
            "https://gigaverse.io/api/game/dungeon/state",
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.GIGA_TOKEN}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              `Fetch player state failed with status ${response.status}`
            );
          }

          const result = await response.json();
          return {
            success: true,
            playerState: result,
            message: "Successfully fetched player's dungeon state",
          };
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error("Error fetching player state:", error);
          return {
            success: false,
            error: errorMessage,
            message: "Failed to fetch player's dungeon state",
          };
        }
      },
    }),

    /**
     * Action to start a new dungeon run
     */
    action({
      name: "startNewRun",
      description:
        "Start a new dungeon run. Use this when the player dies or wants to start a new run from outside the dungeon.",
      schema: z.object({
        dungeonId: z
          .number()
          .default(1)
          .describe("The ID of the dungeon to start. Default is 1."),
      }),
      async handler(data, ctx: any, agent: Agent) {
        try {
          const { dungeonId } = data;

          const payload = {
            action: "start_run",
            actionToken: new Date().getTime().toString(),
            dungeonId: dungeonId,
          };

          const response = await fetch(
            "https://gigaverse.io/api/game/dungeon/action",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.GIGA_TOKEN}`,
              },
              body: JSON.stringify(payload),
            }
          );

          if (!response.ok) {
            throw new Error(
              `Start new run failed with status ${response.status}`
            );
          }

          const result = await response.json();
          return {
            success: true,
            result,
            message: `Successfully started a new run in dungeon ${dungeonId}`,
          };
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error("Error starting new run:", error);
          return {
            success: false,
            error: errorMessage,
            message: "Failed to start a new dungeon run",
          };
        }
      },
    }),
  ],
}).start({ id: "test", initialGoal: "", initialTasks: [] });
