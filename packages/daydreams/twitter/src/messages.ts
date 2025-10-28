import { Scraper } from "agent-twitter-client";
import { Logger } from "@daydreamsai/core";

export interface DMConversation {
  id: string;
  participants: Array<{
    id: string;
    username: string;
    name: string;
  }>;
  lastMessage: {
    id: string;
    text: string;
    senderId: string;
    timestamp: Date;
  };
  unreadCount: number;
}

export interface DMMessage {
  id: string;
  text: string;
  senderId: string;
  recipientId: string;
  timestamp: Date;
  mediaUrls?: string[];
  conversationId: string;
}

export interface SendDMResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: number;
}

export class TwitterMessagesService {
  constructor(private scraper: Scraper, private logger: Logger) {}

  /**
   * Get all DM conversations for a user
   */
  async getConversations(
    userId: string,
    cursor?: string
  ): Promise<{
    conversations: DMConversation[];
    cursor?: string;
    hasMore: boolean;
  }> {
    try {
      this.logger.debug(
        "TwitterMessagesService.getConversations",
        "Fetching conversations",
        {
          userId,
          cursor,
        }
      );

      const response = await this.scraper.getDirectMessageConversations(
        userId,
        cursor
      );

      const conversations: DMConversation[] = response.conversations.map(
        (conv: any) => {
          const lastMessage = conv.messages[conv.messages.length - 1];

          return {
            id: conv.conversationId,
            participants: conv.participants.map((p: any) => ({
              id: p.id,
              username: p.screenName,
              name:
                response.users.find((u: any) => u.id === p.id)?.name ||
                p.screenName,
            })),
            lastMessage: {
              id: lastMessage.id,
              text: lastMessage.text,
              senderId: lastMessage.senderId,
              timestamp: new Date(lastMessage.createdAt),
            },
            unreadCount: 0, // This would need to be calculated based on last seen
          };
        }
      );

      return {
        conversations,
        cursor: response.cursor,
        hasMore: !!response.cursor,
      };
    } catch (error) {
      this.logger.error(
        "TwitterMessagesService.getConversations",
        "Error fetching conversations",
        {
          error,
          userId,
        }
      );
      throw error;
    }
  }

  /**
   * Send a direct message
   */
  async sendDirectMessage(
    conversationId: string,
    text: string
  ): Promise<SendDMResult> {
    try {
      this.logger.debug(
        "TwitterMessagesService.sendDirectMessage",
        "Sending DM",
        {
          conversationId,
          textLength: text.length,
        }
      );

      const response = await this.scraper.sendDirectMessage(
        conversationId,
        text
      );

      if (response.entries && response.entries.length > 0) {
        const messageEntry = response.entries[0];
        return {
          success: true,
          messageId: messageEntry.message.id,
          timestamp: Date.now(),
        };
      }

      return {
        success: false,
        error: "No message entry returned",
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(
        "TwitterMessagesService.sendDirectMessage",
        "Error sending DM",
        {
          error,
          conversationId,
        }
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get messages from a specific conversation
   */
  async getConversationMessages(
    conversationId: string,
    limit: number = 50
  ): Promise<DMMessage[]> {
    try {
      this.logger.debug(
        "TwitterMessagesService.getConversationMessages",
        "Getting conversation messages",
        {
          conversationId,
          limit,
        }
      );

      // This would require additional API calls to get full conversation history
      // For now, we'll work with what we get from getDirectMessageConversations
      const conversations = await this.getConversations("", undefined);
      const conversation = conversations.conversations.find(
        (c) => c.id === conversationId
      );

      if (!conversation) {
        return [];
      }

      // This is a simplified version - in reality you'd need to fetch the full conversation
      return [
        {
          id: conversation.lastMessage.id,
          text: conversation.lastMessage.text,
          senderId: conversation.lastMessage.senderId,
          recipientId:
            conversation.participants.find(
              (p) => p.id !== conversation.lastMessage.senderId
            )?.id || "",
          timestamp: conversation.lastMessage.timestamp,
          conversationId,
        },
      ];
    } catch (error) {
      this.logger.error(
        "TwitterMessagesService.getConversationMessages",
        "Error getting conversation messages",
        {
          error,
          conversationId,
        }
      );
      throw error;
    }
  }

  /**
   * Search conversations by keyword
   */
  async searchConversations(
    userId: string,
    keyword: string
  ): Promise<DMConversation[]> {
    try {
      const { conversations } = await this.getConversations(userId);

      return conversations.filter(
        (conv) =>
          conv.lastMessage.text.toLowerCase().includes(keyword.toLowerCase()) ||
          conv.participants.some(
            (p) =>
              p.username.toLowerCase().includes(keyword.toLowerCase()) ||
              p.name.toLowerCase().includes(keyword.toLowerCase())
          )
      );
    } catch (error) {
      this.logger.error(
        "TwitterMessagesService.searchConversations",
        "Error searching conversations",
        {
          error,
          userId,
          keyword,
        }
      );
      throw error;
    }
  }

  /**
   * Get unread conversations count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { conversations } = await this.getConversations(userId);
      return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
    } catch (error) {
      this.logger.error(
        "TwitterMessagesService.getUnreadCount",
        "Error getting unread count",
        {
          error,
          userId,
        }
      );
      throw error;
    }
  }

  /**
   * Auto-reply to DMs based on conditions
   */
  async autoReply(
    userId: string,
    options: {
      keywords: string[];
      response: string;
      excludeUsers?: string[];
      onlyFromFollowers?: boolean;
    }
  ): Promise<SendDMResult[]> {
    const results: SendDMResult[] = [];

    try {
      const { conversations } = await this.getConversations(userId);

      for (const conv of conversations) {
        const shouldReply = options.keywords.some((keyword) =>
          conv.lastMessage.text.toLowerCase().includes(keyword.toLowerCase())
        );

        if (
          shouldReply &&
          !options.excludeUsers?.includes(conv.lastMessage.senderId)
        ) {
          const result = await this.sendDirectMessage(
            conv.id,
            options.response
          );
          results.push(result);
        }
      }

      return results;
    } catch (error) {
      this.logger.error(
        "TwitterMessagesService.autoReply",
        "Error in auto-reply",
        {
          error,
          userId,
        }
      );
      throw error;
    }
  }
}
