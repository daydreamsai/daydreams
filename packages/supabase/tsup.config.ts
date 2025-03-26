import { defineConfig } from "tsup";

import { tsupConfig } from "../../tsup.config";

export default defineConfig({
  ...tsupConfig,
  entry: ["./src/index.ts"],
  dts: true,
});
