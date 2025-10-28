import { defineConfig } from "tsup";

import { tsupConfig } from "../../tsup.config";

export default defineConfig({
  ...tsupConfig,
  dts: true,
  entry: ["./src/index.ts"],
  external: ["readline/promises"],
});
