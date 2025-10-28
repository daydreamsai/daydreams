import { defineConfig } from "tsup";

import { tsupConfig } from "../../tsup.config";

export default defineConfig({
  ...tsupConfig,
  entry: ["./src/index.ts", "src/extensions/index.ts"],
  dts: true,
  external: ["readline/promises", "@tavily/core", "ollama"],
});
