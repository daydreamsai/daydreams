import { defineConfig } from "tsup";

export default defineConfig({
  target: "esnext",
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  terserOptions: {
    // Ensure the options are compatible with the specified terser version
    format: {
      comments: false,
    },
    compress: {
      drop_console: true,
    },
  },
  entry: ["./src/index.ts"],
});
