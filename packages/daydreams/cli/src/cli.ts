import * as readline from "readline/promises";
import { service, context, input, extension, output } from "@daydreamsai/core";
import * as z from "zod";

export const readlineService = service({
  register(container) {
    container.singleton("readline", () =>
      readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })
    );
  },
});

export const cli = context({
  type: "cli",
  key: ({ user }) => user.toString(),
  maxSteps: 100,
  schema: { user: z.string() },
  inputs: {
    "cli:message": input({
      async subscribe(send, { container }) {
        const rl = container.resolve<readline.Interface>("readline");

        const controller = new AbortController();

        while (!controller.signal.aborted) {
          const question = await rl.question("> ");
          if (question === "exit") {
            break;
          }
          console.log("User:", question);
          send(cli, { user: "admin" }, question);
        }

        return () => {
          controller.abort();
        };
      },
    }),
  },
  outputs: {
    "cli:message": output({
      description: "Send messages to the user",
      instructions: "Use plain text",
      schema: z.string(),
      handler(data) {
        console.log("Agent:", { data });
        return {
          data,
        };
      },
      examples: [
        `<output type="cli:message">Hi, How can I assist you today?</output>`,
      ],
    }),
  },
});

export const cliExtension = extension({
  name: "cli",
  contexts: {
    cli,
  },
  services: [readlineService],
});
