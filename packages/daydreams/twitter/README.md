# Enhanced Twitter Client for Daydreams AI

A comprehensive Twitter client package that provides robust Twitter
functionality for AI agents, including advanced search, social interactions,
direct messaging, analytics, and automated engagement features.

## Features

### 🔍 **Search & Discovery**

- Advanced tweet search with filters
- Profile/user search
- Hashtag tracking
- Location-based search
- Media-specific search (photos/videos)
- Trending topics monitoring
- Multi-criteria search queries

### 🤝 **Social Interactions**

- Like tweets
- Retweet content
- Quote tweets with comments
- Follow/unfollow users
- Get followers and following lists
- Engagement rate calculations
- Smart engagement based on criteria

### 💬 **Direct Messages**

- Send and receive DMs
- Conversation management
- Auto-reply functionality
- Search conversations
- Unread message tracking

### 📊 **Analytics & Monitoring**

- Engagement metrics (likes, retweets, replies, views)
- Follower statistics
- Tweet performance analysis
- Real-time mention monitoring
- Trending topic tracking

### 🤖 **Automation Features**

- Auto-engagement based on keywords
- **Proactive post generation** with smart timing
- **Dynamic content creation** using trending topics
- **Mood-based posting** (informative, engaging, humorous, etc.)
- Scheduled tweet threads
- Bulk operations (follow, like, etc.)
- Rate limiting and queue management
- Conversation moderation

### 🎯 **Advanced Tweet Features**

- Long-form tweets (Note Tweets)
- Polls and interactive content
- Media attachments
- Tweet threads
- Reply management

## Installation

```bash
npm install @daydreamsai/twitter
```

## Environment Variables

```env
TWITTER_USERNAME=your_username
TWITTER_PASSWORD=your_password
TWITTER_EMAIL=your_email
DRY_RUN=true  # Set to false for production
TWITTER_AUTO_ENGAGE=false
TWITTER_RATE_LIMIT_DELAY=1000  # milliseconds
TWITTER_POST_INTERVAL_MINUTES=120  # How often to generate new posts (default: 2 hours)
```

## Quick Start

### Basic Usage

```typescript
import { EnhancedTwitterClient } from "@daydreamsai/twitter";

const client = new EnhancedTwitterClient({
  username: process.env.TWITTER_USERNAME!,
  password: process.env.TWITTER_PASSWORD!,
  email: process.env.TWITTER_EMAIL!,
});

await client.initialize();

// Send a tweet
await client.sendEnhancedTweet({
  content: "Hello from Daydreams AI! 🤖",
  isLongTweet: false,
});

// Search for tweets
const results = await client.searchTweets("AI agents", {
  maxResults: 10,
  mode: SearchMode.Latest,
});

// Auto-engage with relevant content
await client.autoEngage({
  enabled: true,
  keywords: ["AI", "automation", "bots"],
  excludeKeywords: ["spam"],
  minLikes: 5,
  maxLikes: 1000,
  actions: {
    like: true,
    retweet: false,
    reply: true,
  },
  replyTemplates: [
    "Great point about AI!",
    "Interesting perspective 🤔",
    "Thanks for sharing!",
  ],
});
```

### Daydreams Extension Usage

```typescript
import { enhancedTwitter } from "@daydreamsai/twitter";

// Use in your agent configuration
const agent = createAgent({
  extensions: [enhancedTwitter],
  // ... other config
});
```

## API Reference

### Core Classes

#### `EnhancedTwitterClient`

Main client class that provides all Twitter functionality.

**Methods:**

- `initialize()` - Initialize the client and authenticate
- `sendEnhancedTweet(data)` - Send tweets with advanced features
- `sendThread(thread)` - Send a thread of connected tweets
- `searchTweets(query, options)` - Search for tweets
- `searchProfiles(query, options)` - Search for users
- `likeTweet(tweetId)` - Like a specific tweet
- `retweet(tweetId)` - Retweet content
- `quoteTweet(tweetId, comment)` - Quote tweet with comment
- `followUser(username)` - Follow a user
- `getFollowers(userId)` - Get user's followers
- `getFollowing(userId)` - Get who user follows
- `sendDirectMessage(conversationId, text)` - Send a DM
- `autoEngage(config)` - Automated engagement
- `getEngagementMetrics(tweetId)` - Get tweet analytics

#### `TwitterSearchService`

Specialized service for search functionality.

#### `TwitterSocialService`

Handles social interactions and engagement.

#### `TwitterMessagesService`

Manages direct messages and conversations.

## Extension Outputs

### Tweet Operations

```typescript
// Basic tweet
await agent.output("twitter:tweet", {
  content: "Hello Twitter!",
});

// Enhanced tweet with poll
await agent.output("twitter:tweet", {
  content: "What's your favorite AI framework?",
  poll: {
    options: ["TensorFlow", "PyTorch", "JAX", "Other"],
    durationMinutes: 1440, // 24 hours
  },
});

// Thread
await agent.output("twitter:thread", {
  tweets: [
    "🧵 Thread about AI safety (1/3)",
    "First, we need to consider alignment...",
    "Finally, governance is crucial for responsible AI.",
  ],
  delay: 5, // seconds between tweets
});
```

### Social Interactions

```typescript
// Like a tweet
await agent.output("twitter:like", {
  tweetId: "1234567890",
});

// Retweet
await agent.output("twitter:retweet", {
  tweetId: "1234567890",
});

// Quote tweet
await agent.output("twitter:quote", {
  tweetId: "1234567890",
  comment: "Great insights! Adding my perspective...",
});

// Follow user
await agent.output("twitter:follow", {
  username: "elonmusk",
});
```

### Search & Discovery

```typescript
// Search tweets
await agent.output("twitter:search", {
  query: "artificial intelligence",
  maxResults: 20,
  mode: "latest",
});
```

### Analytics

```typescript
// Get tweet analytics
await agent.output("twitter:analytics", {
  tweetId: "1234567890",
});
```

### Auto-Engagement

```typescript
await agent.output("twitter:auto-engage", {
  enabled: true,
  keywords: ["AI", "machine learning"],
  excludeKeywords: ["crypto", "NFT"],
  minLikes: 10,
  maxLikes: 500,
  actions: {
    like: true,
    retweet: false,
    reply: true,
  },
  replyTemplates: [
    "Interesting point about AI!",
    "Thanks for sharing this insight",
  ],
});
```

### Proactive Post Generation

The agent automatically receives prompts to create original content:

```typescript
// Agent receives this input every 2 hours (configurable)
// Input format:
{
  trigger: "scheduled",
  context: "Create a tweet related to current trends. Consider: Artificial Intelligence",
  mood: "engaging",
  maxLength: 280
}

// Agent can then respond with:
await agent.output("twitter:tweet", {
  content: "🤖 AI is transforming how we work and create. What's the most exciting AI development you've seen this week? #AI #Innovation",
});

// Or create a thread:
await agent.output("twitter:thread", {
  tweets: [
    "🧵 Thread: The evolution of AI (1/3)",
    "AI went from science fiction to daily reality in just a few years...",
    "What excites you most about AI's future? Drop your thoughts below! 👇"
  ],
  delay: 5
});
```

## Extension Inputs

The extension automatically monitors:

- **Mentions** - Real-time mention monitoring every 30 seconds
- **Trending Topics** - Trending hashtags and topics every 5 minutes
- **Post Generation** - Proactive tweet creation prompts (configurable interval,
  default 2 hours)

### Post Generation Input

The `twitter:generate-post` input automatically triggers your agent to create
original content:

```xml
<post-prompt trigger="scheduled" mood="engaging" maxLength="280">
Create a tweet related to current trends. Consider: AI and automation
</post-prompt>
```

**Features:**

- **Smart timing**: Configurable posting intervals via
  `TWITTER_POST_INTERVAL_MINUTES`
- **Dynamic context**: Incorporates current trending topics when available
- **Mood variety**: Rotates between informative, engaging, humorous,
  professional, and casual tones
- **Trigger types**: Scheduled, trending-based, or random prompts

**Configuration:**

```env
TWITTER_POST_INTERVAL_MINUTES=120  # Post every 2 hours (default)
TWITTER_POST_INTERVAL_MINUTES=60   # Post every hour
TWITTER_POST_INTERVAL_MINUTES=720  # Post every 12 hours
```

## Advanced Features

### Rate Limiting

The client includes built-in rate limiting to prevent API abuse:

```typescript
// Automatic rate limiting with configurable delays
const client = new EnhancedTwitterClient(credentials);
// All methods are automatically rate-limited
```

### Bulk Operations

```typescript
// Follow multiple users
const results = await client.bulkFollow(["user1", "user2", "user3"]);

// Each operation includes delay to respect rate limits
```

### Smart Engagement

```typescript
// Engage with content based on sophisticated criteria
const config = {
  enabled: true,
  keywords: ["AI", "automation"],
  excludeKeywords: ["spam", "promotional"],
  minLikes: 5,
  maxLikes: 1000,
  actions: {
    like: true,
    retweet: false,
    reply: true,
  },
  replyTemplates: ["Great point!", "Interesting perspective!"],
};

await client.autoEngage(config);
```

### Analytics Dashboard

```typescript
// Get comprehensive metrics
const metrics = await client.getEngagementMetrics(tweetId);
console.log({
  likes: metrics.likes,
  retweets: metrics.retweets,
  replies: metrics.replies,
  views: metrics.views,
  engagementRate: metrics.engagementRate,
});
```

## Error Handling

All methods include comprehensive error handling:

```typescript
try {
  const result = await client.likeTweet(tweetId);
  if (result.success) {
    console.log("Tweet liked successfully");
  } else {
    console.error("Failed to like tweet:", result.error);
  }
} catch (error) {
  console.error("Network or API error:", error);
}
```

## Best Practices

1. **Rate Limiting**: Always respect Twitter's rate limits
2. **Authentication**: Use secure credential management
3. **Error Handling**: Implement proper error handling for all operations
4. **Monitoring**: Monitor your bot's behavior to ensure compliance
5. **Content Quality**: Focus on meaningful interactions over quantity
6. **Privacy**: Respect user privacy and Twitter's terms of service

## Security Considerations

- Store credentials securely using environment variables
- Use the DRY_RUN mode for testing
- Monitor and log all automated actions
- Implement proper access controls
- Regular security audits of your automation rules

## Contributing

We welcome contributions! Please see our contributing guidelines for more
information.

## License

This package is part of the Daydreams AI ecosystem and follows the same license
terms.

## Support

For support, please open an issue on our GitHub repository or contact our
support team.
