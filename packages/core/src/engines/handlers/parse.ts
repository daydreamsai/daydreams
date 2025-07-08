import type { InferSchema, Schema } from "@/types/utils";
import { parseXML } from "@/engines/xml/parser";
import { jsonSchema } from "ai";
import { z, ZodSchema } from "zod";

function isSchemaString<TSchema extends Schema>(schema: TSchema) {
  return schema?._def?.typeName === "ZodString";
}

export function parseJSONContent(content: string) {
  if (content.startsWith("```json")) {
    content = content.slice("```json".length, -3);
  }

  return JSON.parse(content);
}

export function parseXMLContent(content: string) {
  const nodes = parseXML(content, (node) => {
    return node;
  });

  const data = nodes.reduce(
    (data, node) => {
      if (node.type === "element") {
        data[node.name] = node.content;
      }
      return data;
    },
    {} as Record<string, string>
  );

  return data;
}

export function parseSchema<TSchema extends Schema>(
  schema: TSchema,
  data: any
): InferSchema<TSchema> {
  if (schema === undefined) return data;

  const parser =
    "parse" in schema || "validate" in schema
      ? schema
      : "$schema" in schema
        ? jsonSchema(schema)
        : z.object(schema as any);

  return "parse" in parser
    ? (parser as ZodSchema).parse(data)
    : parser.validate && typeof parser.validate === "function"
      ? parser.validate(data)
      : data;
}

export function parseContent<TSchema extends Schema>({
  content,
  schema,
  parser,
}: {
  content: any;
  schema?: TSchema;
  parser?: string | "auto" | "xml" | "json" | "text" | "jsx";
}) {
  if (isSchemaString(schema)) return content;

  if (parser === "json") {
    return parseJSONContent(content);
  } else if (parser === "xml") {
    return parseXMLContent(content);
  }

  return content;
}
