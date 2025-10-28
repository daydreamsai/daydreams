import { generateFiles } from "fumadocs-openapi";
void generateFiles({
  // the OpenAPI schema, you can also give it an external URL.
  input: ["https://api-beta.daydreams.systems/openapi.json"],
  output: "./content/docs/router",
  // we recommend to enable it
  // make sure your endpoint description doesn't break MDX syntax.
  includeDescription: true,
});
