import type { Tool } from "ai";
import { type RouterTypes } from "bun";

export type ToolSet = Record<string, Tool<any, any>>;

export function createToolSet<Tools extends ToolSet>(tools: {
  [K in keyof Tools]: Tools[K];
}) {
  return tools;
}

export function api<
  R extends { [K in keyof R]: RouterTypes.RouteValue<K & string> },
>(r: R | (() => R)) {
  return typeof r === "function" ? r() : r;
}
