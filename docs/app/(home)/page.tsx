"use client";
import Link from "next/link";
import { useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Brain, Database, Box, Zap } from "lucide-react";

import ParticleBackground from "../components/ParticleBackground";
import TwitterProof from "../components/TwitterProof";

// Utility function for combining classnames
function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// Add a standardized button styling function
const buttonStyles = {
  primary: "bg-primary hover:bg-primary/90 text-primary-foreground",
  secondary: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
  outline:
    "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
  ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground",
};

export default function Home() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText("npm install @daydreamsai/core");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gridColor =
    "color-mix(in oklab, var(--color-purple-600) 10%, transparent)";

  return (
    <>
      <ParticleBackground />
      <main className="container relative max-w-[1100px] px-2 py-4 z-[5] lg:py-8">
        <div
          style={{
            background:
              "repeating-linear-gradient(to bottom, transparent, rgba(255,255,255,0.03) 500px, transparent 1000px)",
          }}
        >
          {/* Content sections will go here */}
          <Hero />
          {/* <Feedback /> */}
          {/* <Installation /> */}
          <AgentShowcase />
          <WhatYouCanBuild />
          <Providers />
          {/* <TwitterProof /> */}
          {/* <Highlights /> */}
          <CallToAction />
        </div>
      </main>
    </>
  );
}

// Placeholder components to be filled in later
function Hero() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText("npm install @daydreamsai/core");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative z-[2] flex flex-col px-6 pt-12 max-md:text-center md:px-12 md:pt-16 max-lg:overflow-hidden">
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
        TypeScript framework for building <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
          stateful AI agents
        </span>
      </h1>

      <p className="text-xl md:text-2xl text-center mb-4 text-muted-foreground">
        Beyond chatbots. Build agents that remember, act, and integrate with
        your systems.
      </p>

      <p className="text-lg text-center mb-12 text-muted-foreground max-w-3xl mx-auto">
        Create intelligent agents with persistent memory, type-safe actions, and
        seamless integration across platforms like Discord, Twitter, and CLI.
      </p>

      <div className="max-w-2xl mx-auto w-full mb-12">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <button
              onClick={handleCopy}
              className="text-xs  transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="flex items-center justify-center bg-muted rounded-lg p-6">
            <code className="text-base text-foreground font-mono tracking-tight">
              npm install @daydreamsai/core
            </code>
          </div>
        </div>
      </div>

      {/* Core concepts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="text-center p-4">
          <div className="text-2xl mb-2">🧠</div>
          <h3 className="font-semibold mb-2">Stateful Contexts</h3>
          <p className="text-sm text-muted-foreground">
            Isolated workspaces like React components - each conversation gets
            its own memory
          </p>
        </div>
        <div className="text-center p-4">
          <div className="text-2xl mb-2">⚡</div>
          <h3 className="font-semibold mb-2">Type-Safe Actions</h3>
          <p className="text-sm text-muted-foreground">
            Define what your agent can do with full TypeScript support and
            runtime validation
          </p>
        </div>
        <div className="text-center p-4">
          <div className="text-2xl mb-2">🔄</div>
          <h3 className="font-semibold mb-2">Persistent Memory</h3>
          <p className="text-sm text-muted-foreground">
            Two-tier memory system - working memory for execution, persistent
            between sessions
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-12">
        <Link
          href="/docs/core"
          className={cn(
            buttonStyles.primary,
            "px-6 py-3 text-base font-semibold shadow-sm transition-colors rounded-md"
          )}
        >
          Get Started
        </Link>
        <Link
          href="/docs/tutorials"
          className={cn(
            buttonStyles.secondary,
            "px-6 py-3 text-base font-semibold transition-colors rounded-md"
          )}
        >
          View Examples
        </Link>
      </div>
    </div>
  );
}

function AgentShowcase() {
  return (
    <div className="py-12 relative overflow-hidden">
      <h2 className="text-center text-2xl font-semibold mb-2 text-foreground">
        _{">"} Simple Agent Setup
      </h2>
      <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
        Get started with a few lines of TypeScript
      </p>

      <div className="max-w-4xl mx-auto px-6">
        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-muted-foreground text-sm">agent.ts</span>
          </div>
          <pre className="p-6 overflow-auto bg-background">
            <code className="text-sm font-mono">
              <span className="text-purple-400">import</span>{" "}
              <span className="text-blue-300">
                {"{ createDreams, context, action }"}
              </span>{" "}
              <span className="text-purple-400">from</span>{" "}
              <span className="text-green-400">"@daydreamsai/core"</span>;
              <br />
              <span className="text-purple-400">import</span>{" "}
              <span className="text-blue-300">{"{ openai }"}</span>{" "}
              <span className="text-purple-400">from</span>{" "}
              <span className="text-green-400">"@ai-sdk/openai"</span>;
              <br />
              <span className="text-purple-400">import</span>{" "}
              <span className="text-blue-300">{"{ discordExtension }"}</span>{" "}
              <span className="text-purple-400">from</span>{" "}
              <span className="text-green-400">"@daydreamsai/discord"</span>;
              <br />
              <br />
              <span className="text-gray-500">
                // Define a context for chat sessions
              </span>
              <br />
              <span className="text-purple-400">const</span>{" "}
              <span className="text-blue-300">chatContext</span> ={" "}
              <span className="text-yellow-300">context</span>({"{"}
              <br />
              {"  "}
              <span className="text-blue-300">type</span>:{" "}
              <span className="text-green-400">"chat"</span>,
              <br />
              {"  "}
              <span className="text-blue-300">create</span>:{" "}
              <span className="text-yellow-300">() ({"{ messages: [] }"})</span>
              <br />
              {"}"});
              <br />
              <br />
              <span className="text-gray-500">// Define an action</span>
              <br />
              <span className="text-purple-400">const</span>{" "}
              <span className="text-blue-300">getWeather</span> ={" "}
              <span className="text-yellow-300">action</span>({"{"}
              <br />
              {"  "}
              <span className="text-blue-300">name</span>:{" "}
              <span className="text-green-400">"get-weather"</span>,
              <br />
              {"  "}
              <span className="text-blue-300">handler</span>:{" "}
              <span className="text-purple-400">async</span>{" "}
              <span className="text-yellow-300">({"{ city }"})</span> {"=> {"}
              <br />
              {"    "}
              <span className="text-purple-400">return</span>{" "}
              <span className="text-green-400">"72°F and sunny"</span>;
              <br />
              {"  "}
              <span>{"}"}</span>
              <br />
              {"}"});
              <br />
              <br />
              <span className="text-gray-500">// Create your agent</span>
              <br />
              <span className="text-purple-400">const</span>{" "}
              <span className="text-blue-300">agent</span> ={" "}
              <span className="text-yellow-300">createDreams</span>({"{"}
              <br />
              {"  "}
              <span className="text-blue-300">model</span>:{" "}
              <span className="text-yellow-300">openai</span>(
              <span className="text-green-400">"gpt-4o"</span>),
              <br />
              {"  "}
              <span className="text-blue-300">contexts</span>:{" "}
              <span className="text-blue-300">[chatContext]</span>,
              <br />
              {"  "}
              <span className="text-blue-300">actions</span>:{" "}
              <span className="text-blue-300">[getWeather]</span>,
              <br />
              {"  "}
              <span className="text-blue-300">extensions</span>:{" "}
              <span className="text-blue-300">[discordExtension]</span>
              <br />
              {"}"});
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

function WhatYouCanBuild() {
  const examples = [
    {
      icon: "💬",
      title: "Discord Bots",
      description:
        "Build bots that remember conversations and maintain context across messages",
    },
    {
      icon: "📈",
      title: "Trading Agents",
      description:
        "Create agents that track portfolios and execute trades based on market conditions",
    },
    {
      icon: "🎫",
      title: "Customer Support",
      description:
        "Deploy agents with knowledge base integration for automated support",
    },
    {
      icon: "🌐",
      title: "Multi-Platform Agents",
      description:
        "Build agents that work across Twitter, Telegram, CLI, and web interfaces",
    },
  ];

  return (
    <div className="py-16 relative overflow-hidden">
      <h2 className="text-center text-2xl font-semibold mb-2 text-foreground">
        _{">"} What You Can Build
      </h2>
      <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
        Real examples developers are building with Daydreams
      </p>

      <div className="max-w-4xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {examples.map((example, index) => (
            <div
              key={index}
              className="p-6 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">{example.icon}</div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {example.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {example.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/docs/tutorials"
            className={cn(
              buttonStyles.ghost,
              "inline-flex items-center px-4 py-2 text-sm rounded-md"
            )}
          >
            <span>View Tutorials</span>
            <svg
              className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Providers() {
  const providers = [
    { name: "OpenAI", logo: "/providers/openai.svg" },
    { name: "Anthropic", logo: "/providers/anthropic.svg" },
    { name: "Groq", logo: "/providers/groq.svg" },
    { name: "Google", logo: "/providers/google.svg" },
    { name: "Mistral", logo: "/providers/mistral.svg" },
    { name: "DeepSeek", logo: "/providers/deepseek.svg" },
  ];

  return (
    <div className="py-12 px-8 relative overflow-hidden">
      <h2 className="text-center text-xl font-medium mb-2 text-foreground">
        Works with your favorite AI providers
      </h2>

      <div className="max-w-3xl mx-auto mt-8">
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
          {providers.map((provider) => (
            <div
              key={provider.name}
              className="flex items-center justify-center"
            >
              <img
                src={provider.logo}
                alt={`${provider.name} logo`}
                className="w-8 h-8 object-contain grayscale hover:grayscale-0 transition-all"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CallToAction() {
  return (
    <div className="py-16 text-center">
      <h2 className="text-3xl font-medium text-foreground mb-2 tracking-tight">
        _{">"} Start dreaming...
      </h2>
      <p className="text-center text-muted-foreground mb-6 max-w-2xl mx-auto">
        Build the future of autonomous agents
      </p>

      <div className="flex justify-center gap-6">
        <Link
          href="https://discord.gg/rt8ajxQvXh"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonStyles.primary,
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors rounded-md"
          )}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          Join Discord
        </Link>
        <Link
          href="/docs/core"
          className={cn(
            buttonStyles.secondary,
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors rounded-md"
          )}
        >
          Start Building
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
