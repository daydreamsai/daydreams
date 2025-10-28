"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for combining classnames
function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground font-mono">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Terminal />
        <Features />
        <QuickStart />
        <Examples />
        <Footer />
      </div>
    </main>
  );
}

function Terminal() {
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [copied, setCopied] = useState(false);
  const fullText = "daydreams@ai:~$ ";
  const subtitle = "AI agents with composable contexts";

  useEffect(() => {
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50);

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  const handleCopyInstall = async () => {
    await navigator.clipboard.writeText("npm install @daydreamsai/core");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLLM = async () => {
    window.open("/llm.txt", "_blank");
  };

  return (
    <div className="mb-16">
      <div className="border border-border rounded-sm bg-card/50 backdrop-blur-sm p-8">
        <div className="mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-primary">NEW:</span>
            <span className="text-muted-foreground">
              MCP integration + x402 nanoservice
            </span>
            <span className="text-muted-foreground">|</span>
            <Link
              href="/docs/core/concepts/mcp"
              className="text-primary hover:underline"
            >
              [mcp docs]
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          <div className="text-2xl md:text-3xl font-bold text-foreground">
            {subtitle}
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            The first framework with <span className="text-primary font-medium">composable contexts</span> - 
            isolated workspaces that combine for complex agent behaviors.
            True memory, TypeScript-first, production-ready.
          </div>

          <div className="mt-6 mb-4">
            <button
              onClick={handleCopyInstall}
              className="group flex items-center gap-3 px-4 py-3 bg-card border border-primary rounded-sm hover:bg-primary/10 transition-colors w-full max-w-md"
            >
              <span className="text-primary text-sm font-mono">$</span>
              <span className="text-foreground font-mono text-sm flex-1 text-left">
                npm install @daydreamsai/core
              </span>
              <span className="text-xs text-muted-foreground group-hover:text-primary">
                {copied ? "[copied]" : "[copy]"}
              </span>
            </button>
          </div>

          <div className="flex gap-4 pt-4">
            <Link
              href="/docs/core/first-agent"
              className="text-primary hover:underline text-sm font-medium"
            >
              [quickstart]
            </Link>
            <Link
              href="/docs/core/concepts/contexts"
              className="text-primary hover:underline text-sm"
            >
              [contexts]
            </Link>
            <Link
              href="/docs/core/concepts/mcp"
              className="text-primary hover:underline text-sm"
            >
              [mcp]
            </Link>
            <Link
              href="/docs/tutorials"
              className="text-primary hover:underline text-sm"
            >
              [examples]
            </Link>
            <Link
              href="https://github.com/daydreamsai/daydreams"
              className="text-primary hover:underline text-sm"
            >
              [github]
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Features() {
  const features = [
    {
      label: "COMPOSABLE",
      value: "Context composition with .use()",
      desc: "Combine isolated workspaces for modular agent behaviors",
    },
    {
      label: "STATEFUL",
      value: "Persistent memory per context",
      desc: "Each conversation remembers - true stateful agents",
    },
    {
      label: "MCP-READY",
      value: "Model Context Protocol support",
      desc: "Connect to any MCP server for external tools and data sources",
    },
    {
      label: "SCOPED",
      value: "Context-specific actions",
      desc: "Precise control over agent capabilities with .setActions()",
    },
    {
      label: "TYPESCRIPT",
      value: "Type-safe throughout",
      desc: "Full IntelliSense for contexts, actions, memory, and schemas",
    },
  ];

  return (
    <div className="mb-16">
      <div className="text-xs text-muted-foreground mb-4">
        $ cat features.txt
      </div>
      <div className="border border-border rounded-sm bg-card/30 p-6">
        <div className="space-y-6">
          {features.map((feature, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-primary font-semibold min-w-[100px]">
                  [{feature.label}]
                </span>
                <span className="text-sm text-foreground">{feature.value}</span>
              </div>
              <div className="ml-[112px] text-xs text-muted-foreground">
                {feature.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickStart() {
  return (
    <div className="mb-16">
      <div className="text-xs text-muted-foreground mb-4">$ cat composable-contexts.ts</div>
      <div className="border border-border rounded-sm bg-background overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
          <span className="text-xs text-muted-foreground">composable-contexts.ts</span>
        </div>
        <pre className="p-4 text-xs overflow-x-auto">
          <code>
            <span className="text-muted-foreground">
              // Single context - basic agent
            </span>
            {"\n"}
            <span className="text-primary">const</span> chatContext = context(
            {"{\n"}
            {"  "}type: <span className="text-green-600">"chat"</span>,{"\n"}
            {"  "}create: () {"=> ({ messages: [] })\n"}
            {"});\n\n"}
            <span className="text-muted-foreground">
              // Composed contexts - powerful agent
            </span>
            {"\n"}
            <span className="text-primary">const</span> customerContext = context(
            {"{\n"}
            {"  "}type: <span className="text-green-600">"customer"</span>,{"\n"}
            {"  "}create: () {"=> ({ tickets: [] }),\n"}
            {"  "}
            <span className="text-muted-foreground">// 🌟 The magic: compose contexts</span>
            {"\n"}
            {"  "}
            <span className="text-blue-400">use</span>: (state) {"=> [\n"}
            {"    { "}context: accountContext{" },\n"}
            {"    { "}context: billingContext{" }\n"}
            {"  ]\n"}
            {"});\n\n"}
            <span className="text-muted-foreground">
              // LLM automatically sees all context data!
            </span>
            {"\n"}
            <span className="text-primary">const</span> agent = createDreams(
            {"{\n"}
            {"  "}contexts: [customerContext],{"\n"}
            {"  "}model: openai(<span className="text-green-600">"gpt-4o"</span>),{"\n"}
            {"});"}
          </code>
        </pre>
      </div>
      <div className="mt-4 p-3 border border-primary/30 rounded-sm bg-primary/5">
        <div className="text-xs text-primary mb-1">💡 Context Composition</div>
        <div className="text-xs text-muted-foreground">
          Customer context gets chat, account AND billing data in one conversation.
          Build modular agents that compose together.
        </div>
      </div>
    </div>
  );
}

function Examples() {
  const examples = [
    { 
      name: "customer-service", 
      desc: "Context composition + action scoping",
      link: "/docs/core/first-agent"
    },
    { 
      name: "multi-context", 
      desc: "Multiple contexts with .use() composition",
      link: "/docs/tutorials/basic/multi-context-agent"
    },
    { 
      name: "x402-nanoservice", 
      desc: "AI service with micropayments",
      link: "/docs/tutorials/x402/server"
    },
    { 
      name: "mcp-integration", 
      desc: "Connect to external tools via MCP",
      link: "/docs/tutorials/mcp/mcp-guide"
    },
  ];

  return (
    <div className="mb-16">
      <div className="text-xs text-muted-foreground mb-4">$ ls examples/</div>
      <div className="border border-border rounded-sm bg-card/30 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {examples.map((example, i) => (
            <Link key={i} href={example.link} className="group flex items-baseline gap-2 py-1 hover:bg-primary/5 -mx-2 px-2 rounded-sm transition-colors">
              <span className="text-primary text-xs group-hover:text-primary/80">→</span>
              <span className="text-sm text-foreground font-medium group-hover:text-primary">
                {example.name}/
              </span>
              <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80">
                {example.desc}
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border flex justify-between">
          <Link
            href="/docs/tutorials"
            className="text-xs text-primary hover:underline"
          >
            $ cd tutorials/ →
          </Link>
          <Link
            href="/docs/core/concepts"
            className="text-xs text-muted-foreground hover:text-primary"
          >
            [concepts]
          </Link>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const providers = [
    "OpenAI",
    "Anthropic",
    "Groq",
    "Google",
    "Mistral",
    "DeepSeek",
  ];

  return (
    <div className="mt-16 pt-8 border-t border-border">
      <div className="text-xs text-muted-foreground mb-6">
        $ echo "Supported providers:"
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        {providers.map((provider) => (
          <span
            key={provider}
            className="text-xs px-2 py-1 border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors cursor-default"
          >
            {provider}
          </span>
        ))}
      </div>
      <div className="text-xs text-muted-foreground mb-8">
        + all{" "}
        <Link
          href="https://sdk.vercel.ai/providers"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          AI SDK providers
        </Link>
      </div>

      <div className="flex items-center justify-between pt-8 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <span className="text-primary">daydreams@ai:~$</span> _
        </div>
        <div className="flex gap-4">
          <Link
            href="https://discord.gg/rt8ajxQvXh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            [discord]
          </Link>
          <Link
            href="https://github.com/daydreamsai/daydreams"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            [github]
          </Link>
          <Link
            href="/docs/core/first-agent"
            className="text-xs text-primary hover:text-foreground transition-colors font-medium"
          >
            [start →]
          </Link>
        </div>
      </div>
    </div>
  );
}
