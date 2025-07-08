import zodToJsonSchema from "zod-to-json-schema";
import { z } from "zod";
import { type Schema } from "@ai-sdk/ui-utils";
import type { XMLElement } from "@/types/xml";
import type {
  ActionCallMemory,
  ActionResultMemory,
  EventMemory,
  InputMemory,
  OutputMemory,
  ThoughtMemory,
} from "@/types/wm";
import type { Output } from "@/types/components";
import type { AnyAction } from "@/types/action";
import type { ContextState } from "@/types/context";
import type { WorkingMemory } from "@/types/wm";
import type { AnyMemory } from "@/types/memory";

export function xml(
  tag: string,
  params?: Record<string, any>,
  children?: string | XMLElement[] | any
): XMLElement {
  const el: XMLElement = {
    tag,
  };

  if (params) el.params = params;
  if (children) el.children = children;

  return el;
}

/**
 * Formats an XML element into a string representation
 * @param tag - The XML tag name
 * @param params - Optional parameters/attributes for the XML tag
 * @param content - The content of the XML element (string or nested elements)
 * @returns Formatted XML string
 */
export function formatXml(
  el: XMLElement,
  formatChildren: (el: any) => string = formatXml
): string {
  const params = el.params
    ? Object.entries(el.params)
        .map(([k, v]) => ` ${k}="${v}"`)
        .join("")
    : "";

  let children = Array.isArray(el.children)
    ? el.children.filter((t) => !!t)
    : el.children;

  if (Array.isArray(children) && children.length === 0) {
    children = "";
  }

  children =
    typeof children === "string"
      ? children
      : Array.isArray(children) && children.length > 0
        ? "\n" + children.map((el) => formatChildren(el)).join("\n") + "\n"
        : formatChildren(children);

  try {
    if (children === "") return `<${el.tag}${params} />`;
    return `<${el.tag}${params}>${children}</${el.tag}>`;
  } catch (error) {
    // console.log("failed to format", el);
    throw error;
  }
}

/**
 * Formats an input reference into XML format
 * @param input - The input reference to format
 * @returns XML string representation of the input
 */
export function formatInput(input: InputMemory) {
  return xml(
    "input",
    {
      name: input.name,
      timestamp: input.timestamp,
      // ...input.params
    },
    input.content
  );
}

/**
 * Formats an output reference into XML format
 * @param output - The output reference to format
 * @returns XML string representation of the output
 */
export function formatOutput(output: OutputMemory) {
  return xml(
    "output",
    {
      name: output.name,
      timestamp: output.timestamp,
      // ...output.params
    },
    output.raw ?? output.content
  );
}

export function formatSchema(schema: any, key: string = "schema") {
  return "_type" in schema
    ? (schema as Schema).jsonSchema
    : zodToJsonSchema("parse" in schema ? schema : z.object(schema), key)
        .definitions![key];
}

/**
 * Formats an output interface definition into XML format
 * @param output - The output interface to format
 * @returns XML string representation of the output interface
 */
export function formatOutputInterface(output: Output) {
  const params: Record<string, string> = {
    name: output.name,
  };

  // if (output.required) {
  //   params.required = "true";
  // }

  return xml("output", params, [
    output.description
      ? { tag: "description", children: output.description }
      : null,
    output.instructions
      ? { tag: "instructions", children: output.instructions }
      : null,
    {
      tag: "format",
      children: output.outputFormat?.toUpperCase() ?? "JSON",
    },
    {
      tag: "schema",
      children: formatSchema(output.schema ?? z.string(), "content"),
    },
    output.examples
      ? {
          tag: "examples",
          children: output.examples,
        }
      : null,
  ]);
}

export function formatAction(action: AnyAction) {
  return xml("action", { name: action.name }, [
    action.description
      ? {
          tag: "description",
          children: action.description,
        }
      : null,
    action.instructions
      ? {
          tag: "instructions",
          children: action.instructions,
        }
      : null,
    {
      tag: "format",
      children: action.callFormat?.toUpperCase() ?? "JSON",
    },
    action.schema
      ? {
          tag: "schema",
          children: formatSchema(action.schema, "schema"),
        }
      : null,
    // action.returns
    //   ? {
    //       tag: "returns",
    //       children: formatSchema(action.returns, "returns"),
    //     }
    //   : null,
    action.examples
      ? {
          tag: "examples",
          children: action.examples,
        }
      : null,
  ]);
}

export function formatContextState(state: ContextState) {
  const { id, context } = state;
  const params: Record<string, string> = { name: context.name };

  const [, key] = id.split(":");

  if (key) {
    params.key = key;
  }

  return xml(
    "context",
    params,
    [
      // context.description
      //   ? {
      //       tag: "description",
      //       children:
      //         typeof context.description === "function"
      //           ? context.description(state)
      //           : context.description,
      //     }
      //   : null,
      // context.instructions
      //   ? {
      //       tag: "instructions",
      //       children:
      //         typeof context.instructions === "function"
      //           ? context.instructions(state)
      //           : context.instructions,
      //     }
      //   : null,
      // {
      //   tag: "state",
      //   children: context.render ? context.render(state) : state.memory,
      // },
    ].flat()
  );
}

export function formatActionCall(memory: ActionCallMemory) {
  return xml(
    "action_call",
    {
      id: memory.id,
      name: memory.name,
      timestamp: memory.timestamp,
    },
    memory.raw
  );
}

export function formatActionResult(memory: ActionResultMemory) {
  return xml(
    "action_result",
    {
      callId: memory.parent?.id,
      name: memory.name,
      timestamp: memory.timestamp,
    },
    memory.content
  );
}

export function formatEventMemory(memory: EventMemory) {
  return xml("event", { name: memory.kind }, memory.content);
}

export function formatErrorMemory(memory: any) {
  return xml("event", { name: memory.kind }, memory.content);
}

export function formatThought(memory: ThoughtMemory) {
  return xml("reasoning", {}, memory.raw);
}

export function formatMemory(memory: AnyMemory) {
  switch (memory.kind) {
    case "input":
      return formatInput(memory);
    case "output":
      return formatOutput(memory);
    case "thought":
      return formatThought(memory);
    case "action_call":
      return formatActionCall(memory);
    case "action_result":
      return formatActionResult(memory);
    case "event":
      return formatEventMemory(memory);
    case "error":
      return formatErrorMemory(memory);
    default:
      console.log("missing formatter for memory", memory);
      return null;
  }
}

const engineMemoryTypes = ["run", "step"];

function isMemoryItem(memory: AnyMemory) {
  return !engineMemoryTypes.includes(memory.kind);
}

function __filter(wm: WorkingMemory, includeThoughts = true): AnyMemory[] {
  return wm.memories
    .filter(isMemoryItem)
    .filter((memory) => (memory.kind === "thought" ? includeThoughts : true));
}

export function formatWorkingMemory({
  wm,
  processed,
  size,
}: {
  wm: WorkingMemory;
  processed: boolean;
  size?: number;
}) {
  let unprocessed = !processed;
  let memorys = __filter(wm, false).filter(
    (i) => i.labels.includes("unprocessed") === unprocessed
  );

  if (size) {
    memorys = memorys.slice(-size);
  }

  return memorys.map((i) => formatMemory(i)).flat();
}
