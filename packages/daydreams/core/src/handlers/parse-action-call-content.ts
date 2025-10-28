import type { ActionCall, AnyAction } from "../types";
import { parseJSONContent, parseXMLContent } from "../utils";
import { ParsingError } from "../types";

export function parseActionCallContent({
  call,
  action,
}: {
  call: ActionCall;
  action: AnyAction;
}) {
  try {
    const content = call.content.trim();

    let data: unknown;

    if (action.parser) {
      data = action.parser(call);
    } else if (action.schema && action.schema?._def?.typeName !== "ZodString") {
      if (action.callFormat === "xml") {
        data = parseXMLContent(content);
      } else {
        data = parseJSONContent(content);
      }
    } else {
      data = content;
    }

    return data;
  } catch (error) {
    throw new ParsingError(call, error);
  }
}
