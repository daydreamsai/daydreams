/**
 * Framework-level capability awareness implementation
 */

import { z } from "zod";
import type {
  Action,
  AnyAgent,
  ContextState,
  CapabilityIndex,
  CapabilityAwarenessConfig,
} from "./types";
import { action } from "./utils";

/**
 * Default capability awareness configuration
 */
export const DEFAULT_CAPABILITY_CONFIG: Required<CapabilityAwarenessConfig> = {
  enabled: true,
  autoDiscover: true,
  includeDiscoveryActions: true,
  sources: ["agent"],
  cacheLifetime: 300000,
  maxActiveCapabilities: 25,
};

/**
 * Creates an empty capability index
 */
export function createCapabilityIndex(): CapabilityIndex {
  return {
    actions: new Map(),
    contexts: new Map(),
    inputs: new Map(),
    outputs: new Map(),
    lastScan: Date.now(),
    scanCount: 0,
  };
}

/**
 * Discovers capabilities from agent sources
 */
export async function discoverAgentCapabilities(
  agent: AnyAgent,
  sources: "agent"[] = ["agent"]
): Promise<CapabilityIndex> {
  const index = createCapabilityIndex();

  for (const source of sources) {
    if (source === "agent") {
      // Discover from agent's registered actions
      for (const action of agent.actions || []) {
        index.actions.set(action.name, {
          action,
          source: "agent",
          lastUsed: 0,
          usage_count: 0,
        });
      }

      // Discover from agent's registered contexts
      if (agent.registry?.contexts) {
        for (const [name, context] of agent.registry.contexts) {
          index.contexts.set(name, {
            context,
            source: "agent",
            active: false,
          });
        }
      }

      // Discover from agent's registered inputs
      if (agent.registry?.inputs) {
        for (const [name, input] of agent.registry.inputs) {
          index.inputs.set(name, {
            input: input as any,
            source: "agent",
          });
        }
      }

      // Discover from agent's registered outputs
      if (agent.registry?.outputs) {
        for (const [name, output] of agent.registry.outputs) {
          index.outputs.set(name, {
            output: output as any,
            source: "agent",
          });
        }
      }
    }
  }

  index.scanCount++;
  index.lastScan = Date.now();

  return index;
}

/**
 * Framework discovery actions that enable capability awareness
 */
export const DISCOVERY_ACTIONS: Action[] = [
  action({
    name: "_core.scan_capabilities",
    description: "Discover and index all available capabilities in the system",
    schema: z.object({
      sources: z
        .array(z.enum(["agent"]))
        .optional()
        .default(["agent"]),
      rebuild: z.boolean().optional().default(false),
    }),
    handler: async ({ sources, rebuild }, ctx, agent) => {
      if (!agent) {
        throw new Error(
          "Agent reference not available for capability discovery"
        );
      }

      // Initialize capability namespace if needed
      if (!ctx.memory._capabilities) {
        ctx.memory._capabilities = {
          index: createCapabilityIndex(),
          active: [],
          strategy: { type: "context-aware", maxActiveActions: 20 },
          config: DEFAULT_CAPABILITY_CONFIG,
        };
      }

      let discoveredIndex: CapabilityIndex;

      if (
        rebuild ||
        !ctx.memory._capabilities.index ||
        ctx.memory._capabilities.index.actions.size === 0
      ) {
        agent.logger.info(
          "_core.scan_capabilities",
          "🔍 Scanning for available capabilities..."
        );
        discoveredIndex = await discoverAgentCapabilities(agent, sources);
        ctx.memory._capabilities.index = discoveredIndex;
        ctx.memory._capabilities.lastDiscovery = Date.now();
      } else {
        discoveredIndex = ctx.memory._capabilities.index;
      }

      const scannedCount =
        discoveredIndex.actions.size +
        discoveredIndex.contexts.size +
        discoveredIndex.inputs.size +
        discoveredIndex.outputs.size;

      agent.logger.info(
        "_core.scan_capabilities",
        `✅ Capability scan complete: ${scannedCount} capabilities discovered`
      );
      agent.logger.info(
        "_core.scan_capabilities",
        `📊 Actions: ${discoveredIndex.actions.size}, Contexts: ${discoveredIndex.contexts.size}`
      );

      return {
        scanned: scannedCount,
        actions: discoveredIndex.actions.size,
        contexts: discoveredIndex.contexts.size,
        inputs: discoveredIndex.inputs.size,
        outputs: discoveredIndex.outputs.size,
        sources_scanned: sources,
        scan_count: discoveredIndex.scanCount,
      };
    },
  }),

  action({
    name: "_core.list_capabilities",
    description:
      "List all discovered capabilities, optionally filtered by type or search term",
    schema: z.object({
      type: z
        .enum(["actions", "contexts", "inputs", "outputs", "all"])
        .optional()
        .default("all"),
      search: z.string().optional(),
      sort_by: z
        .enum(["name", "source", "usage", "recent"])
        .optional()
        .default("name"),
    }),
    handler: async ({ type, search, sort_by }, ctx, agent) => {
      if (!ctx.memory._capabilities?.index) {
        return {
          error: "No capabilities indexed. Run scan_capabilities first.",
        };
      }

      const index = ctx.memory._capabilities.index;
      const results: any[] = [];

      // Collect capabilities based on type
      if (type === "all" || type === "actions") {
        for (const [name, info] of index.actions) {
          results.push({
            name,
            type: "action",
            description: info.action.description || "No description",
            source: info.source,
            usage_count: info.usage_count || 0,
            last_used: info.lastUsed || 0,
          });
        }
      }

      if (type === "all" || type === "contexts") {
        for (const [name, info] of index.contexts) {
          results.push({
            name,
            type: "context",
            description: `Context: ${info.context.type}`,
            source: info.source,
            usage_count: 0,
            last_used: 0,
          });
        }
      }

      // Apply search filter
      let filtered = results;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = results.filter(
          (cap) =>
            cap.name.toLowerCase().includes(searchLower) ||
            cap.description.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (sort_by) {
          case "source":
            return a.source.localeCompare(b.source);
          case "usage":
            return b.usage_count - a.usage_count;
          case "recent":
            return b.last_used - a.last_used;
          default:
            return a.name.localeCompare(b.name);
        }
      });

      agent.logger.info(
        "_core.list_capabilities",
        `📋 Listing ${filtered.length} capabilities (filtered by: ${type}, sorted by: ${sort_by})`
      );

      return {
        capabilities: filtered,
        total: filtered.length,
        filtered_by: { type, search },
        sorted_by: sort_by,
        index_stats: {
          total_actions: index.actions.size,
          total_contexts: index.contexts.size,
          last_scan: new Date(index.lastScan).toISOString(),
        },
      };
    },
  }),

  action({
    name: "_core.load_capability",
    description: "Dynamically activate a specific capability",
    schema: z.object({
      capability_name: z.string(),
      capability_type: z
        .enum(["action", "context"])
        .optional()
        .default("action"),
    }),
    handler: async ({ capability_name, capability_type }, ctx, agent) => {
      if (!ctx.memory._capabilities?.index) {
        return {
          error: "No capabilities indexed. Run scan_capabilities first.",
        };
      }

      const { index, active, config } = ctx.memory._capabilities;

      // Check max active limit
      if (active.length >= config.maxActiveCapabilities!) {
        return {
          error: `Maximum active capabilities reached (${config.maxActiveCapabilities}). Unload some first.`,
          max_limit: config.maxActiveCapabilities,
        };
      }

      // Find the capability
      let capabilityInfo: any;
      if (capability_type === "action") {
        capabilityInfo = index.actions.get(capability_name);
      } else if (capability_type === "context") {
        capabilityInfo = index.contexts.get(capability_name);
      }

      if (!capabilityInfo) {
        return {
          error: `Capability '${capability_name}' not found in ${capability_type} index.`,
          available:
            capability_type === "action"
              ? Array.from(index.actions.keys())
              : Array.from(index.contexts.keys()),
        };
      }

      // Add to active set
      const capabilityId = `${capability_type}:${capability_name}`;
      if (!active.includes(capabilityId)) {
        active.push(capabilityId);

        // Update usage tracking for actions
        if (capability_type === "action") {
          capabilityInfo.lastUsed = Date.now();
          capabilityInfo.usage_count = (capabilityInfo.usage_count || 0) + 1;
        }

        agent.logger.info(
          "_core.load_capability",
          `🚀 Loaded ${capability_type}: ${capability_name}`
        );
        agent.logger.info(
          "_core.load_capability",
          `   📝 ${
            capabilityInfo.action?.description ||
            capabilityInfo.context?.type ||
            "No description"
          }`
        );

        return {
          loaded: true,
          capability: capability_name,
          type: capability_type,
          description:
            capabilityInfo.action?.description || capabilityInfo.context?.type,
          source: capabilityInfo.source,
          currently_active: active.length,
        };
      } else {
        return {
          loaded: false,
          reason: "Capability already active",
          capability: capability_name,
          type: capability_type,
        };
      }
    },
  }),

  action({
    name: "_core.unload_capability",
    description: "Remove a capability from the active set",
    schema: z.object({
      capability_name: z.string(),
      capability_type: z
        .enum(["action", "context"])
        .optional()
        .default("action"),
    }),
    handler: async ({ capability_name, capability_type }, ctx, agent) => {
      if (!ctx.memory._capabilities) {
        return { error: "Capability awareness not initialized." };
      }

      const { active } = ctx.memory._capabilities;
      const capabilityId = `${capability_type}:${capability_name}`;
      const index = active.indexOf(capabilityId);

      if (index > -1) {
        active.splice(index, 1);
        agent.logger.info(
          "_core.unload_capability",
          `📤 Unloaded ${capability_type}: ${capability_name}`
        );
        return {
          unloaded: true,
          capability: capability_name,
          type: capability_type,
          currently_active: active.length,
        };
      } else {
        return {
          unloaded: false,
          reason: "Capability not currently active",
          capability: capability_name,
          type: capability_type,
          currently_active: active.length,
        };
      }
    },
  }),

  action({
    name: "_core.capability_status",
    description: "Show current capability awareness status",
    schema: z.object({}),
    handler: async (_, ctx, agent) => {
      if (!ctx.memory._capabilities) {
        return {
          error: "Capability awareness not initialized.",
          suggestion:
            "Run scan_capabilities to initialize capability discovery.",
        };
      }

      const { index, active, config, lastDiscovery } = ctx.memory._capabilities;

      const activeByType = {
        actions: active.filter((id: string) => id.startsWith("action:")).length,
        contexts: active.filter((id: string) => id.startsWith("context:"))
          .length,
      };

      agent.logger.info(
        "_core.capability_status",
        "📊 Capability Awareness Status:"
      );
      agent.logger.info(
        "_core.capability_status",
        `   💾 Total indexed: ${
          index.actions.size +
          index.contexts.size +
          index.inputs.size +
          index.outputs.size
        }`
      );
      agent.logger.info(
        "_core.capability_status",
        `   🚀 Currently active: ${active.length}/${config.maxActiveCapabilities}`
      );
      agent.logger.info(
        "_core.capability_status",
        `   📦 Available: ${index.actions.size} actions, ${index.contexts.size} contexts`
      );

      return {
        status: "active",
        configuration: config,
        index_summary: {
          total_capabilities:
            index.actions.size +
            index.contexts.size +
            index.inputs.size +
            index.outputs.size,
          actions: index.actions.size,
          contexts: index.contexts.size,
          inputs: index.inputs.size,
          outputs: index.outputs.size,
          last_scan: new Date(index.lastScan).toISOString(),
          scan_count: index.scanCount,
        },
        active_summary: {
          total_active: active.length,
          max_allowed: config.maxActiveCapabilities,
          by_type: activeByType,
          active_capabilities: active,
        },
        last_discovery: lastDiscovery
          ? new Date(lastDiscovery).toISOString()
          : null,
      };
    },
  }),
];

/**
 * Gets active capabilities for a context state
 */
export function getActiveCapabilities(ctx: ContextState): Action[] {
  if (!ctx.memory._capabilities?.index || !ctx.memory._capabilities.active) {
    return [];
  }

  const { index, active } = ctx.memory._capabilities;
  const capabilities: Action[] = [];

  for (const capabilityId of active) {
    const [type, name] = capabilityId.split(":", 2);

    if (type === "action") {
      const info = index.actions.get(name);
      if (info) {
        capabilities.push(info.action);
      }
    }
    // Note: contexts are handled differently (not included in action list)
  }

  return capabilities;
}

/**
 * Resolves capability configuration (agent-level + context-level)
 */
export function resolveCapabilityConfig(
  agentConfig?: CapabilityAwarenessConfig,
  contextConfig?: CapabilityAwarenessConfig
): Required<CapabilityAwarenessConfig> {
  return {
    ...DEFAULT_CAPABILITY_CONFIG,
    ...agentConfig,
    ...contextConfig,
  };
}
