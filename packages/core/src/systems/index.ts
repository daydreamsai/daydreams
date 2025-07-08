import type { Engine } from "@/types/engine";
import type { System, SystemHandler } from "@/types/system";
import type {
  handleActionCall,
  parseActionCallContent,
  prepareAction,
  prepareActionCall,
  prepareActions,
  resolveActionCall,
} from "@/engines/handlers/action";
import {} from "@/utils";
import type { handleInput, resolveInput } from "@/engines/handlers/input";
import type {
  handleOutput,
  prepareOutput,
  prepareOutputMemory,
  prepareOutputs,
  resolveOutput,
} from "@/engines/handlers/output";
import type { prepareContexts } from "@/engines/handlers/context";
import type { Handler, Schema } from "@/types/utils";

type InferSystemHandler<T> =
  T extends SystemHandler<any, infer THandler> ? THandler : never;
interface SystemHandlers<Ctx = any> {
  // parsers
  // parseJSONContent
  // parseXMLContent
  // parseSchema
  // parseActionCallContent

  // prepareContext: SystemHandler<typeof prepareContext, Ctx>;

  parseActionCallContent: SystemHandler<Ctx, typeof parseActionCallContent>;

  // handlers
  handleActionCall: SystemHandler<Ctx, typeof handleActionCall>;
  handleInput: SystemHandler<Ctx, typeof handleInput>;
  handleOutput: SystemHandler<Ctx, typeof handleOutput>;

  // resolvers
  resolveInput: SystemHandler<Ctx, typeof resolveInput>;
  resolveOutput: SystemHandler<Ctx, typeof resolveOutput>;
  resolveActionCall: SystemHandler<Ctx, typeof resolveActionCall>;

  // prepare
  prepareActionCall: SystemHandler<Ctx, typeof prepareActionCall>;

  run: SystemHandler<Ctx, Engine["run"]>;
  prepareRun: SystemHandler<Ctx, Engine["prepareRun"]>;
  // prepareStep: SystemHandler<Ctx, Engine["prepareStep"]>;

  prepareOutput: SystemHandler<Ctx, typeof prepareOutput>;
  prepareOutputLog: SystemHandler<Ctx, typeof prepareOutputMemory>;

  prepareContextActions: SystemHandler<Ctx, typeof prepareActions>;
  prepareContextOutputs: SystemHandler<Ctx, typeof prepareOutputs>;

  prepareAction: SystemHandler<Ctx, typeof prepareAction>;
  prepareContexts: SystemHandler<Ctx, typeof prepareContexts>;
}

export function system<
  TSchema extends Schema = Schema,
  TMemory = any,
  Deps = any,
  Modules extends Record<string, Record<string, Handler>> = Record<
    string,
    Record<string, Handler>
  >,
>(system: System<TSchema, TMemory, Deps, Modules>) {
  return system;
}
