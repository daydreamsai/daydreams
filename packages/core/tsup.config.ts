import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "index": "src/index.ts",
    "extensions/index": "src/extensions/index.ts",
    "extensions/mcp/extension": "src/extensions/mcp/extension.ts",
    "extensions/cli/extension": "src/extensions/cli/extension.ts",
  },
  dts: true,
  format: ["esm"],
  clean: true,
  splitting: true,
  sourcemap: true,
  outDir: "dist",
  external: ["readline/promises", "@tavily/core", "ollama"],
});
