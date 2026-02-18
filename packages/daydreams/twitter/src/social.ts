import { Scraper, type Tweet, type Profile } from "agent-twitter-client";
import { Logger } from "@daydreamsai/core";

export interface EngagementMetrics {
  likes: number;
  retweets: number;
  replies: number;
  views?: number;
  bookmarks?: number;
}

export interface FollowStats {
  following: number;
  followers: number;
  ratio: number;
}

export interface InteractionResult {
  success: boolean;
  action: string;
  targetId: string;
  timestamp: number;
  error?: string;
}

export class TwitterSocialService {
  constructor(private scraper: Scraper, private logger: Logger) {}

  /**
   * Like a tweet
   */
  async likeTweet(tweetId: string): Promise<InteractionResult> {
    try {
      this.logger.debug("TwitterSocialService.likeTweet", "Liking tweet", {
        tweetId,
      });

      await this.scraper.likeTweet(tweetId);

      return {
        success: true,
        action: "like",
        targetId: tweetId,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(
        "TwitterSocialService.likeTweet",
        "Error liking tweet",
        {
          error,
          tweetId,
        }
      );

      return {
        success: false,
        action: "like",
        targetId: tweetId,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Retweet a tweet
   */
  async retweet(tweetId: string): Promise<InteractionResult> {
    try {
      this.logger.debug("TwitterSocialService.retweet", "Retweeting", {
        tweetId,
      });

      await this.scraper.retweet(tweetId);

      return {
        success: true,
        action: "retweet",
        targetId: tweetId,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error("TwitterSocialService.retweet", "Error retweeting", {
        error,
        tweetId,
      });

      return {
        success: false,
        action: "retweet",
        targetId: tweetId,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Quote tweet with comment
   */
  async quoteTweet(
    tweetId: string,
    comment: string,
    mediaData?: { data: Buffer; mediaType: string }[]
  ): Promise<InteractionResult> {
    try {
      this.logger.debug("TwitterSocialService.quoteTweet", "Quote tweeting", {
        tweetId,
        comment: comment.substring(0, 50) + "...",
      });

      await this.scraper.sendQuoteTweet(
        comment,
        tweetId,
        mediaData ? { mediaData } : undefined
      );

      return {
        success: true,
        action: "quote_tweet",
        targetId: tweetId,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(
        "TwitterSocialService.quoteTweet",
        "Error quote tweeting",
        {
          error,
          tweetId,
        }
      );

      return {
        success: false,
        action: "quote_tweet",
        targetId: tweetId,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Follow a user
   */
  async followUser(username: string): Promise<InteractionResult> {
    try {
      this.logger.debug("TwitterSocialService.followUser", "Following user", {
        username,
      });

      await this.scraper.followUser(username);

      return {
        success: true,
        action: "follow",
        targetId: username,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(
        "TwitterSocialService.followUser",
        "Error following user",
        {
          error,
          username,
        }
      );

      return {
        success: false,
        action: "follow",
        targetId: username,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get user's followers
   */
  async getFollowers(
    userId: string,
    maxCount: number = 100
  ): Promise<Profile[]> {
    try {
      this.logger.debug(
        "TwitterSocialService.getFollowers",
        "Getting followers",
        {
          userId,
          maxCount,
        }
      );

      const followers: Profile[] = [];
      for await (const follower of this.scraper.getFollowers(
        userId,
        maxCount
      )) {
        followers.push(follower);
      }

      return followers;
    } catch (error) {
      this.logger.error(
        "TwitterSocialService.getFollowers",
        "Error getting followers",
        {
          error,
          userId,
        }
      );
      throw error;
    }
  }

  /**
   * Get users that someone is following
   */
  async getFollowing(
    userId: string,
    maxCount: number = 100
  ): Promise<Profile[]> {
    try {
      this.logger.debug(
        "TwitterSocialService.getFollowing",
        "Getting following",
        {
          userId,
          maxCount,
        }
      );

      const following: Profile[] = [];
      for await (const followedUser of this.scraper.getFollowing(
        userId,
        maxCount
      )) {
        following.push(followedUser);
      }

      return following;
    } catch (error) {
      this.logger.error(
        "TwitterSocialService.getFollowing",
        "Error getting following",
        {
          error,
          userId,
        }
      );
      throw error;
    }
  }

  /**
   * Calculate engagement metrics for a tweet
   */
  calculateEngagement(
    tweet: Tweet
  ): EngagementMetrics & { engagementRate: number } {
    const likes = tweet.likes || 0;
    const retweets = tweet.retweets || 0;
    const replies = tweet.replies || 0;
    const views = tweet.views || 0;

    const totalEngagement = likes + retweets + replies;
    const engagementRate = views > 0 ? (totalEngagement / views) * 100 : 0;

    return {
      likes,
      retweets,
      replies,
      views,
      bookmarks: tweet.bookmarkCount || 0,
      engagementRate,
    };
  }

  /**
   * Get follow statistics for a user
   */
  async getFollowStats(userId: string): Promise<FollowStats> {
    try {
      const profile = await this.scraper.getProfile(userId);

      const following = profile.followingCount || 0;
      const followers = profile.followersCount || 0;
      const ratio = followers > 0 ? following / followers : 0;

      return {
        following,
        followers,
        ratio,
      };
    } catch (error) {
      this.logger.error(
        "TwitterSocialService.getFollowStats",
        "Error getting follow stats",
        {
          error,
          userId,
        }
      );
      throw error;
    }
  }

  /**
   * Bulk engagement - like and retweet if conditions met
   */
  async smartEngage(
    tweet: Tweet,
    options: {
      shouldLike?: (tweet: Tweet) => boolean;
      shouldRetweet?: (tweet: Tweet) => boolean;
      shouldReply?: (tweet: Tweet) => string | null;
    }
  ): Promise<InteractionResult[]> {
    const results: InteractionResult[] = [];

    if (options.shouldLike?.(tweet)) {
      results.push(await this.likeTweet(tweet.id!));
    }

    if (options.shouldRetweet?.(tweet)) {
      results.push(await this.retweet(tweet.id!));
    }

    const replyText = options.shouldReply?.(tweet);
    if (replyText) {
      // This would need the reply functionality from the main client
      // results.push(await this.reply(tweet.id!, replyText));
    }

    return results;
  }

  /**
   * Check if we should engage with a tweet based on various factors
   */
  shouldEngageWith(
    tweet: Tweet,
    criteria: {
      minLikes?: number;
      maxLikes?: number;
      minFollowers?: number;
      excludeRetweets?: boolean;
      includeKeywords?: string[];
      excludeKeywords?: string[];
    }
  ): boolean {
    const {
      minLikes = 0,
      maxLikes = Infinity,
      excludeRetweets = true,
      includeKeywords = [],
      excludeKeywords = [],
    } = criteria;

    // Skip retweets if specified
    if (excludeRetweets && tweet.isRetweet) {
      return false;
    }

    // Check like count
    const likes = tweet.likes || 0;
    if (likes < minLikes || likes > maxLikes) {
      return false;
    }

    // Check keywords
    const text = (tweet.text || "").toLowerCase();

    if (includeKeywords.length > 0) {
      const hasIncludeKeyword = includeKeywords.some((keyword) =>
        text.includes(keyword.toLowerCase())
      );
      if (!hasIncludeKeyword) return false;
    }

    if (excludeKeywords.length > 0) {
      const hasExcludeKeyword = excludeKeywords.some((keyword) =>
        text.includes(keyword.toLowerCase())
      );
      if (hasExcludeKeyword) return false;
    }

    return true;
  }
}
