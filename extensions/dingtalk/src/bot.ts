import crypto from "node:crypto";
import type { DingTalkMessageEvent, DingTalkSender } from "./types.js";

/**
 * Verify DingTalk webhook signature.
 * DingTalk signs events with: HMAC-SHA256(timestamp + "\n" + secret, secret)
 */
export function verifyDingTalkSignature(
  timestamp: string,
  sign: string,
  secret: string,
): boolean {
  const stringToSign = `${timestamp}\n${secret}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(stringToSign)
    .digest("base64");
  // Constant-time comparison to prevent timing attacks
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(decodeURIComponent(sign));
  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

/**
 * Extract the text content from a DingTalk message event.
 * Handles text and richText message types.
 */
export function extractMessageText(event: DingTalkMessageEvent): string {
  if (event.msgtype === "text" && event.text?.content) {
    return event.text.content.trim();
  }
  if (event.msgtype === "richText" && event.richText?.text) {
    return event.richText.text.trim();
  }
  return "";
}

/**
 * Strip @bot mention from message text.
 * DingTalk includes "@BotName " prefix in group messages.
 */
export function stripBotMention(text: string, botName?: string): string {
  let result = text;
  // Remove @BotName pattern
  if (botName) {
    result = result.replace(new RegExp(`^@${botName}\\s*`, "i"), "");
  }
  // Remove generic @mention pattern at start
  result = result.replace(/^@[\w\s]+\s+/, "");
  return result.trim();
}

/**
 * Check if the bot is mentioned in a group message.
 * In group chats, DingTalk requires @mention to trigger the bot.
 */
export function isBotMentioned(
  event: DingTalkMessageEvent,
  botUserId: string,
): boolean {
  if (!event.atUsers || event.atUsers.length === 0) {
    return false;
  }
  return event.atUsers.some((u) => u.dingtalkId === botUserId);
}

/**
 * Build a DingTalkSender from a message event.
 */
export function buildSenderFromEvent(event: DingTalkMessageEvent): DingTalkSender {
  return {
    staffId: event.senderStaffId,
    senderId: event.senderId,
    senderNick: event.senderNick,
    conversationType: event.conversationType,
    conversationId: event.conversationId,
    conversationTitle: event.conversationTitle,
    sessionWebhook: event.sessionWebhook,
    isGroup: event.conversationType === "2",
  };
}
