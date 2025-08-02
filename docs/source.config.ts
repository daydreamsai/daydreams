import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import { remarkAutoTypeTable, createGenerator } from "fumadocs-typescript";

// Create TypeScript generator for inline type documentation
const generator = createGenerator({
  // Point to the packages for type resolution
  basePath: "../packages",
  // Configure which packages to include
});

export const docs = defineDocs({
  dir: "content/docs",
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      // Enable automatic type table generation
      [
        remarkAutoTypeTable,
        {
          generator,
          // Configure how types are displayed
          options: {
            // Show source file links
            showSources: true,
            // Group related types together
            groupByModule: true,
            // Show inheritance relationships
            showInheritance: true,
          },
        },
      ],
    ],
    // Additional MDX processing options
    development: process.env.NODE_ENV === "development",
  },
});
