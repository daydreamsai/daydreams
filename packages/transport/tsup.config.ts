import { defineConfig } from "tsup";

import { tsupConfig } from "../../tsup.config";

export default defineConfig({
  ...tsupConfig,
  entry: [
    "./src/types.ts",
    "./src/client.ts",
    "./src/server.ts",
    "./src/http-client.ts",
    "./src/http-server.ts",
  ],
  external: ["@daydreamsai/core"],
});
