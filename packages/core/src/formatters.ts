import zodToJsonSchema from "zod-to-json-schema";
import type {
  AnyAction,
  ContextState,
  InputRef,
  Log,
  Output,
  OutputRef,
  TemplateVariables,
  XMLElement,
} from "./types";
import { z } from "zod";
import { type Schema } from "@ai-sdk/ui-utils";

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
export function formatXml(el: XMLElement): string {
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
        ? "\n" +
          children
            .map((el) =>
              typeof el === "string"
                ? el
                : "tag" in el
                  ? formatXml(el)
                  : formatValue(el)
            )
            .join("\n") +
          "\n"
        : formatValue(children);

  try {
    if (children === "") return `<${el.tag}${params} />`;
    return `<${el.tag}${params}>${children}</${el.tag}>`;
  } catch (error) {
    console.log("failed to format", el);
    throw error;
  }
}

/**
 * Formats an input reference into XML format
 * @param input - The input reference to format
 * @returns XML string representation of the input
 */
export function formatInput(input: InputRef) {
  return xml(
    "input",
    { name: input.type, timestamp: input.timestamp, ...input.params },
    input.data
  );
}

/**
 * Formats an output reference into XML format
 * @param output - The output reference to format
 * @returns XML string representation of the output
 */
export function formatOutput(output: OutputRef) {
  return xml(
    "output",
    { name: output.type, timestamp: output.timestamp, ...output.params },
    output.data
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
export function formatOutputInterface(output: Output<any>) {
  const params: Record<string, string> = {
    type: output.type,
  };

  if (output.required) {
    params.required = "true";
  }

  return xml("output", params, [
    output.description
      ? { tag: "description", children: output.description }
      : null,
    output.instructions
      ? { tag: "instructions", children: output.instructions }
      : null,
    {
      tag: "attributes_schema",
      children: output.attributes
        ? formatSchema(output.attributes, "attributes")
        : {},
    },
    {
      tag: "content_schema",
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
    action.returns
      ? {
          tag: "returns",
          children: formatSchema(action.returns, "returns"),
        }
      : null,
  ]);
}

export function formatContextState(state: ContextState) {
  const { context, key } = state;
  return xml(
    "context",
    { type: context.type, key: key },
    [
      context.description
        ? {
            tag: "description",
            children:
              typeof context.description === "function"
                ? context.description(state)
                : context.description,
          }
        : null,
      context.instructions
        ? {
            tag: "instructions",
            children:
              typeof context.instructions === "function"
                ? context.instructions(state)
                : context.instructions,
          }
        : null,
      {
        tag: "state",
        children: context.render ? context.render(state) : state.memory,
      },
    ].flat()
  );
}

export type Msg =
  | {
      role: "user";
      user: string;
      content: string;
    }
  | {
      role: "assistant";
      content: string;
    };

export function formatMsg(msg: Msg): XMLElement {
  return {
    tag: "msg",
    params:
      msg.role === "user"
        ? {
            role: "user",
            user: msg.user,
          }
        : { role: "assistant" },
    children: msg.content,
  };
}

export function formatContextLog(i: Log) {
  switch (i.ref) {
    case "input":
      return i.formatted ?? formatInput(i);
    case "output":
      return i.formatted ?? formatOutput(i);
    case "thought":
      return xml("reasoning", {}, i.content);
    case "action_call":
      return xml(
        "action_call",
        { id: i.id, name: i.name, timestamp: i.timestamp },
        i.data ?? i.content
      );
    case "action_result":
      return xml(
        "action_result",
        { callId: i.callId, name: i.name, timestamp: i.timestamp },
        i.formatted ?? i.data
      );
    case "event":
      return xml("event", { name: i.name, ...i.params }, i.formatted ?? i.data);
    default:
      throw new Error("invalid context");
  }
}
export function formatContextLog2(i: Log) {
  switch (i.ref) {
    case "input":
      return formatInput(i);
    case "output":
      return formatOutput(i);
    case "thought":
      return xml("reasoning", {}, i.content);
    case "action_call":
      return xml(
        "action_call",
        { id: i.id, name: i.name, timestamp: i.timestamp },
        i.data ?? i.content
      );
    case "action_result":
      return xml(
        "action_result",
        { callId: i.callId, name: i.name, timestamp: i.timestamp },
        i.formatted ?? i.data
      );
    case "event":
      return xml("event", { name: i.name, ...i.params }, i.formatted ?? i.data);
    default:
      throw new Error("invalid context");
  }
}

/**
 * Formats a value for template rendering
 * @param value - The value to format
 * @returns Formatted string representation of the value
 */
export function formatValue(value: any): string {
  if (typeof value !== "string")
    return JSON.stringify(value, (_, value) => {
      if (typeof value === "bigint") return value.toString();
      return value;
    });
  return value.trim();
}

/**
 * Renders a template string by replacing variables with provided values
 * @template Template - The template string type containing variables in {{var}} format
 * @param str - The template string to render
 * @param data - Object containing values for template variables
 * @returns The rendered string with variables replaced
 */
export function render<Template extends string>(
  str: Template,
  data: TemplateVariables<Template>
) {
  return str.trim().replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value: any = data[key as keyof typeof data] ?? "";

    if (typeof value === "object") {
      if (value && "tag" in value) return formatXml(value as XMLElement);
      if (value) formatValue(value);
    }

    if (Array.isArray(value)) {
      return value
        .map((v) => {
          if (typeof v === "object" && v && "tag" in v) {
            return formatXml(v);
          }
          return formatValue(v);
        })
        .join("\n");
    }

    return value ?? "";
  });
}
