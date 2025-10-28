import * as z from "zod";
import {
  context,
  service,
  extension,
  input,
  output,
  formatXml,
} from "@daydreamsai/core";
import {
  EnhancedTwitterClient,
  type AutoEngageConfig,
} from "./enhanced-client";
import { SearchMode } from "agent-twitter-client";

// Enhanced Twitter contexts
const twitterThreadContext = context({
  type: "twitter-thread",
  key: ({ threadId }) => threadId.toString(),
  schema: z.object({
    threadId: z.string(),
  }),
});

const twitterSearchContext = context({
  type: "twitter-search",
  key: ({ query }) => query,
  schema: z.object({
    query: z.string(),
  }),
});

const twitterUserContext = context({
  type: "twitter-user",
  key: ({ userId }) => userId,
  schema: z.object({
    userId: z.string(),
  }),
});

// Enhanced Twitter service
const enhancedTwitterService = service({
  register(container) {
    container.singleton(
      "enhancedTwitter",
      () =>
        new EnhancedTwitterClient({
          username: process.env.TWITTER_USERNAME!,
          password: process.env.TWITTER_PASSWORD!,
          email: process.env.TWITTER_EMAIL!,
        })
    );
  },
  async boot(container) {
    const twitter = container.resolve<EnhancedTwitterClient>("enhancedTwitter");
    await twitter.initialize();
    console.log("Enhanced Twitter client initialized");
  },
});

export const enhancedTwitter = extension({
  name: "enhanced-twitter",
  services: [enhancedTwitterService],
  contexts: {
    thread: twitterThreadContext,
    search: twitterSearchContext,
    user: twitterUserContext,
  },
  inputs: {
    "twitter:mentions": input({
      schema: z.object({
        userId: z.string(),
        tweetId: z.string(),
        text: z.string(),
        username: z.string(),
        timestamp: z.string(),
      }),
      format: ({ data }) =>
        formatXml({
          tag: "mention",
          params: {
            tweetId: data.tweetId,
            userId: data.userId,
            username: data.username,
            timestamp: data.timestamp,
          },
          children: data.text,
        }),
      subscribe(send, agent) {
        const { container } = agent;
        console.log("🔧 Setting up Twitter mentions monitoring...");

        try {
          const twitter = container.resolve(
            "enhancedTwitter"
          ) as EnhancedTwitterClient;
          console.log("✅ Enhanced Twitter client resolved successfully");

          console.log("⏰ Starting mention check interval (30s)...");
          const interval = setInterval(async () => {
            const startTime = Date.now();
            console.log("🔍 Checking mentions...", new Date().toISOString());

            try {
              const mentions = await twitter.checkMentions();
              const duration = Date.now() - startTime;
              console.log(
                `✅ Mention check completed in ${duration}ms, found ${mentions.length} mentions`
              );

              for (const mention of mentions) {
                send(
                  twitterThreadContext,
                  {
                    threadId:
                      mention.metadata.conversationId ||
                      mention.metadata.tweetId ||
                      "",
                  },
                  {
                    tweetId: mention.metadata.tweetId || "",
                    userId: mention.metadata.userId || "",
                    username: mention.metadata.username || "",
                    text: mention.content,
                    timestamp:
                      mention.metadata.timestamp?.toISOString() ||
                      new Date().toISOString(),
                  }
                );
              }
            } catch (error) {
              const duration = Date.now() - startTime;
              console.error(
                `❌ Error checking mentions after ${duration}ms:`,
                error
              );
            }
          }, 30000); // Check every 30 seconds

          console.log("✅ Mention monitoring interval started");
          return () => {
            console.log("🛑 Stopping mention monitoring interval");
            clearInterval(interval);
          };
        } catch (error) {
          console.error(
            "❌ Failed to set up Twitter mentions monitoring:",
            error
          );
          return () => {}; // Return empty cleanup function
        }
      },
    }),

    "twitter:trending": input({
      schema: z.object({
        trend: z.string(),
        volume: z.number().optional(),
      }),
      format: ({ data }) =>
        formatXml({
          tag: "trending-topic",
          params: { volume: data.volume?.toString() || "unknown" },
          children: data.trend,
        }),
      subscribe(send, agent) {
        const { container } = agent;
        const twitter = container.resolve(
          "enhancedTwitter"
        ) as EnhancedTwitterClient;

        const interval = setInterval(async () => {
          try {
            const trends = await twitter.getTrends();

            for (const trend of trends) {
              send(
                twitterSearchContext,
                { query: trend.query },
                {
                  trend: trend.name,
                  volume: trend.volume,
                }
              );
            }
          } catch (error) {
            console.error("Error fetching trends:", error);
          }
        }, 300000); // Check every 5 minutes

        return () => clearInterval(interval);
      },
    }),

    "twitter:generate-post": input({
      schema: z.object({
        trigger: z.enum(["scheduled", "trending", "random"]),
        context: z.string().optional(),
        mood: z
          .enum([
            "informative",
            "engaging",
            "humorous",
            "professional",
            "casual",
          ])
          .optional(),
        maxLength: z.number().default(280),
      }),
      format: ({ data }) =>
        formatXml({
          tag: "post-prompt",
          params: {
            trigger: data.trigger,
            mood: data.mood || "casual",
            maxLength: data.maxLength.toString(),
          },
          children:
            data.context || "Create an engaging tweet for your audience",
        }),
      subscribe(send, agent) {
        const { container } = agent;
        console.log("🔧 Setting up Twitter post generation...");

        try {
          const twitter = container.resolve(
            "enhancedTwitter"
          ) as EnhancedTwitterClient;
          console.log(
            "✅ Enhanced Twitter client resolved for post generation"
          );

          // Get posting interval from environment (default 2 hours)
          const postIntervalMs =
            parseInt(process.env.TWITTER_POST_INTERVAL_MINUTES || "120") *
            60 *
            1000;
          console.log(
            `⏰ Starting post generation interval (${
              postIntervalMs / 60000
            } minutes)...`
          );

          const interval = setInterval(async () => {
            console.log(
              "✨ Triggering post generation...",
              new Date().toISOString()
            );

            try {
              // Send different types of post prompts
              const triggers = ["scheduled", "random"] as const;
              const moods = [
                "informative",
                "engaging",
                "humorous",
                "professional",
                "casual",
              ] as const;

              const trigger =
                triggers[Math.floor(Math.random() * triggers.length)];
              const mood = moods[Math.floor(Math.random() * moods.length)];

              // Generate context based on current time and trends
              let context = "Create an engaging tweet for your audience";

              try {
                // Try to get current trends for context
                const trends = await twitter.getTrends();
                if (trends.length > 0) {
                  const randomTrend =
                    trends[Math.floor(Math.random() * trends.length)];
                  context = `Create a tweet related to current trends. Consider: ${randomTrend.name}`;
                }
              } catch (error) {
                console.log(
                  "Could not fetch trends for context, using default"
                );
              }

              send(
                twitterThreadContext,
                { threadId: `post-generation-${Date.now()}` },
                {
                  trigger,
                  context,
                  mood,
                  maxLength: 280,
                }
              );

              console.log(
                `✅ Post generation triggered with ${mood} mood and ${trigger} trigger`
              );
            } catch (error) {
              console.error("❌ Error triggering post generation:", error);
            }
          }, postIntervalMs);

          console.log("✅ Post generation interval started");
          return () => {
            console.log("🛑 Stopping post generation interval");
            clearInterval(interval);
          };
        } catch (error) {
          console.error("❌ Failed to set up Twitter post generation:", error);
          return () => {};
        }
      },
    }),
  },

  outputs: {
    "twitter:reply": output({
      schema: z.object({
        content: z.string().max(280),
        inReplyTo: z.string(),
      }),
      description: "Reply to a tweet with enhanced functionality",
      handler: async (data, ctx, { container }) => {
        const twitter =
          container.resolve<EnhancedTwitterClient>("enhancedTwitter");
        const result = await twitter.sendTweet({
          content: data.content,
          inReplyTo: data.inReplyTo,
        });

        return {
          data: {
            ...data,
            tweetId: result.tweetId,
          },
          timestamp: Date.now(),
        };
      },
    }),

    "twitter:tweet": output({
      schema: z.object({
        content: z.string().max(280),
        mediaData: z
          .array(
            z.object({
              data: z.instanceof(Buffer),
              mediaType: z.string(),
            })
          )
          .optional(),
        isLongTweet: z.boolean().optional(),
        poll: z
          .object({
            options: z.array(z.string()),
            durationMinutes: z.number(),
          })
          .optional(),
      }),
      description:
        "Send an enhanced tweet with media, polls, or long-form content",
      handler: async (data, ctx, { container }) => {
        const twitter =
          container.resolve<EnhancedTwitterClient>("enhancedTwitter");
        const result = await twitter.sendEnhancedTweet({
          content: data.content,
          mediaData: data.mediaData,
          isLongTweet: data.isLongTweet,
          poll: data.poll,
        });

        return {
          data: {
            ...data,
            tweetId: result.tweetId,
          },
          timestamp: Date.now(),
        };
      },
    }),

    "twitter:thread": output({
      schema: z.object({
        tweets: z.array(z.string()),
        delay: z.number().optional(),
      }),
      description: "Send a thread of connected tweets",
      handler: async (data, ctx, { container }) => {
        const twitter =
          container.resolve<EnhancedTwitterClient>("enhancedTwitter");
        const results = await twitter.sendThread({
          tweets: data.tweets,
          delay: data.delay,
        });

        return {
          data: {
            ...data,
            results,
          },
          timestamp: Date.now(),
        };
      },
    }),

    "twitter:search": output({
      schema: z.object({
        query: z.string(),
        maxResults: z.number().default(20),
        mode: z.enum(["top", "latest", "photos", "videos"]).default("latest"),
      }),
      description: "Search for tweets with advanced filtering",
      handler: async (data, ctx, { container }) => {
        const twitter =
          container.resolve<EnhancedTwitterClient>("enhancedTwitter");

        const searchMode = {
          top: SearchMode.Top,
          latest: SearchMode.Latest,
          photos: SearchMode.Photos,
          videos: SearchMode.Videos,
        }[data.mode];

        const results = await twitter.searchTweets(data.query, {
          maxResults: data.maxResults,
          mode: searchMode,
        });

        return {
          data: {
            query: data.query,
            results: results.data.map((tweet) => ({
              id: tweet.id,
              text: tweet.text,
              username: tweet.username,
              likes: tweet.likes,
              retweets: tweet.retweets,
              timestamp: tweet.timestamp,
            })),
            hasMore: results.hasMore,
          },
          timestamp: Date.now(),
        };
      },
    }),

    "twitter:like": output({
      schema: z.object({
        tweetId: z.string(),
      }),
      description: "Like a tweet",
      handler: async (data, ctx, { container }) => {
        const twitter =
          container.resolve<EnhancedTwitterClient>("enhancedTwitter");
        const result = await twitter.likeTweet(data.tweetId);

        return {
          data: {
            ...data,
            success: result.success,
            error: result.error,
          },
          timestamp: Date.now(),
        };
      },
    }),

    "twitter:retweet": output({
      schema: z.object({
        tweetId: z.string(),
      }),
      description: "Retweet a tweet",
      handler: async (data, ctx, { container }) => {
        const twitter =
          container.resolve<EnhancedTwitterClient>("enhancedTwitter");
        const result = await twitter.retweet(data.tweetId);

        return {
          data: {
            ...data,
            success: result.success,
            error: result.error,
          },
          timestamp: Date.now(),
        };
      },
    }),

    "twitter:quote": output({
      schema: z.object({
        tweetId: z.string(),
        comment: z.string(),
      }),
      description: "Quote tweet with a comment",
      handler: async (data, ctx, { container }) => {
        const twitter =
          container.resolve<EnhancedTwitterClient>("enhancedTwitter");
        const result = await twitter.quoteTweet(data.tweetId, data.comment);

        return {
          data: {
            ...data,
            success: result.success,
            error: result.error,
          },
          timestamp: Date.now(),
        };
      },
    }),

    "twitter:follow": output({
      schema: z.object({
        username: z.string(),
      }),
      description: "Follow a user",
      handler: async (data, ctx, { container }) => {
        const twitter =
          container.resolve<EnhancedTwitterClient>("enhancedTwitter");
        const result = await twitter.followUser(data.username);

        return {
          data: {
            ...data,
            success: result.success,
            error: result.error,
          },
          timestamp: Date.now(),
        };
      },
    }),

    "twitter:dm": output({
      schema: z.object({
        conversationId: z.string(),
        text: z.string(),
      }),
      description: "Send a direct message",
      handler: async (data, ctx, { container }) => {
        const twitter =
          container.resolve<EnhancedTwitterClient>("enhancedTwitter");
        const result = await twitter.sendDirectMessage(
          data.conversationId,
          data.text
        );

        return {
          data: {
            ...data,
            success: result.success,
            messageId: result.messageId,
            error: result.error,
          },
          timestamp: Date.now(),
        };
      },
    }),

    "twitter:auto-engage": output({
      schema: z.object({
        enabled: z.boolean(),
        keywords: z.array(z.string()),
        excludeKeywords: z.array(z.string()).default([]),
        minLikes: z.number().default(0),
        maxLikes: z.number().default(1000),
        actions: z.object({
          like: z.boolean().default(true),
          retweet: z.boolean().default(false),
          reply: z.boolean().default(false),
        }),
        replyTemplates: z.array(z.string()).default([]),
      }),
      description: "Enable auto-engagement based on keywords and criteria",
      handler: async (data, ctx, { container }) => {
        const twitter =
          container.resolve<EnhancedTwitterClient>("enhancedTwitter");
        const config: AutoEngageConfig = {
          enabled: data.enabled,
          keywords: data.keywords,
          excludeKeywords: data.excludeKeywords,
          minLikes: data.minLikes,
          maxLikes: data.maxLikes,
          actions: data.actions,
          replyTemplates: data.replyTemplates,
        };

        const results = await twitter.autoEngage(config);

        return {
          data: {
            config,
            results: results.map((r) => ({
              action: r.action,
              targetId: r.targetId,
              success: r.success,
              error: r.error,
            })),
          },
          timestamp: Date.now(),
        };
      },
    }),

    "twitter:analytics": output({
      schema: z.object({
        tweetId: z.string(),
      }),
      description: "Get engagement analytics for a tweet",
      handler: async (data, ctx, { container }) => {
        const twitter =
          container.resolve<EnhancedTwitterClient>("enhancedTwitter");
        const metrics = await twitter.getEngagementMetrics(data.tweetId);

        return {
          data: {
            tweetId: data.tweetId,
            metrics,
          },
          timestamp: Date.now(),
        };
      },
    }),
  },
});
