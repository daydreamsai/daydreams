import { describe, it, expect, beforeEach } from "vitest";
import { context } from "../context";
import { createDreams } from "../dreams";
import type {
  EpisodeHooks,
  Agent,
  AnyRef,
  WorkingMemory,
  ContextState,
} from "../types";

describe("Episode Hooks Examples", () => {
  let agent: Agent;

  beforeEach(async () => {
    agent = createDreams({
      model: {
        provider: "test",
        modelId: "test-model",
      } as any,
    });
    await agent.start({});
  });

  describe("Chat/Conversation Episodes", () => {
    it("should use default episode hooks for simple chat", async () => {
      // Default behavior: input → output episodes
      const chatContext = context({
        type: "chat",
        // No episodeHooks = use defaults
      });

      const contextState = await agent.getContext({
        context: chatContext,
        args: { userId: "user1" },
      });

      expect(contextState.context.episodeHooks).toBeUndefined();
      // Default behavior should work automatically
    });

    it("should use custom chat episode hooks with conversation tracking", async () => {
      const conversationHooks: EpisodeHooks = {
        shouldStartEpisode: (ref, memory, ctx, agent) => {
          // Start episode on user input
          return ref.ref === "input" && ref.type === "user_message";
        },

        shouldEndEpisode: (ref, memory, ctx, agent) => {
          // End episode when assistant responds
          return (
            ref.ref === "output" &&
            ref.type === "assistant_message" &&
            ref.processed
          );
        },

        createEpisode: (logs, ctx, agent) => {
          const userMessage = logs.find((l) => l.ref === "input");
          const assistantMessage = logs.find((l) => l.ref === "output");
          const thoughts = logs.filter((l) => l.ref === "thought");

          return {
            type: "conversation_turn",
            user: {
              message: userMessage?.content,
              timestamp: userMessage?.timestamp,
            },
            assistant: {
              message: assistantMessage?.content,
              timestamp: assistantMessage?.timestamp,
              reasoning: thoughts.map((t) => t.content),
            },
            context: ctx.id,
            conversationTurn: true,
          };
        },

        classifyEpisode: (episodeData, ctx) => "chat_conversation",

        extractMetadata: (episodeData, logs, ctx) => ({
          userId: ctx.args?.userId,
          messageCount: logs.filter((l) => ["input", "output"].includes(l.ref))
            .length,
          hasReasoning: logs.some((l) => l.ref === "thought"),
        }),
      };

      const chatContext = context({
        type: "chat_with_hooks",
        episodeHooks: conversationHooks,
      });

      const contextState = await agent.getContext({
        context: chatContext,
        args: { userId: "user1" },
      });

      expect(contextState.context.episodeHooks).toBeDefined();
      expect(
        contextState.context.episodeHooks!.shouldStartEpisode
      ).toBeDefined();
      expect(contextState.context.episodeHooks!.createEpisode).toBeDefined();
    });
  });

  describe("Task-Based Episodes", () => {
    it("should create task-oriented episode hooks", async () => {
      const taskHooks: EpisodeHooks = {
        shouldStartEpisode: (ref, memory, ctx, agent) => {
          // Start episode when a task is received
          return ref.ref === "input" && ref.data?.type === "task";
        },

        shouldEndEpisode: (ref, memory, ctx, agent) => {
          // End episode when task is complete (all actions resolved and final output given)
          if (ref.ref !== "output" || !ref.processed) return false;

          // Check if all action calls have corresponding results
          const pendingActions = memory.calls.filter(
            (call) =>
              !memory.results.some((result) => result.callId === call.id)
          );

          return pendingActions.length === 0 && ref.data?.taskComplete === true;
        },

        createEpisode: (logs, ctx, agent) => {
          const task = logs.find((l) => l.ref === "input");
          const actions = logs.filter((l) => l.ref === "action_call");
          const results = logs.filter((l) => l.ref === "action_result");
          const finalOutput = logs.find((l) => l.ref === "output");
          const thoughts = logs.filter((l) => l.ref === "thought");

          return {
            type: "task_execution",
            task: {
              description: task?.content,
              data: task?.data,
              timestamp: task?.timestamp,
            },
            execution: {
              actions: actions.map((a) => ({
                name: a.name,
                args: a.data,
                timestamp: a.timestamp,
              })),
              results: results.map((r) => ({
                callId: r.callId,
                data: r.data,
                timestamp: r.timestamp,
              })),
              reasoning: thoughts.map((t) => t.content),
            },
            outcome: {
              result: finalOutput?.data,
              success: finalOutput?.data?.taskComplete === true,
              timestamp: finalOutput?.timestamp,
            },
            metrics: {
              duration: (finalOutput?.timestamp || 0) - (task?.timestamp || 0),
              actionCount: actions.length,
              reasoningSteps: thoughts.length,
            },
          };
        },

        classifyEpisode: (episodeData, ctx) => {
          return episodeData.outcome?.success
            ? "successful_task"
            : "failed_task";
        },

        extractMetadata: (episodeData, logs, ctx) => ({
          taskType: episodeData.task?.data?.type,
          complexity:
            episodeData.execution?.actions?.length > 3 ? "high" : "low",
          efficiency: episodeData.metrics?.duration < 30000 ? "fast" : "slow",
        }),
      };

      const taskContext = context({
        type: "task_agent",
        episodeHooks: taskHooks,
      });

      const contextState = await agent.getContext({
        context: taskContext,
        args: { agentId: "task-1" },
      });

      expect(contextState.context.episodeHooks).toBeDefined();
      expect(typeof contextState.context.episodeHooks!.shouldEndEpisode).toBe(
        "function"
      );
      expect(typeof contextState.context.episodeHooks!.createEpisode).toBe(
        "function"
      );
    });
  });

  describe("Game-Based Episodes", () => {
    it("should create game-oriented episode hooks", async () => {
      const gameHooks: EpisodeHooks = {
        shouldStartEpisode: (ref, memory, ctx, agent) => {
          // Start episode on game start or new round
          return (
            (ref.ref === "input" && ref.data?.action === "start_game") ||
            (ref.ref === "thought" && ref.content?.includes("new round"))
          );
        },

        shouldEndEpisode: (ref, memory, ctx, agent) => {
          // End episode when game/round ends
          return (
            ref.ref === "output" &&
            ref.processed &&
            (ref.data?.gameOver === true || ref.data?.roundComplete === true)
          );
        },

        createEpisode: (logs, ctx, agent) => {
          const gameStart = logs.find((l) => l.ref === "input");
          const moves = logs.filter((l) => l.ref === "action_call");
          const thoughts = logs.filter((l) => l.ref === "thought");
          const gameEnd = logs.find((l) => l.ref === "output");

          // Extract game state changes from action results
          const gameStates = logs
            .filter((l) => l.ref === "action_result")
            .map((r) => r.data?.gameState)
            .filter(Boolean);

          return {
            type: "game_session",
            game: {
              id: gameStart?.data?.gameId,
              type: gameStart?.data?.gameType,
              startTime: gameStart?.timestamp,
              endTime: gameEnd?.timestamp,
            },
            gameplay: {
              moves: moves.map((m) => ({
                action: m.name,
                params: m.data,
                timestamp: m.timestamp,
              })),
              states: gameStates,
              strategy: thoughts
                .filter(
                  (t) =>
                    t.content?.includes("strategy") ||
                    t.content?.includes("plan")
                )
                .map((t) => t.content),
            },
            outcome: {
              result: gameEnd?.data?.result,
              score: gameEnd?.data?.score,
              winner: gameEnd?.data?.winner,
              reason: gameEnd?.data?.endReason,
            },
            stats: {
              duration: (gameEnd?.timestamp || 0) - (gameStart?.timestamp || 0),
              moveCount: moves.length,
              thinkingTime: thoughts.length,
            },
          };
        },

        classifyEpisode: (episodeData, ctx) => {
          const outcome = episodeData.outcome?.result;
          return outcome === "win"
            ? "victory"
            : outcome === "loss"
            ? "defeat"
            : outcome === "draw"
            ? "draw"
            : "game_session";
        },

        extractMetadata: (episodeData, logs, ctx) => ({
          gameType: episodeData.game?.type,
          difficulty: episodeData.stats?.moveCount > 10 ? "hard" : "easy",
          performance: episodeData.outcome?.score || 0,
          playStyle:
            episodeData.stats?.thinkingTime > 5 ? "strategic" : "quick",
        }),
      };

      const gameContext = context({
        type: "game_agent",
        episodeHooks: gameHooks,
      });

      const contextState = await agent.getContext({
        context: gameContext,
        args: { gameId: "chess-1" },
      });

      expect(contextState.context.episodeHooks).toBeDefined();
      expect(typeof contextState.context.episodeHooks!.shouldStartEpisode).toBe(
        "function"
      );
      expect(typeof contextState.context.episodeHooks!.classifyEpisode).toBe(
        "function"
      );
    });
  });

  describe("Run-Based Episodes", () => {
    it("should create run-aligned episode hooks", async () => {
      const runHooks: EpisodeHooks = {
        shouldStartEpisode: (ref, memory, ctx, agent) => {
          // Start episode when a run begins
          return ref.ref === "run";
        },

        shouldEndEpisode: (ref, memory, ctx, agent) => {
          // End episode when run completes
          return ref.ref === "run" && ref.processed;
        },

        createEpisode: (logs, ctx, agent) => {
          const runStart = logs.find((l) => l.ref === "run");
          const steps = logs.filter((l) => l.ref === "step");
          const inputs = logs.filter((l) => l.ref === "input");
          const outputs = logs.filter((l) => l.ref === "output");
          const actions = logs.filter((l) => l.ref === "action_call");
          const results = logs.filter((l) => l.ref === "action_result");

          return {
            type: "agent_run",
            run: {
              id: runStart?.id,
              startTime: runStart?.timestamp,
              endTime: logs[logs.length - 1]?.timestamp,
            },
            execution: {
              steps: steps.map((s, index) => ({
                stepNumber: index + 1,
                timestamp: s.timestamp,
              })),
              interactions: inputs.map((input, i) => ({
                input: input.content,
                output: outputs[i]?.content,
                inputTime: input.timestamp,
                outputTime: outputs[i]?.timestamp,
              })),
              actions: actions.map((a) => ({
                name: a.name,
                result: results.find((r) => r.callId === a.id)?.data,
              })),
            },
            metrics: {
              totalSteps: steps.length,
              totalInteractions: inputs.length,
              totalActions: actions.length,
              duration:
                (logs[logs.length - 1]?.timestamp || 0) -
                (runStart?.timestamp || 0),
            },
          };
        },

        classifyEpisode: (episodeData, ctx) => {
          const stepCount = episodeData.metrics?.totalSteps || 0;
          return stepCount > 5 ? "complex_run" : "simple_run";
        },

        extractMetadata: (episodeData, logs, ctx) => ({
          complexity: episodeData.metrics?.totalActions > 3 ? "high" : "low",
          efficiency: episodeData.metrics?.duration < 60000 ? "fast" : "slow",
          interactivity:
            episodeData.metrics?.totalInteractions > 1
              ? "interactive"
              : "autonomous",
        }),
      };

      const runContext = context({
        type: "run_based_agent",
        episodeHooks: runHooks,
      });

      const contextState = await agent.getContext({
        context: runContext,
        args: { sessionId: "run-1" },
      });

      expect(contextState.context.episodeHooks).toBeDefined();
      expect(typeof contextState.context.episodeHooks!.extractMetadata).toBe(
        "function"
      );
    });
  });

  describe("Default Behavior Validation", () => {
    it("should work without any episode hooks (default behavior)", async () => {
      const defaultContext = context({
        type: "default_agent",
        // No episodeHooks specified
      });

      const contextState = await agent.getContext({
        context: defaultContext,
        args: {},
      });

      // Should work fine with no hooks - uses default behavior
      expect(contextState.context.episodeHooks).toBeUndefined();
      expect(contextState.context.type).toBe("default_agent");
    });

    it("should handle partial hook definitions", async () => {
      const partialHooks: EpisodeHooks = {
        // Only define some hooks, others should use defaults
        shouldStartEpisode: (ref) => ref.ref === "input",
        createEpisode: (logs) => ({
          type: "custom_episode",
          logCount: logs.length,
          customData: "test",
        }),
        // shouldEndEpisode not defined - should use default
        // classifyEpisode not defined - should use default
        // extractMetadata not defined - should use default
      };

      const partialContext = context({
        type: "partial_hooks_agent",
        episodeHooks: partialHooks,
      });

      const contextState = await agent.getContext({
        context: partialContext,
        args: {},
      });

      expect(contextState.context.episodeHooks).toBeDefined();
      expect(
        contextState.context.episodeHooks!.shouldStartEpisode
      ).toBeDefined();
      expect(contextState.context.episodeHooks!.createEpisode).toBeDefined();
      expect(
        contextState.context.episodeHooks!.shouldEndEpisode
      ).toBeUndefined();
      expect(
        contextState.context.episodeHooks!.classifyEpisode
      ).toBeUndefined();
    });
  });
});
