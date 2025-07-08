import type { Action, AnyAction } from "./action";
import type { AnyOutput, Output } from "./components";
import type { AnyTool, Tool } from "./tool";

export type CtxRef = {
  id: string;
  name: string;
};

export type ActionCtxRef = {
  action: AnyAction;
  ctx: CtxRef;
};

export type ToolCtxRef = {
  tool: AnyTool;
  ctx: CtxRef;
};

export type OutputCtxRef = {
  output: AnyOutput;
  ctx: CtxRef;
};
