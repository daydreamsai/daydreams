/**
 * Game Training with GRPO Example
 *
 * An agent plays a number guessing game and generates training data:
 * - GRPO: Preference data comparing different strategies
 * - Episodes: Complete game sequences
 * - Action-sequences: Move sequences and outcomes
 * - Reasoning-chains: Strategic thinking processes
 *
 * This demonstrates how game-playing agents can generate their own training data.
 */

import { createDreams, context, action } from "@daydreamsai/core";
import { createSyntheticData } from "@daydreamsai/synthetic";
import { cliExtension } from "@daydreamsai/cli";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Game state interface
interface GameState {
  targetNumber: number;
  guessCount: number;
  minRange: number;
  maxRange: number;
  guessHistory: Array<{
    guess: number;
    feedback: "too_high" | "too_low" | "correct";
    strategy: string;
    reasoning: string;
  }>;
  gameOver: boolean;
  won: boolean;
  score: number; // Lower is better (fewer guesses)
}

// Game playing context
const gameContext = context({
  type: "number_game",
  schema: z.object({ gameId: z.string() }),
  key: ({ gameId }) => gameId,
  create: (): GameState => {
    const target = Math.floor(Math.random() * 100) + 1;
    return {
      targetNumber: target,
      guessCount: 0,
      minRange: 1,
      maxRange: 100,
      guessHistory: [],
      gameOver: false,
      won: false,
      score: 0,
    };
  },
  render: (state) => {
    const game = state.memory as GameState;
    return `
🎯 Number Guessing Game (1-100)
Game ID: ${state.args.gameId}
Guesses: ${game.guessCount}
Range: ${game.minRange} - ${game.maxRange}
Status: ${game.gameOver ? (game.won ? "🎉 WON!" : "💀 Lost") : "🎮 Playing"}
Score: ${game.score} (lower is better)

Recent guesses:
${game.guessHistory
  .slice(-3)
  .map((h) => `  ${h.guess} → ${h.feedback} (${h.strategy})`)
  .join("\n")}

Available strategies:
- Binary search (optimal for unknown ranges)
- Random guess (exploration)
- Pattern-based (learning from history)
- Intuitive guess (human-like)
    `;
  },
});

// Strategy 1: Binary Search (optimal strategy)
const binarySearchGuess = action({
  name: "binarySearchGuess",
  description:
    "Make a guess using binary search strategy (divide range in half)",
  schema: z.object({
    reasoning: z.string().describe("Explain the binary search reasoning"),
  }),
  handler: (data, ctx) => {
    const game = ctx.memory as GameState;

    if (game.gameOver) {
      return { error: "Game is already over", success: false };
    }

    // Binary search: pick middle of current range
    const guess = Math.floor((game.minRange + game.maxRange) / 2);

    console.log(
      `🔍 Binary Search: ${guess} (range: ${game.minRange}-${game.maxRange})`
    );
    console.log(`💭 Reasoning: ${data.reasoning}`);

    // Simulate game feedback
    let feedback: "too_high" | "too_low" | "correct";
    if (guess === game.targetNumber) {
      feedback = "correct";
      game.won = true;
      game.gameOver = true;
    } else if (guess > game.targetNumber) {
      feedback = "too_high";
      game.maxRange = guess - 1;
    } else {
      feedback = "too_low";
      game.minRange = guess + 1;
    }

    game.guessCount++;
    game.score = game.guessCount;
    game.guessHistory.push({
      guess,
      feedback,
      strategy: "binary_search",
      reasoning: data.reasoning,
    });

    return {
      guess,
      feedback,
      strategy: "binary_search",
      guessCount: game.guessCount,
      gameOver: game.gameOver,
      won: game.won,
      newRange: `${game.minRange}-${game.maxRange}`,
      success: true,
    };
  },
});

// Strategy 2: Random Guess (exploration strategy)
const randomGuess = action({
  name: "randomGuess",
  description: "Make a random guess within the current range",
  schema: z.object({
    reasoning: z
      .string()
      .describe("Explain why random exploration might be valuable"),
  }),
  handler: (data, ctx) => {
    const game = ctx.memory as GameState;

    if (game.gameOver) {
      return { error: "Game is already over", success: false };
    }

    // Random guess within current range
    const guess =
      Math.floor(Math.random() * (game.maxRange - game.minRange + 1)) +
      game.minRange;

    console.log(
      `🎲 Random Guess: ${guess} (range: ${game.minRange}-${game.maxRange})`
    );
    console.log(`💭 Reasoning: ${data.reasoning}`);

    // Simulate game feedback
    let feedback: "too_high" | "too_low" | "correct";
    if (guess === game.targetNumber) {
      feedback = "correct";
      game.won = true;
      game.gameOver = true;
    } else if (guess > game.targetNumber) {
      feedback = "too_high";
      game.maxRange = guess - 1;
    } else {
      feedback = "too_low";
      game.minRange = guess + 1;
    }

    game.guessCount++;
    game.score = game.guessCount;
    game.guessHistory.push({
      guess,
      feedback,
      strategy: "random",
      reasoning: data.reasoning,
    });

    return {
      guess,
      feedback,
      strategy: "random",
      guessCount: game.guessCount,
      gameOver: game.gameOver,
      won: game.won,
      newRange: `${game.minRange}-${game.maxRange}`,
      success: true,
    };
  },
});

// Strategy 3: Pattern-based guess (learning from history)
const patternGuess = action({
  name: "patternGuess",
  description: "Make a guess based on patterns from previous guesses",
  schema: z.object({
    reasoning: z
      .string()
      .describe("Explain the pattern you noticed and how it guides this guess"),
  }),
  handler: (data, ctx) => {
    const game = ctx.memory as GameState;

    if (game.gameOver) {
      return { error: "Game is already over", success: false };
    }

    // Pattern-based logic: look at guess history trends
    let guess: number;

    if (game.guessHistory.length === 0) {
      // First guess: try a common starting pattern
      guess = 50;
    } else {
      // Analyze recent guesses to find patterns
      const recent = game.guessHistory.slice(-2);
      const avgGuess =
        recent.reduce((sum, h) => sum + h.guess, 0) / recent.length;

      // Adjust based on feedback patterns
      if (recent.every((h) => h.feedback === "too_high")) {
        guess = Math.max(game.minRange, Math.floor(avgGuess * 0.7));
      } else if (recent.every((h) => h.feedback === "too_low")) {
        guess = Math.min(game.maxRange, Math.floor(avgGuess * 1.3));
      } else {
        // Mixed feedback, try a weighted average approach
        guess = Math.floor((game.minRange + game.maxRange) / 2.2);
      }
    }

    // Ensure guess is within valid range
    guess = Math.max(game.minRange, Math.min(game.maxRange, guess));

    console.log(
      `📈 Pattern Guess: ${guess} (range: ${game.minRange}-${game.maxRange})`
    );
    console.log(`💭 Reasoning: ${data.reasoning}`);

    // Simulate game feedback
    let feedback: "too_high" | "too_low" | "correct";
    if (guess === game.targetNumber) {
      feedback = "correct";
      game.won = true;
      game.gameOver = true;
    } else if (guess > game.targetNumber) {
      feedback = "too_high";
      game.maxRange = guess - 1;
    } else {
      feedback = "too_low";
      game.minRange = guess + 1;
    }

    game.guessCount++;
    game.score = game.guessCount;
    game.guessHistory.push({
      guess,
      feedback,
      strategy: "pattern_based",
      reasoning: data.reasoning,
    });

    return {
      guess,
      feedback,
      strategy: "pattern_based",
      guessCount: game.guessCount,
      gameOver: game.gameOver,
      won: game.won,
      newRange: `${game.minRange}-${game.maxRange}`,
      success: true,
    };
  },
});

// Strategy comparison for GRPO data
const compareStrategies = action({
  name: "compareStrategies",
  description:
    "Generate multiple strategy options for the current game state and rank them",
  schema: z.object({
    situation: z.string().describe("Describe the current game situation"),
  }),
  handler: async (data, ctx) => {
    console.log(`🏆 Comparing strategies for: ${data.situation}`);

    // Try to get game state, but provide defaults if not available
    const game = ctx.memory as GameState;
    const hasActiveGame = game && typeof game.targetNumber === "number";

    // Use active game state or provide reasonable defaults for comparison
    const gameState = hasActiveGame
      ? game
      : {
          minRange: 1,
          maxRange: 100,
          guessHistory: [],
          guessCount: 0,
          gameOver: false,
        };

    console.log(
      hasActiveGame
        ? `📊 Active game: Range ${gameState.minRange}-${gameState.maxRange}, ${gameState.guessCount} guesses made`
        : `📊 General strategy comparison (no active game)`
    );

    // Generate multiple strategy options with scores
    const strategies = [
      {
        name: "binary_search",
        description: "Divide the range in half systematically",
        expectedGuesses: Math.ceil(
          Math.log2(gameState.maxRange - gameState.minRange + 1)
        ),
        confidence: 0.95,
        reasoning:
          "Mathematically optimal, guarantees finding answer in log(n) steps",
      },
      {
        name: "random_exploration",
        description: "Random guess within current range",
        expectedGuesses: (gameState.maxRange - gameState.minRange + 1) / 2,
        confidence: 0.3,
        reasoning:
          "Could get lucky and find answer quickly, but no systematic approach",
      },
      {
        name: "pattern_based",
        description: "Use patterns from previous guesses",
        expectedGuesses:
          gameState.guessHistory.length > 2
            ? Math.max(
                2,
                Math.ceil(
                  Math.log2(gameState.maxRange - gameState.minRange + 1)
                ) + 1
              )
            : Math.ceil(
                Math.log2(gameState.maxRange - gameState.minRange + 1)
              ) + 2,
        confidence: gameState.guessHistory.length > 2 ? 0.7 : 0.4,
        reasoning:
          gameState.guessHistory.length > 2
            ? "Learning from history, might adapt to target patterns"
            : "Not enough history to establish reliable patterns",
      },
      {
        name: "intuitive_guess",
        description:
          "Human-like intuitive guess (favor round numbers, common choices)",
        expectedGuesses: Math.max(
          3,
          (gameState.maxRange - gameState.minRange + 1) / 3
        ),
        confidence: 0.5,
        reasoning:
          "Mimics human psychology, might work against human-chosen numbers",
      },
    ];

    // Rank strategies by expected performance (lower expected guesses = better)
    const rankedStrategies = strategies
      .map((s, index) => ({
        ...s,
        rank: index + 1,
        score: 1.0 / s.expectedGuesses, // Higher score for fewer expected guesses
        success: true,
      }))
      .sort((a, b) => b.score - a.score)
      .map((s, index) => ({ ...s, rank: index + 1 }));

    // Generate preference comparisons for GRPO
    const comparisons = [];
    for (let i = 0; i < rankedStrategies.length - 1; i++) {
      for (let j = i + 1; j < rankedStrategies.length; j++) {
        comparisons.push({
          preferred: i,
          rejected: j,
          confidence: Math.min(
            0.9,
            rankedStrategies[i].confidence -
              rankedStrategies[j].confidence +
              0.5
          ),
        });
      }
    }

    console.log(
      `🥇 Best strategy: ${rankedStrategies[0].name} (${rankedStrategies[0].expectedGuesses} expected guesses)`
    );
    console.log(
      `🥈 Runner-up: ${rankedStrategies[1].name} (${rankedStrategies[1].expectedGuesses} expected guesses)`
    );

    return {
      situation: data.situation,
      strategies: rankedStrategies,
      bestStrategy: rankedStrategies[0].name,
      comparisons,
      gameState: {
        range: `${gameState.minRange}-${gameState.maxRange}`,
        guessCount: gameState.guessCount,
        historyLength: gameState.guessHistory.length,
        hasActiveGame,
      },
      success: true,
    };
  },
});

// Simplified auto-play action for demonstration
const autoPlay = action({
  name: "autoPlay",
  description: "Demonstrate auto-play concept (simplified for stability)",
  schema: z.object({
    demo: z.boolean().default(true).describe("Run a demo simulation"),
  }),
  handler: async (data, ctx) => {
    console.log("🤖 Auto-play Demo");
    console.log("");
    console.log("In a full implementation, this would:");
    console.log("• Create multiple game contexts");
    console.log("• Execute different strategies automatically");
    console.log("• Generate large amounts of GRPO training data");
    console.log("• Compare strategy effectiveness across many games");
    console.log("");
    console.log("For now, try manual gameplay to generate training data:");
    console.log("1. 'Start a new game'");
    console.log(
      "2. Use different strategies: binary search, random, pattern-based"
    );
    console.log("3. 'Compare all strategies' to generate GRPO data");
    console.log("4. '!synthetic.process' to create training files");
    console.log("");

    // Simulate some demo results
    const demoResults = [
      { strategy: "binary_search", avgGuesses: 6.2, winRate: 1.0 },
      { strategy: "random", avgGuesses: 12.8, winRate: 0.95 },
      { strategy: "pattern_based", avgGuesses: 8.1, winRate: 0.92 },
    ];

    console.log("📊 Simulated performance comparison:");
    demoResults.forEach((result) => {
      console.log(
        `  ${result.strategy}: ${result.avgGuesses} avg guesses, ${
          result.winRate * 100
        }% win rate`
      );
    });

    return {
      message:
        "Auto-play demo completed. Use manual commands to generate real training data.",
      demoResults,
      success: true,
    };
  },
});

// Agent with ALL synthetic data formats enabled
const agent = createDreams({
  model: openrouter("google/gemini-2.5-flash-preview-05-20"),
  contexts: [gameContext],
  extensions: [
    createSyntheticData({
      enabled: true,
      outputDir: "./game-training-data",
      // Enable ALL formats with focus on GRPO
      formats: [
        "grpo", // Primary focus: preference learning
        "episodes", // Complete game sequences
        "action-sequences", // Move sequences
        "reasoning-chains", // Strategic thinking
        "instruction-tuning", // Strategy explanations
      ],
      capture: {
        conversations: true,
        reasoning: true,
        actions: true,
        episodes: true,
        preferences: true, // Essential for GRPO
      },
      mode: "realtime",
      batchSize: 1,
      filters: {
        minConversationLength: 1,
        successfulOnly: false,
      },
    }),
    cliExtension,
  ],
  actions: [
    binarySearchGuess,
    randomGuess,
    patternGuess,
    compareStrategies,
    autoPlay,
  ],
});

console.log("🎯 Game Training with GRPO Example");
console.log("");
console.log(
  "This agent plays a number guessing game and generates training data:"
);
console.log("🏆 GRPO data - Comparing strategy effectiveness");
console.log("🎬 Episodes - Complete game sequences");
console.log("⚡ Actions - Individual moves and outcomes");
console.log("🧠 Reasoning - Strategic thinking processes");
console.log("");
console.log("🎮 Commands to try:");
console.log("• 'Start a new game' - Begin manual gameplay");
console.log("• 'Use binary search strategy' - Optimal mathematical approach");
console.log("• 'Make a random guess' - Exploration strategy");
console.log("• 'Use pattern-based guess' - Learning from history");
console.log("• 'Compare all strategies' - Generate GRPO preference data");
console.log("• 'Run auto-play demo' - See how auto-play would work");
console.log("");
console.log("🔧 Synthetic data commands:");
console.log("  !synthetic.status    - Check data capture");
console.log("  !synthetic.process   - Generate training files");
console.log("  !synthetic.analyze   - Analyze strategy performance");
console.log("");
console.log("📈 Training use cases:");
console.log("• Train agents to choose optimal strategies");
console.log("• Learn game-playing patterns");
console.log("• Improve decision-making under uncertainty");
console.log("• Generate preference data for RLHF");
console.log("");

// Start the agent
agent.start({ gameId: "training_session" });
