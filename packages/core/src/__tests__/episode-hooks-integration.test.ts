import { describe, it, expect, beforeEach, vi } from "vitest";
import { context, pushToWorkingMemoryWithManagement, createWorkingMemory } from "../context";
import { createDreams } from "../dreams";
import type { Agent, EpisodeHooks, InputRef, OutputRef, ActionCall, AnyRef } from "../types";

describe("Episode Hooks Integration Tests", () => {
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

  describe("Default Episode Behavior", () => {
    it("should automatically create episodes with default hooks", async () => {
      const chatContext = context({
        type: "default_chat",
        // No episodeHooks = use defaults
      });

      const contextState = await agent.getContext({
        context: chatContext,
        args: { userId: "test-user" },
      });

      const workingMemory = createWorkingMemory();

      // Simulate a conversation
      const inputRef: InputRef = {
        id: "input-1",
        ref: "input",
        type: "user_message",
        content: "Hello, how are you?",
        data: { message: "Hello, how are you?" },
        timestamp: Date.now(),
        processed: false,
      };

      const outputRef: OutputRef = {
        id: "output-1", 
        ref: "output",
        type: "assistant_message",
        content: "I'm doing well, thank you!",
        data: { message: "I'm doing well, thank you!" },
        timestamp: Date.now() + 1000,
        processed: true,
      };

      // Process the input
      await pushToWorkingMemoryWithManagement(workingMemory, inputRef, contextState, agent);
      
      // Process the output (should trigger episode creation with defaults)
      await pushToWorkingMemoryWithManagement(workingMemory, outputRef, contextState, agent);

      // Verify the working memory contains the refs
      expect(workingMemory.inputs).toHaveLength(1);
      expect(workingMemory.outputs).toHaveLength(1);
      expect(workingMemory.inputs[0].content).toBe("Hello, how are you?");
      expect(workingMemory.outputs[0].content).toBe("I'm doing well, thank you!");
    });
  });

  describe("Custom Chat Episode Hooks", () => {
    it("should use custom hooks to create structured episodes", async () => {
      let episodeCreated: any = null;
      let episodeMetadata: any = null;

      const customHooks: EpisodeHooks = {
        shouldStartEpisode: (ref) => {
          return ref.ref === "input" && ref.type === "user_message";
        },

        shouldEndEpisode: (ref) => {
          return ref.ref === "output" && ref.type === "assistant_message" && ref.processed;
        },

        createEpisode: (logs, ctx) => {
          const input = logs.find(l => l.ref === "input");
          const output = logs.find(l => l.ref === "output");
          
          episodeCreated = {
            type: "conversation_turn",
            conversation: {
              user: input?.content,
              assistant: output?.content,
              timestamp: input?.timestamp,
            },
            context: ctx.id,
          };
          
          return episodeCreated;
        },

        extractMetadata: (episodeData, logs, ctx) => {
          episodeMetadata = {
            userId: ctx.args?.userId,
            messageLength: episodeData.conversation?.user?.length || 0,
            responseLength: episodeData.conversation?.assistant?.length || 0,
          };
          return episodeMetadata;
        },
      };

      const chatContext = context({
        type: "custom_chat",
        episodeHooks: customHooks,
      });

      const contextState = await agent.getContext({
        context: chatContext,
        args: { userId: "test-user" },
      });

      const workingMemory = createWorkingMemory();

      // Simulate conversation
      const inputRef: InputRef = {
        id: "input-1",
        ref: "input", 
        type: "user_message",
        content: "What's the weather like?",
        data: { message: "What's the weather like?" },
        timestamp: Date.now(),
        processed: false,
      };

      const outputRef: OutputRef = {
        id: "output-1",
        ref: "output",
        type: "assistant_message", 
        content: "I don't have access to current weather data.",
        data: { message: "I don't have access to current weather data." },
        timestamp: Date.now() + 2000,
        processed: true,
      };

      // Process the conversation
      await pushToWorkingMemoryWithManagement(workingMemory, inputRef, contextState, agent);
      await pushToWorkingMemoryWithManagement(workingMemory, outputRef, contextState, agent);

      // Verify custom episode was created with expected structure
      expect(episodeCreated).toBeDefined();
      expect(episodeCreated.type).toBe("conversation_turn");
      expect(episodeCreated.conversation.user).toBe("What's the weather like?");
      expect(episodeCreated.conversation.assistant).toBe("I don't have access to current weather data.");
      
      expect(episodeMetadata).toBeDefined();
      expect(episodeMetadata.userId).toBe("test-user");
      expect(episodeMetadata.messageLength).toBe("What's the weather like?".length);
    });
  });

  describe("Task Episode Hooks", () => {
    it("should handle complex task episodes with actions", async () => {
      let taskEpisode: any = null;

      const taskHooks: EpisodeHooks = {
        shouldStartEpisode: (ref) => {
          return ref.ref === "input" && ref.data?.type === "task";
        },

        shouldEndEpisode: (ref, memory) => {
          if (ref.ref !== "output" || !ref.processed) return false;
          
          // End when all actions are resolved
          const pendingActions = memory.calls.filter(call =>
            !memory.results.some(result => result.callId === call.id)
          );
          
          return pendingActions.length === 0;
        },

        createEpisode: (logs, ctx) => {
          const task = logs.find(l => l.ref === "input");
          const actions = logs.filter(l => l.ref === "action_call");
          const results = logs.filter(l => l.ref === "action_result");
          const output = logs.find(l => l.ref === "output");

          taskEpisode = {
            type: "task_execution",
            task: task?.data?.description,
            actions: actions.map(a => a.name),
            actionCount: actions.length,
            completed: output?.data?.success === true,
            duration: (output?.timestamp || 0) - (task?.timestamp || 0),
          };

          return taskEpisode;
        },
      };

      const taskContext = context({
        type: "task_agent",
        episodeHooks: taskHooks,
      });

      const contextState = await agent.getContext({
        context: taskContext,
        args: { agentId: "task-1" },
      });

      const workingMemory = createWorkingMemory();

      // Simulate task execution
      const taskInput: InputRef = {
        id: "task-1",
        ref: "input",
        type: "task",
        content: "Search for information about AI",
        data: { type: "task", description: "Search for information about AI" },
        timestamp: Date.now(),
        processed: false,
      };

      const searchAction: ActionCall = {
        id: "action-1",
        ref: "action_call",
        name: "search",
        content: '{"query": "AI information"}',
        data: { query: "AI information" },
        timestamp: Date.now() + 500,
        processed: false,
      };

      const actionResult: AnyRef = {
        id: "result-1",
        ref: "action_result",
        callId: "action-1",
        name: "search",
        data: { results: ["AI is artificial intelligence"] },
        timestamp: Date.now() + 1000,
        processed: true,
      };

      const taskOutput: OutputRef = {
        id: "output-1",
        ref: "output",
        type: "task_result",
        content: "I found information about AI",
        data: { success: true, result: "AI information found" },
        timestamp: Date.now() + 1500,
        processed: true,
      };

      // Process the task workflow
      await pushToWorkingMemoryWithManagement(workingMemory, taskInput, contextState, agent);
      await pushToWorkingMemoryWithManagement(workingMemory, searchAction, contextState, agent);
      await pushToWorkingMemoryWithManagement(workingMemory, actionResult, contextState, agent);
      await pushToWorkingMemoryWithManagement(workingMemory, taskOutput, contextState, agent);

      // Verify task episode structure
      expect(taskEpisode).toBeDefined();
      expect(taskEpisode.type).toBe("task_execution");
      expect(taskEpisode.task).toBe("Search for information about AI");
      expect(taskEpisode.actions).toContain("search");
      expect(taskEpisode.actionCount).toBe(1);
      expect(taskEpisode.completed).toBe(true);
      expect(taskEpisode.duration).toBeGreaterThan(0);
    });
  });

  describe("Game Episode Hooks", () => {
    it("should handle game session episodes", async () => {
      let gameEpisode: any = null;

      const gameHooks: EpisodeHooks = {
        shouldStartEpisode: (ref) => {
          return ref.ref === "input" && ref.data?.action === "start_game";
        },

        shouldEndEpisode: (ref) => {
          return ref.ref === "output" && ref.processed && ref.data?.gameOver === true;
        },

        createEpisode: (logs, ctx) => {
          const gameStart = logs.find(l => l.ref === "input");
          const moves = logs.filter(l => l.ref === "action_call");
          const gameEnd = logs.find(l => l.ref === "output");

          gameEpisode = {
            type: "game_session",
            gameId: gameStart?.data?.gameId,
            moves: moves.map(m => m.name),
            outcome: gameEnd?.data?.result,
            score: gameEnd?.data?.score,
            moveCount: moves.length,
          };

          return gameEpisode;
        },

        classifyEpisode: (episodeData) => {
          return episodeData.outcome === "win" ? "victory" : "defeat";
        },
      };

      const gameContext = context({
        type: "game_agent", 
        episodeHooks: gameHooks,
      });

      const contextState = await agent.getContext({
        context: gameContext,
        args: { gameId: "chess-1" },
      });

      const workingMemory = createWorkingMemory();

      // Simulate game session
      const gameStart: InputRef = {
        id: "game-start",
        ref: "input",
        type: "game_command",
        content: "Start chess game",
        data: { action: "start_game", gameId: "chess-1" },
        timestamp: Date.now(),
        processed: false,
      };

      const move1: ActionCall = {
        id: "move-1",
        ref: "action_call",
        name: "make_move",
        content: '{"move": "e4"}',
        data: { move: "e4" },
        timestamp: Date.now() + 1000,
        processed: false,
      };

      const move2: ActionCall = {
        id: "move-2", 
        ref: "action_call",
        name: "make_move",
        content: '{"move": "Nf3"}',
        data: { move: "Nf3" },
        timestamp: Date.now() + 2000,
        processed: false,
      };

      const gameEnd: OutputRef = {
        id: "game-end",
        ref: "output",
        type: "game_result",
        content: "Game over - You won!",
        data: { gameOver: true, result: "win", score: 1200 },
        timestamp: Date.now() + 3000,
        processed: true,
      };

      // Process the game session
      await pushToWorkingMemoryWithManagement(workingMemory, gameStart, contextState, agent);
      await pushToWorkingMemoryWithManagement(workingMemory, move1, contextState, agent);
      await pushToWorkingMemoryWithManagement(workingMemory, move2, contextState, agent);
      await pushToWorkingMemoryWithManagement(workingMemory, gameEnd, contextState, agent);

      // Verify game episode structure
      expect(gameEpisode).toBeDefined();
      expect(gameEpisode.type).toBe("game_session");
      expect(gameEpisode.gameId).toBe("chess-1");
      expect(gameEpisode.moves).toEqual(["make_move", "make_move"]);
      expect(gameEpisode.outcome).toBe("win");
      expect(gameEpisode.score).toBe(1200);
      expect(gameEpisode.moveCount).toBe(2);
    });
  });
});