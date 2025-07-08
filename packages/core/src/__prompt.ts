import { ZodType } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import type { Node, ElementNode } from "./engines/xml/parser";
import { parseXML } from "./engines/xml/parser";
import { formatValue } from "./formatters";
import { formatXml } from "./engines/xml/formatters";
import type { JSX } from "react";
import React from "react";

export function formatJsx(v: JSX.Element): string {
  const { children, ...params } = v.props;

  if (v.type === React.Fragment) {
    return children.map((child: any) => formatElement(child)).join("\n");
  }
  return formatXml(
    {
      tag: v.type,
      params,
      children,
    },
    formatElement
  );
}

export function formatElement(v: any): string {
  if (Array.isArray(v)) {
    return v.map(formatElement).join("\n");
  }

  if (typeof v === "object" && v && "type" in v && "props" in v) {
    return formatJsx(v);
  }

  if (typeof v === "object" && v && "tag" in v) {
    return formatXml(v, formatElement);
  }

  return formatValue(v);
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
    const el: any = data[key as keyof typeof data] ?? "";
    return formatElement(el);
  });
}
/**
 * Extracts variable names from a template string
 * @template T - Template string type
 */
export type ExtractTemplateVariables<T extends string> =
  T extends `${infer Start}{{${infer Var}}}${infer Rest}`
    ? Var | ExtractTemplateVariables<Rest>
    : never;

/**
 * Creates a type mapping template variables (including nested paths) to values
 * @template T - Template string type
 * @template V - Value type at the leaf (defaults to string)
 */
export type TemplateVariables<T extends string, V = any> = {
  [K in ExtractTemplateVariables<T>]: any;
};

export type Formatter<
  Variables extends Record<string, any> = Record<string, any>,
  Data = any,
> = (data: Data) => Record<keyof Variables, any>;

export type InferFormatter<TPrompt extends AnyPrompt> =
  TPrompt extends Prompt<infer Data, infer Variables>
    ? Formatter<Variables, Data>
    : never;

export type PromptVisitor<
  Output = any,
  Attributes extends Record<string, any> = Record<string, any>,
> = (
  output: Output,
  node: ElementNode<Attributes>,
  parse: () => Node[]
) => void;

export type GetVisitors<
  Output = any,
  T extends Record<string, Record<string, any>> = Record<
    string,
    Record<string, any>
  >,
> = {
  [K in keyof T]?: PromptVisitor<Output, T[K]>;
} & {
  [key: string]: PromptVisitor<Output, any>;
};

export type Prompt<
  Data = any,
  Variables extends Record<string, any> = Record<string, any>,
> = <TData extends Data>(
  data: TData,
  formatter?: Formatter<Variables, TData>
) => string;

export type AnyPrompt = Prompt<any, any>;

export type InferPromptVariables<TPrompt extends AnyPrompt> =
  TPrompt extends Prompt<any, infer Vars> ? Vars : never;

export type InferPromptData<TPrompt extends AnyPrompt> =
  TPrompt extends Prompt<infer Data> ? Data : never;

export type GeneratePromptConfig<
  TPrompt extends AnyPrompt | string = any,
  Variables extends Record<string, any> = any,
  Data = Record<string, any>,
  TFormatter extends Formatter<Variables, Data> = Formatter<Variables, Data>,
> = {
  template: TPrompt;
  variables: Variables;
  data: Data;
  formatter?: TFormatter;
};

export type InferGeneratePromptConfig<TPrompt extends AnyPrompt | string> =
  | (TPrompt extends Prompt<infer Data, infer Variables>
      ? GeneratePromptConfig<TPrompt, Variables, Data>
      : never)
  | (TPrompt extends string
      ? GeneratePromptConfig<TPrompt, TemplateVariables<TPrompt>>
      : never);

export type InferPromptComponents<TPrompt extends AnyPrompt | string> =
  TPrompt extends Prompt<any, infer Components> ? Components : never;

export function getZodJsonSchema(schema: ZodType<any>) {
  return zodToJsonSchema(schema, "schema").definitions!.schema;
}

export function createPrompt<
  Template extends string = string,
  Variables extends TemplateVariables<Template> = TemplateVariables<Template>,
  Data extends Record<string, any> = Record<string, any>,
>(
  prompt: Template,
  formatter?: Formatter<Variables, Data>
): Prompt<Data, Variables> {
  return (data, customFormatter) => {
    return render(
      prompt,
      customFormatter
        ? customFormatter(data)
        : formatter
          ? formatter(data)
          : data
    );
  };
}

export type Parser<Output> = (content: string) => Output;

export function createParser<
  Output = any,
  Components extends Record<string, Record<string, any>> = Record<
    string,
    Record<string, any>
  >,
  Visitors extends GetVisitors<Output, Components> = GetVisitors<
    Output,
    Components
  >,
>(getOutput: () => Output, visitors: Visitors): Parser<Output> {
  return (content) => {
    const validTags = new Set(Object.keys(visitors));

    // fix for bad outputs;

    content = content
      .split("\n")
      .map((line) => {
        // Check if line starts with '/'
        if (line.startsWith("/")) {
          // Extract the tag name using regex
          const match = line.match(/^\/([^ >]+)/);

          if (match && match[1]) {
            const tagName = match[1];

            // Check if this is a valid tag
            if (validTags.has(tagName)) {
              console.log("fixing line:\n" + line);
              // Replace the leading '/' with '<'
              return line.replace("/", "<");
            }
          }
        }

        // Return original line if no fix needed
        return line;
      })
      .join("\n");

    const state = getOutput();

    parseXML(content, (node, parse) => {
      if (node.type === "element" && node.name in visitors) {
        visitors[node.name](state, node as ElementNode<any>, parse);
      }
      return node;
    });

    return state;
  };
}
