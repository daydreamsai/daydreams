import { tool } from "ai";
import * as z from "zod";
import { createToolSet } from "../utils";
import { createContainer, http } from "@daydreamsai/core";
import { tavily, type TavilyClient } from "@tavily/core";
import { env } from "bun";

const container = createContainer();

container.singleton("tavily", () =>
  tavily({
    apiKey: env.TAVILY_API_KEY!,
  })
);

export type BasicTools = typeof basicTools;

export const basicTools = createToolSet({
  getWeather: tool({
    parameters: z.object({ location: z.string() }),
    description: "get the weather for a location",
    execute: async ({ location }, options) => {
      const geolocation = await http.get.json<{
        results: { latitude: number; longitude: number }[];
      }>("https://geocoding-api.open-meteo.com/v1/search", {
        name: location,
        count: 1,
        language: "en",
        format: "json",
      });
      if (geolocation.results[0]) {
        const res = await http.get.json<{ test: true }>(
          "https://api.open-meteo.com/v1/forecast",
          {
            latitude: geolocation.results[0].latitude,
            longitude: geolocation.results[0].longitude,
            current_weather: "true", // Request current weather data
          }
        );

        return res;
      }

      return "Failed";
    },
  }),
  "tavily.search": tool({
    description: "Execute a search query using Tavily Search.",
    parameters: z.object({
      query: z.string().describe("The search query to execute with Tavily."),
      topic: z
        .enum(["general", "news"])
        .optional()
        .default("general")
        .describe(
          "The category of the search.news is useful for retrieving real-time updates, particularly about politics, sports, and major current events covered by mainstream media sources. general is for broader, more general-purpose searches that may include a wide range of sources."
        ),
      maxResults: z.number().min(1).max(20).default(5).optional(),
      searchDepth: z
        .enum(["basic", "advanced"])
        .default("basic")
        .optional()
        .describe(
          "The depth of the search. advanced search is tailored to retrieve the most relevant sources and content snippets for your query, while basic search provides generic content snippets from each source."
        ),
    }),
    async execute({ query, topic, searchDepth, maxResults }) {
      const response = await container
        .resolve<TavilyClient>("tavily")
        .search(query, {
          searchDepth,
          topic,
          maxResults,
        });

      return {
        results: response.results.map((result) => ({
          title: result.title,
          url: result.url,
          content: result.content,
        })),
        totalResults: response.results.length,
      };
    },
  }),
  "tavily.extract": tool({
    description:
      "Extract web page content from one or more specified URLs using Tavily Extract.",
    parameters: z.object({
      urls: z
        .array(z.string())
        .describe("A list of URLs to extract content from."),

      extractDepth: z
        .enum(["basic", "advanced"])
        .default("basic")
        .optional()
        .describe(
          "The depth of the extraction process. advanced extraction retrieves more data, including tables and embedded content, with higher success but may increase latency.basic extraction costs 1 credit per 5 successful URL extractions, while advanced extraction costs 2 credits per 5 successful URL extractions."
        ),
    }),
    async execute({ urls, extractDepth }) {
      const response = await container
        .resolve<TavilyClient>("tavily")
        .extract(urls, {
          extractDepth,
        });

      return {
        results: response.results.map((result) => ({
          url: result.url,
          content: result.rawContent,
          images: result.images,
        })),
        totalResults: response.results.length,
      };
    },
  }),
});
