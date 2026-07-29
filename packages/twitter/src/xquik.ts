import { SearchMode, type Tweet } from "agent-twitter-client";
import * as z from "zod";
import type { SearchOptions, SearchResult, TweetSearchBackend } from "./search";

export { SearchMode } from "agent-twitter-client";

const xquikMediaSchema = z.object({
  mediaUrl: z.string(),
  type: z.enum(["photo", "video", "animated_gif"]),
  url: z.string(),
  videoVariants: z
    .array(
      z.object({
        bitrate: z.number().int().optional(),
        contentType: z.string(),
        url: z.string(),
      })
    )
    .optional(),
});

const xquikTweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  createdAt: z.string().optional(),
  isReply: z.boolean().optional(),
  isQuoteStatus: z.boolean().optional(),
  inReplyToId: z.string().optional(),
  conversationId: z.string().optional(),
  url: z.string().optional(),
  likeCount: z.number().int().optional(),
  retweetCount: z.number().int().optional(),
  replyCount: z.number().int().optional(),
  viewCount: z.number().int().optional(),
  bookmarkCount: z.number().int().optional(),
  media: z.array(xquikMediaSchema).optional(),
  author: z
    .object({
      id: z.string().optional(),
      username: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
});

const xquikSearchResponseSchema = z.object({
  tweets: z.array(xquikTweetSchema),
  has_next_page: z.boolean(),
  next_cursor: z.string(),
});

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

type XquikMedia = z.infer<typeof xquikMediaSchema>;

export interface XquikSearchClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: FetchLike;
}

function bestVideoUrl(media: XquikMedia): string {
  const variants = media.videoVariants ?? [];
  const bestVariant = variants.reduce<(typeof variants)[number] | undefined>(
    (best, candidate) =>
      best === undefined || (candidate.bitrate ?? 0) > (best.bitrate ?? 0)
        ? candidate
        : best,
    undefined
  );
  return bestVariant?.url ?? media.url;
}

function mapTweet(source: z.infer<typeof xquikTweetSchema>): Tweet {
  const timeParsed = source.createdAt ? new Date(source.createdAt) : undefined;
  const hasValidTimestamp =
    timeParsed !== undefined && !Number.isNaN(timeParsed.valueOf());
  const media = source.media ?? [];

  return {
    id: source.id,
    text: source.text,
    hashtags: [],
    mentions: [],
    photos: media
      .filter((item) => item.type === "photo")
      .map((item, index) => ({
        id: `${source.id}-photo-${index}`,
        url: item.mediaUrl,
        alt_text: undefined,
      })),
    thread: [],
    urls: [],
    videos: media
      .filter((item) => item.type !== "photo")
      .map((item, index) => ({
        id: `${source.id}-video-${index}`,
        preview: item.mediaUrl,
        url: bestVideoUrl(item),
      })),
    bookmarkCount: source.bookmarkCount,
    conversationId: source.conversationId,
    inReplyToStatusId: source.inReplyToId,
    isQuoted: source.isQuoteStatus,
    isReply: source.isReply,
    likes: source.likeCount,
    name: source.author?.name,
    permanentUrl: source.url,
    replies: source.replyCount,
    retweets: source.retweetCount,
    timeParsed: hasValidTimestamp ? timeParsed : undefined,
    timestamp: hasValidTimestamp
      ? Math.floor(timeParsed.valueOf() / 1000)
      : undefined,
    userId: source.author?.id,
    username: source.author?.username,
    views: source.viewCount,
  };
}

function applySearchMode(url: URL, mode: SearchMode): void {
  if (mode === SearchMode.Top) {
    url.searchParams.set("queryType", "Top");
    return;
  }

  url.searchParams.set("queryType", "Latest");
  if (mode === SearchMode.Photos) {
    url.searchParams.set("mediaType", "images");
  } else if (mode === SearchMode.Videos) {
    url.searchParams.set("mediaType", "videos");
  }
}

export class XquikSearchClient implements TweetSearchBackend {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetch: FetchLike;

  constructor(options: XquikSearchClientOptions) {
    if (options.apiKey.trim() === "") {
      throw new Error("XQUIK_API_KEY is required for the Xquik search backend");
    }

    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://xquik.com").replace(/\/+$/, "");
    this.fetch = options.fetch ?? globalThis.fetch;
  }

  async searchTweets(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult<Tweet>> {
    if (query.trim() === "") {
      throw new Error("A search query is required");
    }

    const { maxResults = 20, mode = SearchMode.Latest, cursor } = options;
    const limit = Math.min(200, Math.max(1, Math.trunc(maxResults)));
    const url = new URL("/api/v1/x/tweets/search", this.baseUrl);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", limit.toString());
    applySearchMode(url, mode);
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const response = await this.fetch(url, {
      headers: {
        Accept: "application/json",
        "X-API-Key": this.apiKey,
      },
    });
    if (!response.ok) {
      throw new Error(`Xquik search failed with status ${response.status}`);
    }

    const result = xquikSearchResponseSchema.parse(await response.json());
    return {
      data: result.tweets.map(mapTweet),
      next: result.next_cursor || undefined,
      hasMore: result.has_next_page,
    };
  }
}
