"use client";
import Link from "next/link";
import { useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Brain, Database, Box, Zap, RotateCw } from "lucide-react";

import ParticleBackground from "../components/ParticleBackground";
import TwitterProof from "../components/TwitterProof";

// Utility function for combining classnames
function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// Add a standardized button styling function
const buttonStyles = {
  primary:
    "bg-purple-600 hover:bg-purple-500 dark:bg-purple-700 dark:hover:bg-purple-600 text-white",
  secondary:
    "bg-white hover:bg-gray-100 text-purple-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-purple-300",
  outline:
    "border border-white/20 bg-transparent hover:bg-white/10 dark:border-white/10 dark:hover:bg-white/5 ",
  ghost:
    "bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 ",
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
          <SyntheticDataSection />
          <Applications />
          <Providers />
          <Chains />
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
    <div className="relative z-[2] flex flex-col border-x border-t  px-6 pt-12 max-md:text-center md:px-12 md:pt-16 max-lg:overflow-hidden ">
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
        Autonomous agents that <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          learn from their own reasoning
        </span>
      </h1>

      <p className="text-xl md:text-2xl text-center mb-4 text-gray-300">
        TypeScript framework for building AI agents that continuously improve
        through synthetic data generation
      </p>

      <p className="text-lg text-center mb-12 text-gray-400 max-w-3xl mx-auto">
        Create agents that capture their reasoning process and automatically
        generate training datasets— turning every interaction into learning data
        for the next generation of models
      </p>

      <div className="max-w-2xl mx-auto w-full mb-12">
        <div className="bg-black/5 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
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
          <div className="flex items-center justify-center bg-black/30 dark:bg-black/30 rounded-lg p-6">
            <code className="text-base /90 font-mono tracking-tight">
              npm install @daydreamsai/core
            </code>
          </div>
        </div>
      </div>

      {/* Key differentiators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-2xl mb-2">🧠</div>
          <h3 className="font-semibold mb-2">Reasoning Capture</h3>
          <p className="text-sm text-gray-400">
            Agents automatically capture their step-by-step reasoning process
          </p>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-2xl mb-2">🔄</div>
          <h3 className="font-semibold mb-2">Synthetic Training</h3>
          <p className="text-sm text-gray-400">
            Generate high-quality training datasets from agent interactions
          </p>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-2xl mb-2">📈</div>
          <h3 className="font-semibold mb-2">Continuous Learning</h3>
          <p className="text-sm text-gray-400">
            Create a symbiotic loop between reasoning and model improvement
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
          href="/docs/tutorials/examples"
          className={cn(
            buttonStyles.secondary,
            "px-6 py-3 text-base font-semibold transition-colors rounded-md"
          )}
        >
          View Examples
        </Link>
        <Link
          href="/llm.txt"
          className={cn(
            buttonStyles.outline,
            "px-4 py-3 text-sm font-semibold transition-colors rounded-md"
          )}
        >
          LLM.txt
        </Link>
      </div>
    </div>
  );
}

function AgentShowcase() {
  const [activeTab, setActiveTab] = useState("synthetic");

  const tabs = [
    {
      id: "synthetic",
      title: "Synthetic Data",
      icon: RotateCw,
      content:
        "Capture agent reasoning in real-time and generate high-quality training datasets automatically. Create a symbiotic relationship between agent performance and model improvement.",
    },
    {
      id: "ai-sdk",
      title: "AI SDK",
      icon: Brain,
      content:
        "Built on top of the Vercel AI SDK, Daydreams seamlessly integrates with different AI providers and models with full type safety and streaming support",
    },
    {
      id: "memory",
      title: "Memory",
      icon: Database,
      content:
        "Persistent memory storage with vector embeddings for long-term recall and contextual understanding across conversations and sessions",
    },
    {
      id: "contexts",
      title: "Contexts",
      icon: Box,
      content:
        "Maintain state and render structured data to your LLM with React-like components that update dynamically based on agent interactions",
    },
    {
      id: "actions",
      title: "Actions",
      icon: Zap,
      content:
        "Define capabilities for your agent with type-safe actions that can interact with external systems, APIs, and blockchain networks",
    },
  ];

  return (
    <div className="border-x border-t py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-purple-500/5" />

      <h2 className="text-center text-2xl font-semibold mb-2  relative z-10">
        <span className=" px-2 py-1">_{">"} Agent Architecture</span>
      </h2>
      <p className="text-center /70 mb-8 relative z-10 max-w-2xl mx-auto">
        Compose powerful agents with a modular, type-safe architecture that
        learns and improves
      </p>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="bg-black/5 border border-white/10 overflow-hidden rounded-lg">
          <div className="flex overflow-x-auto bg-white/5 backdrop-blur-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? " border-b-2 border-purple-500"
                    : "/60 hover:"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.title}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${
                  activeTab === tab.id ? "block" : "hidden"
                }`}
              >
                <div>
                  <h3 className="text-2xl font-semibold  mb-4 flex items-center gap-2">
                    <tab.icon className="w-6 h-6 text-purple-400" />
                    {tab.title}
                  </h3>
                  <p className="/80 text-lg leading-relaxed mb-6">
                    {tab.content}
                  </p>

                  <div className="mt-4">
                    <Link
                      href={(() => {
                        switch (tab.id) {
                          case "synthetic":
                            return "/docs/core/concepts/building-blocks"; // TODO: Create synthetic data docs
                          case "memory":
                            return "/docs/core/concepts/memory";
                          case "contexts":
                            return "/docs/core/concepts/contexts";
                          case "actions":
                            return "/docs/core/concepts/actions";
                          case "ai-sdk":
                          default:
                            return "/docs/core/providers/ai-sdk";
                        }
                      })()}
                      className={cn(
                        buttonStyles.ghost,
                        "inline-flex items-center px-4 py-2 text-sm rounded-md"
                      )}
                    >
                      <span>Learn more</span>
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

                <div className="md:col-span-2 bg-black/5 rounded-lg border border-white/10 p-5">
                  {activeTab === "synthetic" && (
                    <pre className="text-sm font-mono /90 overflow-auto">
                      <code>
                        <span className="text-purple-400">import</span> {"{"}{" "}
                        <span className="/90">createDreams</span> {"}"}{" "}
                        <span className="text-purple-400">from</span>{" "}
                        <span className="text-green-400">
                          "@daydreamsai/core"
                        </span>
                        ;
                        <br />
                        <span className="text-purple-400">import</span> {"{"}{" "}
                        <span className="/90">createSyntheticData</span> {"}"}{" "}
                        <span className="text-purple-400">from</span>{" "}
                        <span className="text-green-400">
                          "@daydreamsai/synthetic"
                        </span>
                        ;
                        <br />
                        <br />
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-blue-300">agent</span> ={" "}
                        <span className="text-yellow-300">createDreams</span>(
                        {"{"}
                        <br />
                        <span className="/90 pl-4">model:</span>{" "}
                        <span className="text-yellow-300">groq</span>(
                        <span className="text-green-400">
                          "deepseek-r1-distill-llama-70b"
                        </span>
                        ),
                        <br />
                        <span className="/90 pl-4">extensions:</span> [
                        <br />
                        <span className="pl-8">
                          <span className="text-yellow-300">
                            createSyntheticData
                          </span>
                          ({"{"}
                        </span>
                        <br />
                        <span className="/90 pl-12">enabled:</span>{" "}
                        <span className="text-orange-300">true</span>,
                        <br />
                        <span className="/90 pl-12">formats:</span> [
                        <span className="text-green-400">
                          "instruction-tuning"
                        </span>
                        , <span className="text-green-400">"grpo"</span>],
                        <br />
                        <span className="/90 pl-12">capture:</span> {"{"}
                        <br />
                        <span className="/90 pl-16">reasoning:</span>{" "}
                        <span className="text-orange-300">true</span>,
                        <br />
                        <span className="/90 pl-16">preferences:</span>{" "}
                        <span className="text-orange-300">true</span>
                        <br />
                        <span className="pl-12">{"}"}</span>
                        <br />
                        <span className="pl-8">{"}),"}</span>
                        <br />
                        <span className="pl-4">],</span>
                        <br />
                        {"}"});
                        <br />
                        <br />
                        <span className="text-gray-500 italic">
                          {/*// Agent automatically generates training data*/}
                        </span>
                        <br />
                        <span className="text-purple-400">await</span>{" "}
                        <span className="text-blue-300">agent</span>.
                        <span className="text-yellow-300">callAction</span>(
                        <span className="text-green-400">
                          "synthetic.process"
                        </span>
                        );
                      </code>
                    </pre>
                  )}
                  {activeTab === "ai-sdk" && (
                    <pre className="text-sm font-mono /90 overflow-auto">
                      <code>
                        <span className="text-purple-400">import</span> {"{"}{" "}
                        <span className="/90">createDreams</span> {"}"}{" "}
                        <span className="text-purple-400">from</span>{" "}
                        <span className="text-green-400">
                          "@daydreamsai/core"
                        </span>
                        ;
                        <br />
                        <span className="text-purple-400">import</span> {"{"}{" "}
                        <span className="/90">groq</span> {"}"}{" "}
                        <span className="text-purple-400">from</span>{" "}
                        <span className="text-green-400">"@ai-sdk/groq"</span>
                        ;
                        <br />
                        <span className="text-purple-400">import</span> {"{"}{" "}
                        <span className="/90">anthropic</span> {"}"}{" "}
                        <span className="text-purple-400">from</span>{" "}
                        <span className="text-green-400">
                          "@ai-sdk/anthropic"
                        </span>
                        ;
                        <br />
                        <br />
                        <span className="text-gray-500 italic">
                          {/*// Mix and match any AI SDK provider*/}
                        </span>
                        <br />
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-blue-300">agent</span> ={" "}
                        <span className="text-yellow-300">createDreams</span>(
                        {"{"}
                        <br />
                        <span className="/90 pl-4">model:</span>{" "}
                        <span className="text-yellow-300">groq</span>(
                        <span className="text-green-400">
                          "llama-3.3-70b-versatile"
                        </span>
                        ),
                        <br />
                        <span className="/90 pl-4">fallbackModel:</span>{" "}
                        <span className="text-yellow-300">anthropic</span>(
                        <span className="text-green-400">
                          "claude-3-5-haiku-20241022"
                        </span>
                        ),
                        <br />
                        <span className="/90 pl-4">embeddingModel:</span>{" "}
                        <span className="text-yellow-300">openai</span>(
                        <span className="text-green-400">
                          "text-embedding-3-small"
                        </span>
                        ),
                        <br />
                        {"}"});
                      </code>
                    </pre>
                  )}
                  {activeTab === "memory" && (
                    <pre className="text-sm font-mono /90 overflow-auto">
                      <code>
                        <span className="text-purple-400">import</span> {"{"}{" "}
                        <span className="/90">createDreams</span> {"}"}{" "}
                        <span className="text-purple-400">from</span>{" "}
                        <span className="text-green-400">
                          "@daydreamsai/core"
                        </span>
                        ;
                        <br />
                        <span className="text-purple-400">import</span> {"{"}{" "}
                        <span className="/90">mongo</span> {"}"}{" "}
                        <span className="text-purple-400">from</span>{" "}
                        <span className="text-green-400">
                          "@daydreamsai/mongo"
                        </span>
                        ;
                        <br />
                        <span className="text-purple-400">import</span> {"{"}{" "}
                        <span className="/90">chroma</span> {"}"}{" "}
                        <span className="text-purple-400">from</span>{" "}
                        <span className="text-green-400">
                          "@daydreamsai/chroma"
                        </span>
                        ;
                        <br />
                        <br />
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-blue-300">agent</span> ={" "}
                        <span className="text-yellow-300">createDreams</span>(
                        {"{"}
                        <br />
                        <span className="/90 pl-4">model:</span>{" "}
                        <span className="text-yellow-300">anthropic</span>(
                        <span className="text-green-400">
                          "claude-3-5-sonnet-20241022"
                        </span>
                        ),
                        <br />
                        <span className="/90 pl-4">memory:</span> {"{"}
                        <br />
                        <span className="/90 pl-8">store:</span>{" "}
                        <span className="text-blue-300">mongo</span>({"{"}
                        <br />
                        <span className="/90 pl-12">url:</span>{" "}
                        <span className="text-green-400">
                          process.env.MONGO_URL
                        </span>
                        <br />
                        <span className="pl-8">{"}"}) ,</span>
                        <br />
                        <span className="/90 pl-8">vector:</span>{" "}
                        <span className="text-blue-300">chroma</span>({"{"}
                        <br />
                        <span className="/90 pl-12">url:</span>{" "}
                        <span className="text-green-400">
                          process.env.CHROMA_URL
                        </span>
                        <br />
                        <span className="pl-8">{"}"}),</span>
                        <br />
                        <span className="pl-4">{"}"},</span>
                        <br />
                        {"}"});
                        <br />
                        <br />
                        <span className="text-gray-500 italic">
                          {/*// Memories persist across sessions*/}
                        </span>
                        <br />
                        <span className="text-purple-400">await</span>{" "}
                        <span className="text-blue-300">agent</span>.
                        <span className="text-yellow-300">remember</span>(
                        <span className="text-green-400">
                          "User prefers concise responses"
                        </span>
                        );
                      </code>
                    </pre>
                  )}
                  {activeTab === "contexts" && (
                    <pre className="text-sm font-mono /90 overflow-auto">
                      <code>
                        <span className="text-purple-400">import</span> {"{"}{" "}
                        <span className="/90">context</span> {"}"}{" "}
                        <span className="text-purple-400">from</span>{" "}
                        <span className="text-green-400">
                          "@daydreamsai/core"
                        </span>
                        ;
                        <br />
                        <span className="text-purple-400">import</span> {"{"}{" "}
                        <span className="/90">z</span> {"}"}{" "}
                        <span className="text-purple-400">from</span>{" "}
                        <span className="text-green-400">"zod"</span>;
                        <br />
                        <br />
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-blue-300">tradingContext</span> ={" "}
                        <span className="text-yellow-300">context</span>({"{"}
                        <br />
                        {"  "}
                        <span className="/90">type:</span>{" "}
                        <span className="text-green-400">"trading"</span>,
                        <br />
                        {"  "}
                        <span className="/90">schema:</span>{" "}
                        <span className="text-blue-300">z</span>.
                        <span className="text-yellow-300">object</span>({"{"}
                        <br />
                        {"    "}
                        <span className="/90">portfolio:</span>{" "}
                        <span className="text-blue-300">z</span>.
                        <span className="text-yellow-300">record</span>(
                        <span className="text-blue-300">z</span>.
                        <span className="text-yellow-300">number</span>()),
                        <br />
                        {"    "}
                        <span className="/90">riskTolerance:</span>{" "}
                        <span className="text-blue-300">z</span>.
                        <span className="text-yellow-300">enum</span>([
                        <span className="text-green-400">"low"</span>,
                        <span className="text-green-400">"medium"</span>,
                        <span className="text-green-400">"high"</span>])
                        <br />
                        {"  "}
                        {"}),"}
                        <br />
                        <br />
                        {"  "}
                        <span className="/90">render:</span>{" "}
                        <span className="text-yellow-300">(state)</span> {"=>"}{" "}
                        <span className="text-green-400">"Portfolio: "</span> +{" "}
                        <span className="text-blue-300">getTotalValue</span>(
                        <span className="text-blue-300">state.portfolio</span>)
                        + <span className="text-green-400">" - Risk: "</span> +{" "}
                        <span className="text-blue-300">
                          state.riskTolerance
                        </span>
                        <br />
                        {"}"});
                      </code>
                    </pre>
                  )}
                  {activeTab === "actions" && (
                    <pre className="text-sm font-mono /90 overflow-auto">
                      <code>
                        <span className="text-purple-400">import</span> {"{"}{" "}
                        <span className="/90">action</span> {"}"}{" "}
                        <span className="text-purple-400">from</span>{" "}
                        <span className="text-green-400">
                          "@daydreamsai/core"
                        </span>
                        ;
                        <br />
                        <span className="text-purple-400">import</span> {"{"}{" "}
                        <span className="/90">z</span> {"}"}{" "}
                        <span className="text-purple-400">from</span>{" "}
                        <span className="text-green-400">"zod"</span>;
                        <br />
                        <br />
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-blue-300">executeSwap</span> ={" "}
                        <span className="text-yellow-300">action</span>({"{"}
                        <br />
                        {"  "}
                        <span className="/90">name:</span>{" "}
                        <span className="text-green-400">"executeSwap"</span>,
                        <br />
                        {"  "}
                        <span className="/90">description:</span>{" "}
                        <span className="text-green-400">
                          "Execute a token swap on Uniswap V3"
                        </span>
                        ,
                        <br />
                        {"  "}
                        <span className="/90">schema:</span>{" "}
                        <span className="text-blue-300">z</span>.
                        <span className="text-yellow-300">object</span>({"{"}
                        <br />
                        {"    "}
                        <span className="/90">tokenIn:</span>{" "}
                        <span className="text-blue-300">z</span>.
                        <span className="text-yellow-300">string</span>(),
                        <br />
                        {"    "}
                        <span className="/90">tokenOut:</span>{" "}
                        <span className="text-blue-300">z</span>.
                        <span className="text-yellow-300">string</span>(),
                        <br />
                        {"    "}
                        <span className="/90">amount:</span>{" "}
                        <span className="text-blue-300">z</span>.
                        <span className="text-yellow-300">string</span>(),
                        <br />
                        {"    "}
                        <span className="/90">slippage:</span>{" "}
                        <span className="text-blue-300">z</span>.
                        <span className="text-yellow-300">number</span>().
                        <span className="text-yellow-300">default</span>(
                        <span className="text-orange-300">0.5</span>)
                        <br />
                        {"  "}
                        {"}),"}
                        <br />
                        <br />
                        {"  "}
                        <span className="text-purple-400">async</span>{" "}
                        <span className="text-yellow-300">handler</span>({"{"}{" "}
                        <span className="text-blue-300">
                          tokenIn, tokenOut, amount, slippage
                        </span>{" "}
                        {"}"}, <span className="text-blue-300">ctx</span>) {"{"}
                        <br />
                        {"    "}
                        <span className="text-gray-500 italic">
                          {/*// Check portfolio state*/}
                        </span>
                        <br />
                        {"    "}
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-blue-300">balance</span> =
                        <span className="text-blue-300">ctx</span>.
                        <span className="text-blue-300">state</span>.
                        <span className="text-blue-300">portfolio</span>[
                        <span className="text-blue-300">tokenIn</span>] ||
                        <span className="text-orange-300">0</span>;
                        <br />
                        {"    "}
                        <span className="text-purple-400">if</span> (
                        <span className="text-blue-300">balance</span> {"<"}{" "}
                        <span className="text-yellow-300">parseFloat</span>(
                        <span className="text-blue-300">amount</span>)) {"{"}
                        <br />
                        {"      "}
                        <span className="text-purple-400">throw new Error</span>
                        (
                        <span className="text-green-400">
                          "Insufficient balance"
                        </span>
                        );
                        <br />
                        {"    "}
                        {"}"}
                        <br />
                        <br />
                        {"    "}
                        <span className="text-gray-500 italic">
                          {/*// Execute swap and update state*/}
                        </span>
                        <br />
                        {"    "}
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-blue-300">result</span> =
                        <span className="text-purple-400">await</span>{" "}
                        <span className="text-yellow-300">uniswapV3</span>.
                        <span className="text-yellow-300">swap</span>({"{"}
                        <span className="text-blue-300">
                          tokenIn, tokenOut, amount, slippage
                        </span>
                        {"}"});
                        <br />
                        {"    "}
                        <span className="text-purple-400">return</span>{" "}
                        <span className="text-blue-300">result</span>;
                        <br />
                        {"  "}
                        {"}"}
                        <br />
                        {"}"});
                      </code>
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SyntheticDataSection() {
  return (
    <div className="border-x border-t py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-purple-500/5" />

      <h2 className="text-center text-2xl font-semibold mb-2  relative z-10">
        <span className=" px-2 py-1">_{">"} Synthetic Data Generation</span>
      </h2>
      <p className="text-center /70 mb-12 relative z-10 max-w-2xl mx-auto">
        The power of synthetic data generation
      </p>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="bg-black/20 border border-white/10 rounded-lg overflow-hidden backdrop-blur-sm">
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Details */}
              <div>
                <h3 className="text-2xl font-semibold  mb-4 flex items-center gap-3">
                  <span className="text-3xl">🔄</span>
                  Synthetic Data Generation
                </h3>
                <p className="/80 text-lg mb-8">
                  Synthetic data generation is the process of creating
                  artificial data that mimics real-world data. It's a powerful
                  tool for training AI models, as it allows for the creation of
                  large, diverse datasets without the need for collecting and
                  labeling real data.
                </p>

                <div className="mb-8">
                  <h4 className=" font-medium mb-4">Key Features</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <li className="flex items-center gap-2 /80">
                      <svg
                        className="w-5 h-5 text-purple-400"
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
                      Large-scale creation
                    </li>
                    <li className="flex items-center gap-2 /80">
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Customizable
                    </li>
                    <li className="flex items-center gap-2 /80">
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      High-quality
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className=" font-medium mb-4">Benefits</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <li className="flex items-center gap-2 /80">
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Cost-effective
                    </li>
                    <li className="flex items-center gap-2 /80">
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Scalable
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column - Code Example */}
              <div>
                <div className="bg-black/30 rounded-lg border border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="/40 text-sm">agent.ts</span>
                  </div>
                  <pre className="p-4 overflow-auto">
                    <code className="text-sm font-mono /90">
                      <span className="text-purple-400">import</span> {"{"}{" "}
                      <span className="/90">createDreams</span> {"}"}{" "}
                      <span className="text-purple-400">from</span>{" "}
                      <span className="text-green-400">
                        "@daydreamsai/core"
                      </span>
                      ;
                      <br />
                      <span className="text-purple-400">import</span> {"{"}{" "}
                      <span className="/90">createSyntheticData</span> {"}"}{" "}
                      <span className="text-purple-400">from</span>{" "}
                      <span className="text-green-400">
                        "@daydreamsai/synthetic"
                      </span>
                      ;
                      <br />
                      <br />
                      <span className="text-purple-400">const</span>{" "}
                      <span className="text-blue-300">agent</span> ={" "}
                      <span className="text-yellow-300">createDreams</span>(
                      {"{"}
                      <br />
                      <span className="/90 pl-4">model:</span>{" "}
                      <span className="text-yellow-300">groq</span>(
                      <span className="text-green-400">
                        "deepseek-r1-distill-llama-70b"
                      </span>
                      ),
                      <br />
                      <span className="/90 pl-4">extensions:</span> [
                      <br />
                      <span className="pl-8">
                        <span className="text-yellow-300">
                          createSyntheticData
                        </span>
                        ({"{"}
                      </span>
                      <br />
                      <span className="/90 pl-12">enabled:</span>{" "}
                      <span className="text-orange-300">true</span>,
                      <br />
                      <span className="/90 pl-12">formats:</span> [
                      <span className="text-green-400">
                        "instruction-tuning"
                      </span>
                      , <span className="text-green-400">"grpo"</span>],
                      <br />
                      <span className="/90 pl-12">capture:</span> {"{"}
                      <br />
                      <span className="/90 pl-16">reasoning:</span>{" "}
                      <span className="text-orange-300">true</span>,
                      <br />
                      <span className="/90 pl-16">preferences:</span>{" "}
                      <span className="text-orange-300">true</span>
                      <br />
                      <span className="pl-12">{"}"}</span>
                      <br />
                      <span className="pl-8">{"}),"}</span>
                      <br />
                      <span className="pl-4">],</span>
                      <br />
                      {"}"});
                      <br />
                      <br />
                      <span className="text-gray-500 italic">
                        {/*// Agent automatically generates training data*/}
                      </span>
                      <br />
                      <span className="text-purple-400">await</span>{" "}
                      <span className="text-blue-300">agent</span>.
                      <span className="text-yellow-300">callAction</span>(
                      <span className="text-green-400">
                        "synthetic.process"
                      </span>
                      );
                    </code>
                  </pre>
                </div>

                <div className="mt-8 flex justify-end">
                  <Link
                    href="/docs/core/concepts/synthetic-data"
                    className={cn(
                      buttonStyles.ghost,
                      "inline-flex items-center px-4 py-2 text-sm rounded-md"
                    )}
                  >
                    <span>Learn more about Synthetic Data Generation</span>
                    <svg
                      className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
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
          </div>
        </div>
      </div>
    </div>
  );
}

function Features() {
  return (
    <div className="grid grid-cols-1 border-x border-t md:grid-cols-2 lg:grid-cols-3">
      <div className="col-span-full flex flex-row items-start justify-center border-l border-t p-8 pb-2 text-center">
        <h2 className="bg-purple-600  px-2 text-2xl font-semibold">Features</h2>
      </div>

      {/* Feature Card 1 */}
      <Link
        href="/docs/introduction"
        className="group bg-white/5 backdrop-blur-sm p-6 border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium ">Installation</h3>
        </div>
        <p className="text-sm /80">
          Learn the basics and get up and running in minutes
        </p>
        <div
          className={cn(
            buttonStyles.ghost,
            "mt-4 inline-flex items-center px-3 py-1 text-sm rounded-md"
          )}
        >
          <span>Get started</span>
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
        </div>
      </Link>

      {/* Feature Card 2 */}
      <Link
        href="/docs/agents/overview"
        className="group bg-white/5 backdrop-blur-sm p-6 border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium ">Agents</h3>
        </div>
        <p className="text-sm /80">Build agents with Daydreams</p>
        <div
          className={cn(
            buttonStyles.ghost,
            "mt-4 inline-flex items-center px-3 py-1 text-sm rounded-md"
          )}
        >
          <span>View guides</span>
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
        </div>
      </Link>

      {/* Feature Card 3 */}
      <Link
        href="/docs/guides/twitter"
        className="group bg-white/5 backdrop-blur-sm p-6 border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium ">Guide</h3>
        </div>
        <p className="text-sm /80">Types and interfaces</p>
        <div
          className={cn(
            buttonStyles.ghost,
            "mt-4 inline-flex items-center px-3 py-1 text-sm rounded-md"
          )}
        >
          <span>Explore Guide</span>
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
        </div>
      </Link>
    </div>
  );
}

type ApplicationType = {
  title: string;
  description: string;
  gradient: string;
  icon: string;
  features: string[];
  codeExample: string;
  benefits: string[];
};

type ApplicationsType = {
  [key: string]: ApplicationType;
};

function Applications() {
  const [activeApp, setActiveApp] = useState<keyof ApplicationsType>("gaming");

  const applications: ApplicationsType = {
    gaming: {
      title: "Autonomous Gaming",
      description:
        "Build agents that play games, optimize strategies, and interact with gaming ecosystems.",
      gradient: "from-purple-600/30 to-pink-600/30",
      icon: "🎮",
      features: [
        "Real-time game state analysis",
        "Strategic decision making",
        "Multi-agent coordination",
        "Learning from gameplay data",
      ],
      codeExample: `const gameAgent = createDreams({
  model: "gpt-4",
  memory: createGameMemory(),
  actions: [
    moveAction,
    attackAction,
    defendAction
  ]
});`,
      benefits: [
        "24/7 automated gameplay",
        "Optimized resource management",
        "Competitive strategy development",
        "Enhanced player experience",
      ],
    },
    yield: {
      title: "Autonomous Yield",
      description:
        "Create agents that manage DeFi positions, optimize yield farming, and automate financial strategies.",
      gradient: "from-blue-600/30 to-teal-600/30",
      icon: "📈",
      features: [
        "Real-time market analysis",
        "Multi-protocol yield optimization",
        "Risk management",
        "Gas-efficient execution",
      ],
      codeExample: `const yieldAgent = createDreams({
  model: "claude-3",
  memory: createMarketMemory(),
  actions: [
    swapAction,
    depositAction,
    harvestAction
  ]
});`,
      benefits: [
        "Automated yield optimization",
        "24/7 market monitoring",
        "Risk-adjusted returns",
        "Cross-chain opportunities",
      ],
    },
    dao: {
      title: "Autonomous DAOs",
      description:
        "Develop governance agents that vote, propose, and execute decisions on behalf of DAOs.",
      gradient: "from-green-600/30 to-yellow-600/30",
      icon: "🏛️",
      features: [
        "Proposal analysis",
        "Voting strategy",
        "Treasury management",
        "Stakeholder alignment",
      ],
      codeExample: `const daoAgent = createDreams({
  model: "gpt-4",
  memory: createGovernanceMemory(),
  actions: [
    proposeAction,
    voteAction,
    executeAction
  ]
});`,
      benefits: [
        "Automated governance",
        "Efficient decision-making",
        "Transparent operations",
        "Community alignment",
      ],
    },
    worlds: {
      title: "Autonomous Worlds",
      description:
        "Build persistent digital worlds with embedded agents that evolve and interact autonomously.",
      gradient: "from-orange-600/30 to-red-600/30",
      icon: "🌍",
      features: [
        "World state management",
        "Agent interactions",
        "Resource economics",
        "Emergent behavior",
      ],
      codeExample: `const worldAgent = createDreams({
  model: "claude-3",
  memory: createWorldMemory(),
  actions: [
    interactAction,
    tradeAction,
    buildAction
  ]
});`,
      benefits: [
        "Persistent worlds",
        "Dynamic ecosystems",
        "Emergent narratives",
        "Scalable interactions",
      ],
    },
  };

  return (
    <div className="border-x border-t py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-purple-500/5" />

      <h2 className="text-center text-2xl font-semibold mb-2  relative z-10">
        <span className=" px-2 py-1">_{">"} Applications</span>
      </h2>
      <p className="text-center /70 mb-12 relative z-10 max-w-2xl mx-auto">
        Endless possibilities for autonomous agents
      </p>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="bg-black/20 border border-white/10 rounded-lg overflow-hidden backdrop-blur-sm">
          {/* Tabs */}
          <div className="flex overflow-x-auto bg-white/5">
            {Object.entries(applications).map(([key, app]) => (
              <button
                key={key}
                onClick={() => setActiveApp(key as keyof ApplicationsType)}
                className={`px-6 py-4 flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeApp === key
                    ? " border-b-2 border-purple-500 bg-white/5"
                    : "/60 hover: hover:bg-white/5"
                }`}
              >
                <span className="text-xl">{app.icon}</span>
                <span>{app.title}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Details */}
              <div>
                <h3 className="text-2xl font-semibold  mb-4 flex items-center gap-3">
                  <span className="text-3xl">
                    {applications[activeApp].icon}
                  </span>
                  {applications[activeApp].title}
                </h3>
                <p className="/80 text-lg mb-8">
                  {applications[activeApp].description}
                </p>

                <div className="mb-8">
                  <h4 className=" font-medium mb-4">Key Features</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {applications[activeApp].features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 /80">
                        <svg
                          className="w-5 h-5 text-purple-400"
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
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className=" font-medium mb-4">Benefits</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {applications[activeApp].benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2 /80">
                        <svg
                          className="w-5 h-5 text-purple-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column - Code Example */}
              <div>
                <div className="bg-black/30 rounded-lg border border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="/40 text-sm">agent.ts</span>
                  </div>
                  <pre className="p-4 overflow-auto">
                    <code className="text-sm font-mono /90">
                      {applications[activeApp].codeExample}
                    </code>
                  </pre>
                </div>

                <div className="mt-8 flex justify-end">
                  <Link
                    href="/docs/applications"
                    className={cn(
                      buttonStyles.ghost,
                      "inline-flex items-center px-4 py-2 text-sm rounded-md"
                    )}
                  >
                    <span>
                      Learn more about {applications[activeApp].title}
                    </span>
                    <svg
                      className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
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
          </div>
        </div>
      </div>
    </div>
  );
}

function Providers() {
  const providers = [
    {
      name: "OpenAI",
      logo: "/providers/openai.svg",
      color: "#00A67E",
    },
    {
      name: "Anthropic",
      logo: "/providers/anthropic.svg",
      color: "#C084FC",
    },
    {
      name: "Groq",
      logo: "/providers/groq.svg",
      color: "#FF6B6B",
    },
    {
      name: "Mistral",
      logo: "/providers/mistral.svg",
      color: "#4F46E5",
    },
    {
      name: "DeepSeek",
      logo: "/providers/deepseek.svg",
      color: "#2563EB",
    },
    {
      name: "Google",
      logo: "/providers/google.svg",
      color: "#34A853",
    },
  ];

  return (
    <div className="border-x border-t py-16 px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/10 animate-pulse" />

      <h2 className="text-center text-2xl font-semibold mb-2  relative z-10">
        <span className=" px-2 py-1">_{">"} Supported Providers</span>
      </h2>
      <p className="text-center /70 mb-8 relative z-10 max-w-2xl mx-auto">
        Choose your preferred foundation models
      </p>

      <div className="max-w-4xl mx-auto relative">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 items-center justify-items-center">
          {providers.map((provider, index) => (
            <div
              key={provider.name}
              className="group relative"
              style={{
                animation: `float ${3 + index * 0.5}s ease-in-out infinite`,
              }}
            >
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"
                style={{ backgroundColor: provider.color }}
              />
              <div className="relative bg-white/10 backdrop-blur-sm w-24 h-24 rounded-full flex items-center justify-center border border-white/20 hover:border-white/40 transition-all transform hover:scale-110">
                <img
                  src={provider.logo}
                  alt={`${provider.name} logo`}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <p className="text-center mt-2 text-sm /80">{provider.name}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}

function Chains() {
  const chains = [
    {
      name: "Ethereum",
      logo: "/chains/eth-logo.svg",
      color: "#627EEA",
    },
    {
      name: "Solana",
      logo: "/chains/solana-logo.svg",
      color: "#9945FF",
    },
    {
      name: "Hyperliquid",
      logo: "/chains/hl-logo.svg",
      color: "#0066FF",
    },
    {
      name: "StarkNet",
      logo: "/chains/Starknet.svg",
      color: "#00FFD1",
    },
    {
      name: "Optimism",
      logo: "/chains/optimism-logo.svg",
      color: "#FF0420",
    },
    {
      name: "Arbitrum",
      logo: "/chains/arbitrum-logo.svg",
      color: "#28A0F0",
    },
    {
      name: "Base",
      logo: "/chains/base-logo.svg",
      color: "#0052FF",
    },
  ];

  return (
    <div className="border-x border-t py-16 px-8 relative overflow-hidden">
      {/* Animated blockchain graphic in the background */}

      <h2 className="text-center text-2xl font-semibold mb-2  relative z-10">
        <span className=" px-2 py-1">_{">"} Supported Chains</span>
      </h2>
      <p className="text-center /70 mb-8 relative z-10 max-w-2xl mx-auto">
        Build agents on your favorite blockchain networks
      </p>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 items-center justify-items-center">
          {chains.map((chain, index) => (
            <div
              key={chain.name}
              className="group relative"
              style={{
                animation: `float ${2.5 + index * 0.3}s ease-in-out infinite`,
                animationDelay: `${index * 0.2}s`,
              }}
            >
              <div
                className="absolute inset-0 rounded-xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity"
                style={{ backgroundColor: chain.color }}
              />
              <div className="relative bg-white/5 backdrop-blur-sm w-28 h-28 rounded-xl flex items-center justify-center border border-white/20 hover:border-white/40 transition-all transform hover:scale-110 hover:rotate-3">
                <img
                  src={chain.logo}
                  alt={`${chain.name} logo`}
                  className="w-14 h-14 object-contain"
                />
              </div>
              <p className="text-center mt-3 text-sm font-medium /80">
                {chain.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0);
          }
          50% {
            transform: translateY(-8px) rotate(2deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes pulse-delay {
          0%,
          100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

function Highlight({
  icon: Icon,
  heading,
  children,
}: {
  icon: any;
  heading: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-l border-t px-6 py-12">
      <div className="mb-4 flex flex-row items-center gap-2 /60">
        <Icon className="size-4" />
        <h2 className="text-sm font-medium">{heading}</h2>
      </div>
      <span className="/80">{children}</span>
    </div>
  );
}

function CallToAction() {
  return (
    <div className="py-16 text-center border-x border-t border-b">
      <h2 className="text-3xl font-medium  mb-2 tracking-tight">
        _{">"} Start dreaming...
      </h2>
      <p className="text-center /70 mb-6 max-w-2xl mx-auto">
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
