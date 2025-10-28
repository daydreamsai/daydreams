import {
  Scraper,
  SearchMode,
  type Tweet,
  type Profile,
} from "agent-twitter-client";
import { Logger, LogLevel } from "@daydreamsai/core";
import * as z from "zod";
import { TwitterClient, type TwitterCredentials, type TweetData } from "./io";
import {
  TwitterSearchService,
  type SearchOptions,
  type SearchResult,
} from "./search";
import {
  TwitterSocialService,
  type InteractionResult,
  type EngagementMetrics,
} from "./social";
import {
  TwitterMessagesService,
  type DMConversation,
  type SendDMResult,
} from "./messages";

const enhancedEnvSchema = z.object({
  TWITTER_USERNAME: z.string(),
  TWITTER_PASSWORD: z.string(),
  TWITTER_EMAIL: z.string(),
  DRY_RUN: z
    .preprocess((val) => val === "1" || val === "true", z.boolean())
    .default(true),
  TWITTER_AUTO_ENGAGE: z
    .preprocess((val) => val === "1" || val === "true", z.boolean())
    .default(false),
  TWITTER_RATE_LIMIT_DELAY: z.number().default(1000),
});

export interface MediaData {
  data: Buffer;
  mediaType: string;
}

export interface EnhancedTweetData extends TweetData {
  mediaData?: MediaData[];
  scheduledAt?: Date;
  isLongTweet?: boolean;
  poll?: {
    options: string[];
    durationMinutes: number;
  };
}

export interface TweetThread {
  tweets: string[];
  mediaData?: MediaData[][];
  delay?: number; // seconds between tweets
}

export interface AutoEngageConfig {
  enabled: boolean;
  keywords: string[];
  excludeKeywords: string[];
  minLikes: number;
  maxLikes: number;
  actions: {
    like: boolean;
    retweet: boolean;
    reply: boolean;
  };
  replyTemplates: string[];
}

export class EnhancedTwitterClient extends TwitterClient {
  private searchService: TwitterSearchService;
  private socialService: TwitterSocialService;
  private messagesService: TwitterMessagesService;
  private enhancedEnv: z.infer<typeof enhancedEnvSchema>;
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private processing = false;

  constructor(
    credentials: TwitterCredentials,
    logLevel: LogLevel = LogLevel.INFO
  ) {
    super(credentials, logLevel);

    // Initialize services with access to the scraper
    this.searchService = new TwitterSearchService(
      this.getScraper(),
      this.getLogger()
    );
    this.socialService = new TwitterSocialService(
      this.getScraper(),
      this.getLogger()
    );
    this.messagesService = new TwitterMessagesService(
      this.getScraper(),
      this.getLogger()
    );

    this.enhancedEnv = enhancedEnvSchema.parse(process.env);
  }

  // Access scraper from parent class
  private getScraper(): Scraper {
    return (this as any).scraper as Scraper;
  }

  private getLogger(): Logger {
    return (this as any).logger as Logger;
  }

  /**
   * Rate-limited execution
   */
  private async rateLimitedExecute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.rateLimitQueue.length === 0) return;

    this.processing = true;

    while (this.rateLimitQueue.length > 0) {
      const fn = this.rateLimitQueue.shift()!;
      await fn();
      await this.delay(this.enhancedEnv.TWITTER_RATE_LIMIT_DELAY);
    }

    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Enhanced tweet sending with media and advanced options
   */
  async sendEnhancedTweet(data: EnhancedTweetData) {
    return this.rateLimitedExecute(async () => {
      try {
        this.getLogger().info(
          "EnhancedTwitterClient.sendEnhancedTweet",
          "Sending enhanced tweet",
          {
            hasMedia: !!data.mediaData?.length,
            isLongTweet: data.isLongTweet,
            hasPoll: !!data.poll,
          }
        );

        if (this.enhancedEnv.DRY_RUN) {
          return {
            success: true,
            tweetId: "DRY_RUN_TWEET_ID",
            type: "enhanced_tweet",
          };
        }

        let result: any;

        if (data.isLongTweet) {
          result = await this.getScraper().sendLongTweet(
            data.content,
            data.inReplyTo,
            data.mediaData
          );
        } else if (data.poll) {
          result = await this.getScraper().sendTweetV2(
            data.content,
            data.inReplyTo,
            {
              poll: {
                options: data.poll.options.map((option) => ({ label: option })),
                duration_minutes: data.poll.durationMinutes,
              },
            }
          );
        } else {
          result = await this.getScraper().sendTweet(
            data.content,
            data.inReplyTo,
            data.mediaData
          );
        }

        return {
          success: true,
          tweetId:
            typeof result === "object" && result?.id ? result.id : "unknown",
          type: "enhanced_tweet",
        };
      } catch (error) {
        this.getLogger().error(
          "EnhancedTwitterClient.sendEnhancedTweet",
          "Error sending enhanced tweet",
          {
            error,
          }
        );
        throw error;
      }
    });
  }

  /**
   * Send a thread of tweets
   */
  async sendThread(thread: TweetThread) {
    const results = [];
    let previousTweetId: string | undefined;

    for (let i = 0; i < thread.tweets.length; i++) {
      const tweetData: EnhancedTweetData = {
        content: thread.tweets[i],
        inReplyTo: previousTweetId,
        mediaData: thread.mediaData?.[i],
      };

      const result = await this.sendEnhancedTweet(tweetData);
      results.push(result);

      if (result.success) {
        previousTweetId = result.tweetId;
      }

      // Delay between tweets if specified
      if (thread.delay && i < thread.tweets.length - 1) {
        await this.delay(thread.delay * 1000);
      }
    }

    return results;
  }

  /**
   * Search functionality
   */
  async searchTweets(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult<Tweet>> {
    return this.rateLimitedExecute(() =>
      this.searchService.searchTweets(query, options)
    );
  }

  async searchProfiles(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult<Profile>> {
    return this.rateLimitedExecute(() =>
      this.searchService.searchProfiles(query, options)
    );
  }

  async getTrends() {
    return this.rateLimitedExecute(() => this.searchService.getTrends());
  }

  async advancedSearch(params: any) {
    return this.rateLimitedExecute(() =>
      this.searchService.advancedSearch(params)
    );
  }

  /**
   * Social interactions
   */
  async likeTweet(tweetId: string): Promise<InteractionResult> {
    return this.rateLimitedExecute(() => this.socialService.likeTweet(tweetId));
  }

  async retweet(tweetId: string): Promise<InteractionResult> {
    return this.rateLimitedExecute(() => this.socialService.retweet(tweetId));
  }

  async quoteTweet(
    tweetId: string,
    comment: string,
    mediaData?: MediaData[]
  ): Promise<InteractionResult> {
    return this.rateLimitedExecute(() =>
      this.socialService.quoteTweet(tweetId, comment, mediaData)
    );
  }

  async followUser(username: string): Promise<InteractionResult> {
    return this.rateLimitedExecute(() =>
      this.socialService.followUser(username)
    );
  }

  async getFollowers(userId: string, maxCount?: number): Promise<Profile[]> {
    return this.rateLimitedExecute(() =>
      this.socialService.getFollowers(userId, maxCount)
    );
  }

  async getFollowing(userId: string, maxCount?: number): Promise<Profile[]> {
    return this.rateLimitedExecute(() =>
      this.socialService.getFollowing(userId, maxCount)
    );
  }

  /**
   * Direct messages
   */
  async getDMConversations(userId: string, cursor?: string) {
    return this.rateLimitedExecute(() =>
      this.messagesService.getConversations(userId, cursor)
    );
  }

  async sendDirectMessage(
    conversationId: string,
    text: string
  ): Promise<SendDMResult> {
    return this.rateLimitedExecute(() =>
      this.messagesService.sendDirectMessage(conversationId, text)
    );
  }

  /**
   * Auto-engagement based on configuration
   */
  async autoEngage(config: AutoEngageConfig) {
    if (!config.enabled) return [];

    try {
      this.getLogger().info(
        "EnhancedTwitterClient.autoEngage",
        "Starting auto-engagement",
        {
          keywords: config.keywords,
          actions: config.actions,
        }
      );

      // Search for tweets with specified keywords
      const searchResults = await this.searchTweets(
        config.keywords.join(" OR "),
        { maxResults: 20, mode: SearchMode.Latest }
      );

      const results: InteractionResult[] = [];

      for (const tweet of searchResults.data) {
        const shouldEngage = this.socialService.shouldEngageWith(tweet, {
          minLikes: config.minLikes,
          maxLikes: config.maxLikes,
          excludeKeywords: config.excludeKeywords,
          includeKeywords: config.keywords,
        });

        if (shouldEngage) {
          const engagementResults = await this.socialService.smartEngage(
            tweet,
            {
              shouldLike: () => config.actions.like,
              shouldRetweet: () => config.actions.retweet,
              shouldReply: (tweet) => {
                if (config.actions.reply && config.replyTemplates.length > 0) {
                  return config.replyTemplates[
                    Math.floor(Math.random() * config.replyTemplates.length)
                  ];
                }
                return null;
              },
            }
          );

          results.push(...engagementResults);
        }
      }

      return results;
    } catch (error) {
      this.getLogger().error(
        "EnhancedTwitterClient.autoEngage",
        "Error in auto-engagement",
        {
          error,
        }
      );
      throw error;
    }
  }

  /**
   * Analytics and monitoring
   */
  async getEngagementMetrics(
    tweetId: string
  ): Promise<EngagementMetrics & { engagementRate: number }> {
    const tweet = await this.getScraper().getTweet(tweetId);
    if (!tweet) {
      throw new Error(`Tweet ${tweetId} not found`);
    }
    return this.socialService.calculateEngagement(tweet);
  }

  /**
   * Bulk operations
   */
  async bulkFollow(usernames: string[]): Promise<InteractionResult[]> {
    const results: InteractionResult[] = [];

    for (const username of usernames) {
      try {
        const result = await this.followUser(username);
        results.push(result);

        // Add delay between follows to avoid rate limiting
        await this.delay(2000);
      } catch (error) {
        results.push({
          success: false,
          action: "follow",
          targetId: username,
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Conversation management
   */
  async manageConversation(
    tweetId: string,
    options: {
      autoReply?: boolean;
      replyTemplate?: string;
      moderateReplies?: boolean;
      blockSpam?: boolean;
    }
  ) {
    // This would implement conversation management features
    // For now, it's a placeholder for future implementation
    this.getLogger().info(
      "EnhancedTwitterClient.manageConversation",
      "Managing conversation",
      {
        tweetId,
        options,
      }
    );
  }
}
