import type { DingTalkConfig, DingTalkAccountConfig } from "./config-schema.js";

export type { DingTalkConfig, DingTalkAccountConfig };

export type DingTalkCredentials = {
  appKey: string;
  appSecret: string;
  robotToken?: string;
  robotSecret?: string;
};

export type ResolvedDingTalkAccount = {
  accountId: string;
  appKey: string;
  appSecret: string;
  robotToken?: string;
  robotSecret?: string;
  webhookPath: string;
  config: DingTalkConfig;
};

/** DingTalk message sender info from webhook event */
export type DingTalkSender = {
  staffId?: string;
  staffName?: string;
  /** Staff avatar URL */
  avatar?: string;
  /** Conversation (chat) type: "1" = private, "2" = group */
  conversationType: "1" | "2";
  /** Sender's DingTalk ID */
  senderId: string;
  /** Sender's name */
  senderNick: string;
  /** Session webhook URL for replying (provided in event) */
  sessionWebhook?: string;
  /** Conversation/group ID */
  conversationId: string;
  /** Conversation title (group name) */
  conversationTitle?: string;
  /** Whether this is a group chat */
  isGroup: boolean;
};

/** Incoming DingTalk message event */
export type DingTalkMessageEvent = {
  msgtype: "text" | "richText" | "picture" | "file" | "audio" | "video" | "link";
  text?: { content: string };
  richText?: { text?: string };
  msgId: string;
  robotCode: string;
  sessionWebhook: string;
  sessionWebhookExpiredTime: number;
  createAt: number;
  conversationType: "1" | "2";
  conversationId: string;
  conversationTitle?: string;
  senderId: string;
  senderNick: string;
  senderStaffId?: string;
  atUsers?: Array<{ dingtalkId: string; staffId?: string }>;
  chatbotUserId: string;
};

/** Outgoing text message payload */
export type DingTalkOutboundMessage = {
  msgtype: "text" | "markdown";
  text?: { content: string };
  markdown?: { title: string; text: string };
  at?: {
    atUserIds?: string[];
    isAtAll?: boolean;
  };
};

/** Result of sending a DingTalk message */
export type DingTalkSendResult = {
  success: boolean;
  processQueryKey?: string;
  error?: string;
};
