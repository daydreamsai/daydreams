import type { z, ZodObject, ZodRawShape } from "zod";
import { type Schema as AISchema } from "ai";

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type MaybePromise<T = any> = T | Promise<T>;

export type Schema = ZodRawShape | z.ZodTypeAny | AISchema | undefined;

export type InferSchema<TSchema extends Schema = Schema> =
  TSchema extends ZodRawShape
    ? z.infer<ZodObject<TSchema>>
    : TSchema extends z.ZodTypeAny
      ? z.infer<TSchema>
      : TSchema extends AISchema
        ? TSchema["_type"]
        : TSchema extends undefined
          ? undefined
          : unknown;

export type Resolver<Result = any, Args extends Array<any> = Array<any>> =
  | Result
  | ((...args: Args) => MaybePromise<Result>);

export type InferResolverResult<TResolver extends Resolver<any, any>> =
  TResolver extends Resolver<infer Result, any> ? Result : never;

export type EventsRecord = Record<string, Schema>;

export type Handler<Params = any, Result = any, Ctx = any> = (
  params: Params,
  ctx: Ctx
) => Result;

export type InferHandlerParams<THandler extends Handler> =
  THandler extends Handler<infer Params> ? Params : never;

export type InferHandlerResult<THandler extends Handler> =
  THandler extends Handler<any, infer Result>
    ? Result extends Promise<infer Value>
      ? Value
      : Result
    : never;

export type Pretty<type> = { [key in keyof type]: type[key] } & unknown;
