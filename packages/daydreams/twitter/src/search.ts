import {
  Scraper,
  SearchMode,
  type Tweet,
  type Profile,
} from "agent-twitter-client";
import { Logger } from "@daydreamsai/core";
import * as z from "zod";

export interface SearchOptions {
  maxResults?: number;
  mode?: SearchMode;
  includeReplies?: boolean;
  cursor?: string;
}

export interface SearchResult<T> {
  data: T[];
  next?: string;
  previous?: string;
  hasMore: boolean;
}

export interface TrendingTopic {
  name: string;
  query: string;
  volume?: number;
}

export class TwitterSearchService {
  constructor(private scraper: Scraper, private logger: Logger) {}

  /**
   * Search for tweets with advanced filtering
   */
  async searchTweets(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult<Tweet>> {
    try {
      const { maxResults = 20, mode = SearchMode.Latest, cursor } = options;

      this.logger.debug(
        "TwitterSearchService.searchTweets",
        "Searching tweets",
        {
          query,
          maxResults,
          mode,
        }
      );

      const result = await this.scraper.fetchSearchTweets(
        query,
        maxResults,
        mode,
        cursor
      );

      return {
        data: result.tweets,
        next: result.next,
        previous: result.previous,
        hasMore: !!result.next,
      };
    } catch (error) {
      this.logger.error(
        "TwitterSearchService.searchTweets",
        "Error searching tweets",
        {
          error,
          query,
        }
      );
      throw error;
    }
  }

  /**
   * Search for profiles/users
   */
  async searchProfiles(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult<Profile>> {
    try {
      const { maxResults = 20, cursor } = options;

      this.logger.debug(
        "TwitterSearchService.searchProfiles",
        "Searching profiles",
        {
          query,
          maxResults,
        }
      );

      const result = await this.scraper.fetchSearchProfiles(
        query,
        maxResults,
        cursor
      );

      return {
        data: result.profiles,
        next: result.next,
        previous: result.previous,
        hasMore: !!result.next,
      };
    } catch (error) {
      this.logger.error(
        "TwitterSearchService.searchProfiles",
        "Error searching profiles",
        {
          error,
          query,
        }
      );
      throw error;
    }
  }

  /**
   * Search hashtags
   */
  async searchHashtag(
    hashtag: string,
    options: SearchOptions = {}
  ): Promise<SearchResult<Tweet>> {
    const query = hashtag.startsWith("#") ? hashtag : `#${hashtag}`;
    return this.searchTweets(query, options);
  }

  /**
   * Search tweets by location
   */
  async searchByLocation(
    location: string,
    radius: string = "10km",
    options: SearchOptions = {}
  ): Promise<SearchResult<Tweet>> {
    const query = `geocode:${location},${radius}`;
    return this.searchTweets(query, options);
  }

  /**
   * Search tweets with media (photos/videos)
   */
  async searchWithMedia(
    query: string,
    mediaType: "photos" | "videos" = "photos",
    options: SearchOptions = {}
  ): Promise<SearchResult<Tweet>> {
    const mode = mediaType === "photos" ? SearchMode.Photos : SearchMode.Videos;
    return this.searchTweets(query, { ...options, mode });
  }

  /**
   * Get trending topics
   */
  async getTrends(): Promise<TrendingTopic[]> {
    try {
      this.logger.debug(
        "TwitterSearchService.getTrends",
        "Fetching trending topics"
      );

      const trends = await this.scraper.getTrends();
      return trends.map((trend) => ({
        name: trend,
        query: trend,
      }));
    } catch (error) {
      this.logger.error(
        "TwitterSearchService.getTrends",
        "Error fetching trends",
        { error }
      );
      throw error;
    }
  }

  /**
   * Advanced search with multiple filters
   */
  async advancedSearch({
    query,
    from,
    to,
    mentions,
    hashtags,
    since,
    until,
    minReplies,
    minLikes,
    minRetweets,
    ...options
  }: {
    query?: string;
    from?: string;
    to?: string;
    mentions?: string;
    hashtags?: string[];
    since?: string; // YYYY-MM-DD
    until?: string; // YYYY-MM-DD
    minReplies?: number;
    minLikes?: number;
    minRetweets?: number;
  } & SearchOptions): Promise<SearchResult<Tweet>> {
    let searchQuery = query || "";

    if (from) searchQuery += ` from:${from}`;
    if (to) searchQuery += ` to:${to}`;
    if (mentions) searchQuery += ` @${mentions}`;
    if (hashtags?.length)
      searchQuery += ` ${hashtags
        .map((h) => (h.startsWith("#") ? h : `#${h}`))
        .join(" ")}`;
    if (since) searchQuery += ` since:${since}`;
    if (until) searchQuery += ` until:${until}`;
    if (minReplies) searchQuery += ` min_replies:${minReplies}`;
    if (minLikes) searchQuery += ` min_faves:${minLikes}`;
    if (minRetweets) searchQuery += ` min_retweets:${minRetweets}`;

    return this.searchTweets(searchQuery.trim(), options);
  }
}
