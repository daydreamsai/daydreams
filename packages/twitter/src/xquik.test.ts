import { SearchMode } from "agent-twitter-client";
import { describe, expect, it } from "vitest";
import { XquikSearchClient } from "./xquik";

const searchResponse = {
  tweets: [
    {
      id: "123",
      text: "A source-backed result",
      createdAt: "2026-07-10T12:00:00Z",
      isReply: false,
      isQuoteStatus: true,
      conversationId: "100",
      url: "https://x.com/example/status/123",
      likeCount: 7,
      retweetCount: 3,
      replyCount: 2,
      viewCount: 50,
      bookmarkCount: 1,
      media: [
        {
          mediaUrl: "https://cdn.example/photo.jpg",
          type: "photo",
          url: "https://x.com/example/status/123/photo/1",
        },
        {
          mediaUrl: "https://cdn.example/video-preview.jpg",
          type: "video",
          url: "https://x.com/example/status/123/video/1",
          videoVariants: [
            {
              bitrate: 256000,
              contentType: "video/mp4",
              url: "https://cdn.example/video-low.mp4",
            },
            {
              bitrate: 832000,
              contentType: "video/mp4",
              url: "https://cdn.example/video-high.mp4",
            },
          ],
        },
      ],
      author: {
        id: "42",
        username: "example",
        name: "Example",
      },
    },
  ],
  has_next_page: true,
  next_cursor: "next-page",
};

describe("XquikSearchClient", () => {
  it("maps Xquik search results to the package Tweet contract", async () => {
    let requestUrl: URL | undefined;
    let requestHeaders: Headers | undefined;
    const client = new XquikSearchClient({
      apiKey: "test-key",
      fetch: async (input, init) => {
        requestUrl = new URL(input.toString());
        requestHeaders = new Headers(init?.headers);
        return new Response(JSON.stringify(searchResponse), { status: 200 });
      },
    });

    const result = await client.searchTweets("agent tools", {
      maxResults: 25,
      mode: SearchMode.Top,
      cursor: "current-page",
    });

    expect(requestUrl?.pathname).toBe("/api/v1/x/tweets/search");
    expect(requestUrl?.searchParams.get("q")).toBe("agent tools");
    expect(requestUrl?.searchParams.get("limit")).toBe("25");
    expect(requestUrl?.searchParams.get("queryType")).toBe("Top");
    expect(requestUrl?.searchParams.get("cursor")).toBe("current-page");
    expect(requestHeaders?.get("X-API-Key")).toBe("test-key");
    expect(result).toEqual({
      data: [
        expect.objectContaining({
          id: "123",
          text: "A source-backed result",
          username: "example",
          userId: "42",
          likes: 7,
          retweets: 3,
          replies: 2,
          views: 50,
          isQuoted: true,
          timestamp: 1783684800,
          photos: [
            {
              id: "123-photo-0",
              url: "https://cdn.example/photo.jpg",
              alt_text: undefined,
            },
          ],
          videos: [
            {
              id: "123-video-0",
              preview: "https://cdn.example/video-preview.jpg",
              url: "https://cdn.example/video-high.mp4",
            },
          ],
        }),
      ],
      next: "next-page",
      hasMore: true,
    });
  });

  it("maps media modes and caps the requested result count", async () => {
    let requestUrl: URL | undefined;
    const client = new XquikSearchClient({
      apiKey: "test-key",
      baseUrl: "https://example.test/",
      fetch: async (input) => {
        requestUrl = new URL(input.toString());
        return new Response(
          JSON.stringify({
            tweets: [],
            has_next_page: false,
            next_cursor: "",
          }),
          { status: 200 }
        );
      },
    });

    await client.searchTweets("launch", {
      maxResults: 500,
      mode: SearchMode.Photos,
    });

    expect(requestUrl?.origin).toBe("https://example.test");
    expect(requestUrl?.searchParams.get("limit")).toBe("200");
    expect(requestUrl?.searchParams.get("mediaType")).toBe("images");
  });

  it("reports HTTP failures without exposing response content", async () => {
    const client = new XquikSearchClient({
      apiKey: "test-key",
      fetch: async () => new Response("private details", { status: 401 }),
    });

    await expect(client.searchTweets("launch")).rejects.toThrow(
      "Xquik search failed with status 401"
    );
  });

  it("requires an API key", () => {
    expect(() => new XquikSearchClient({ apiKey: " " })).toThrow(
      "XQUIK_API_KEY is required for the Xquik search backend"
    );
  });

  it("rejects blank search queries before making a request", async () => {
    let requestCount = 0;
    const client = new XquikSearchClient({
      apiKey: "test-key",
      fetch: async () => {
        requestCount += 1;
        return new Response();
      },
    });

    await expect(client.searchTweets("  ")).rejects.toThrow(
      "A search query is required"
    );
    expect(requestCount).toBe(0);
  });
});
