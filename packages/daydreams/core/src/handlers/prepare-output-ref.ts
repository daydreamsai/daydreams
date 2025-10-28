import type { Logger } from "../logger";
import type { OutputRef, OutputCtxRef } from "../types";
import { NotFoundError, ParsingError } from "../types";
import z from "zod";

export function prepareOutputRef({
  outputRef,
  outputs,
  logger,
}: {
  outputRef: OutputRef;
  outputs: readonly OutputCtxRef[];
  logger: Logger;
}): { output: OutputCtxRef } {
  const output = outputs.find((output) => output.name === outputRef.name);

  if (!output) {
    const availableOutputs = outputs.map((o) => o.name);
    const errorDetails = {
      error: "OUTPUT_NAME_MISMATCH",
      requestedName: outputRef.name,
      availableNames: availableOutputs,
      outputData: outputRef.data,
      outputId: outputRef.id,
    };

    logger.error(
      "agent:output",
      `Output name '${
        outputRef.name
      }' not found. Available names: ${availableOutputs.join(", ")}`,
      errorDetails
    );

    throw new NotFoundError(outputRef);
  }

  logger.debug("agent:output", outputRef.name, outputRef.data);

  if (output.schema) {
    const schema = (
      "parse" in output.schema ? output.schema : z.object(output.schema)
    ) as z.ZodType | z.ZodString;

    let parsedContent = outputRef.content;

    try {
      if (typeof parsedContent === "string") {
        if (schema.constructor.name !== "ZodString") {
          parsedContent = JSON.parse(parsedContent.trim());
        }
      }

      outputRef.data = schema.parse(parsedContent);
    } catch (error) {
      throw new ParsingError(outputRef, error);
    }
  }

  return { output };
}
