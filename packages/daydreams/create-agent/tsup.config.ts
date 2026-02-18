import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  banner: ({ format }) => {
    if (format === "esm") {
      return {
        js: "#!/usr/bin/env node",
      };
    }
    return {};
  },
  dts: true,
});
