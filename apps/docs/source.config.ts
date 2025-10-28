import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import { remarkAutoTypeTable, createGenerator } from "fumadocs-typescript";
import { transformerTwoslash } from "fumadocs-twoslash";
import { createFileSystemTypesCache } from "fumadocs-twoslash/cache-fs";
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";

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
    // rehypeCodeOptions: {
    //   themes: {
    //     light: "github-light",
    //     dark: "github-dark",
    //   },
    //   transformers: [
    //     ...(rehypeCodeDefaultOptions.transformers ?? []),
    //     transformerTwoslash({
    //       typesCache: createFileSystemTypesCache(),
    //     }),
    //   ],
    // },
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
