import { z } from "zod";
import { extension, input, context } from "../index";

/**
 * Context for the recurring task
 */
const recurringTaskContext = context({
  type: "recurring-task",
  key: ({ id }) => id,
  schema: z.object({ id: z.string() }),
});

/**
 * Extension that adds a recurring task capability to the agent
 * This allows the agent to be triggered on a schedule
 */
export const recurringTask = extension({
  name: "recurring-task",
  contexts: {
    recurringTask: recurringTaskContext,
  },
  inputs: {
    "recurring:trigger": input({
      schema: z.object({
        timestamp: z.number(),
      }),
      format: ({ timestamp }) =>
        `Recurring task triggered at ${new Date(timestamp).toISOString()}`,
      // Subscribe to timer events
      async subscribe(send) {
        const intervalMs = 5 * 60 * 1000; // 5 minutes in milliseconds
        console.log(
          `Setting up recurring task to run every ${intervalMs / 1000} seconds`
        );

        // Create interval to trigger the agent every 5 minutes
        const intervalId = setInterval(() => {
          console.log(
            `Triggering recurring task at ${new Date().toISOString()}`
          );

          // Send input to the agent with the current timestamp
          send(
            recurringTaskContext,
            { id: "game" }, // Use the same ID as in the .start() call
            {
              timestamp: Date.now(),
            }
          );
        }, intervalMs);

        // Return cleanup function
        return () => {
          clearInterval(intervalId);
        };
      },
    }),
  },
});
