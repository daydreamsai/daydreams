import { browserAutomationAction } from "./browser-action";
import path from "path";

async function testBrowserAction() {
  try {
    console.log("Starting browser automation test...");

    // Test search task
    const result = await browserAutomationAction.handler(
      {
        ref: "action_call",
        id: "test-1",
        name: "Search Browser",
        content: "",
        timestamp: Date.now(),
        data: {
          task: "Get the latest news from the google news",
          file_path: "test-search-result.md",
          search_directory: "./",
          timeout: 6000000
        }
      },
      {
        memory: {
          workingDirectory: process.cwd(),
          search_result: null,
          task: "",
          file_path: ""
        }
      } as any,
      {} as any
    );

    console.log("Test completed!");
    console.log("Result:", result);

    if (result.success) {
      console.log("Search result content:");
      console.log(result.result);
    } else {
      console.error("Error:", result.error);
    }

  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run test
testBrowserAction().catch(console.error); 