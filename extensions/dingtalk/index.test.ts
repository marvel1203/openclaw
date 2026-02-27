/**
 * DingTalk plugin tests
 *
 * Tests:
 * - Config schema parsing and validation
 * - Webhook signature verification
 * - Message text extraction
 * - Bot mention detection
 * - Send helpers (mocked fetch)
 * - Plugin registration
 */

import { describe, expect, test, vi } from "vitest";

describe("DingTalk plugin", () => {
  // --------------------------------------------------------------------------
  // Config schema
  // --------------------------------------------------------------------------

  test("config schema parses minimal valid config", async () => {
    const { DingTalkConfigSchema } = await import("./src/config-schema.js");

    const result = DingTalkConfigSchema.safeParse({
      appKey: "key123",
      appSecret: "secret456",
      webhookPath: "/dingtalk/events",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.appKey).toBe("key123");
      expect(result.data.dmPolicy).toBe("pairing");
      expect(result.data.requireMention).toBe(true);
      expect(result.data.groupPolicy).toBe("allowlist");
    }
  });

  test("config schema applies defaults", async () => {
    const { DingTalkConfigSchema } = await import("./src/config-schema.js");

    const result = DingTalkConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.webhookPath).toBe("/dingtalk/events");
      expect(result.data.dmPolicy).toBe("pairing");
      expect(result.data.requireMention).toBe(true);
    }
  });

  test("config schema parses robot token config", async () => {
    const { DingTalkConfigSchema } = await import("./src/config-schema.js");

    const result = DingTalkConfigSchema.safeParse({
      robotToken: "robot-token-abc",
      robotSecret: "robot-secret-xyz",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.robotToken).toBe("robot-token-abc");
    }
  });

  test("config schema rejects unknown keys", async () => {
    const { DingTalkConfigSchema } = await import("./src/config-schema.js");

    const result = DingTalkConfigSchema.safeParse({
      appKey: "key123",
      unknownField: "value",
    });

    expect(result.success).toBe(false);
  });

  test("config schema parses multi-account config", async () => {
    const { DingTalkConfigSchema } = await import("./src/config-schema.js");

    const result = DingTalkConfigSchema.safeParse({
      accounts: {
        main: {
          appKey: "key-main",
          appSecret: "secret-main",
          webhookPath: "/dingtalk/main",
        },
        secondary: {
          appKey: "key-sec",
          appSecret: "secret-sec",
          enabled: false,
        },
      },
    });

    expect(result.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Signature verification
  // --------------------------------------------------------------------------

  test("verifyDingTalkSignature validates correct signature", async () => {
    const { verifyDingTalkSignature } = await import("./src/bot.js");
    const crypto = await import("node:crypto");

    const secret = "my-test-secret";
    const timestamp = String(Date.now());
    const stringToSign = `${timestamp}\n${secret}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(stringToSign)
      .digest("base64");

    expect(verifyDingTalkSignature(timestamp, encodeURIComponent(expected), secret)).toBe(true);
  });

  test("verifyDingTalkSignature rejects wrong signature", async () => {
    const { verifyDingTalkSignature } = await import("./src/bot.js");

    const secret = "my-test-secret";
    const timestamp = String(Date.now());

    expect(verifyDingTalkSignature(timestamp, "wrong-signature", secret)).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Message text extraction
  // --------------------------------------------------------------------------

  test("extractMessageText gets text from text messages", async () => {
    const { extractMessageText } = await import("./src/bot.js");

    const event = {
      msgtype: "text" as const,
      text: { content: "  Hello world  " },
      msgId: "msg1",
      robotCode: "bot1",
      sessionWebhook: "https://example.com/session",
      sessionWebhookExpiredTime: 9999999999,
      createAt: Date.now(),
      conversationType: "1" as const,
      conversationId: "conv1",
      senderId: "user1",
      senderNick: "Test User",
      chatbotUserId: "bot1",
    };

    expect(extractMessageText(event)).toBe("Hello world");
  });

  test("extractMessageText gets text from richText messages", async () => {
    const { extractMessageText } = await import("./src/bot.js");

    const event = {
      msgtype: "richText" as const,
      richText: { text: "Rich content" },
      msgId: "msg2",
      robotCode: "bot1",
      sessionWebhook: "https://example.com/session",
      sessionWebhookExpiredTime: 9999999999,
      createAt: Date.now(),
      conversationType: "1" as const,
      conversationId: "conv1",
      senderId: "user1",
      senderNick: "Test User",
      chatbotUserId: "bot1",
    };

    expect(extractMessageText(event)).toBe("Rich content");
  });

  test("extractMessageText returns empty string for unsupported types", async () => {
    const { extractMessageText } = await import("./src/bot.js");

    const event = {
      msgtype: "picture" as const,
      msgId: "msg3",
      robotCode: "bot1",
      sessionWebhook: "https://example.com/session",
      sessionWebhookExpiredTime: 9999999999,
      createAt: Date.now(),
      conversationType: "1" as const,
      conversationId: "conv1",
      senderId: "user1",
      senderNick: "Test User",
      chatbotUserId: "bot1",
    };

    expect(extractMessageText(event)).toBe("");
  });

  // --------------------------------------------------------------------------
  // Bot mention
  // --------------------------------------------------------------------------

  test("isBotMentioned detects mention", async () => {
    const { isBotMentioned } = await import("./src/bot.js");

    const event = {
      msgtype: "text" as const,
      text: { content: "@MyBot hello" },
      msgId: "msg1",
      robotCode: "bot1",
      sessionWebhook: "https://example.com/session",
      sessionWebhookExpiredTime: 9999999999,
      createAt: Date.now(),
      conversationType: "2" as const,
      conversationId: "conv1",
      senderId: "user1",
      senderNick: "Test User",
      chatbotUserId: "bot-id-123",
      atUsers: [{ dingtalkId: "bot-id-123" }],
    };

    expect(isBotMentioned(event, "bot-id-123")).toBe(true);
    expect(isBotMentioned(event, "other-bot")).toBe(false);
  });

  test("isBotMentioned returns false with no atUsers", async () => {
    const { isBotMentioned } = await import("./src/bot.js");

    const event = {
      msgtype: "text" as const,
      text: { content: "Hello" },
      msgId: "msg1",
      robotCode: "bot1",
      sessionWebhook: "https://example.com/session",
      sessionWebhookExpiredTime: 9999999999,
      createAt: Date.now(),
      conversationType: "1" as const,
      conversationId: "conv1",
      senderId: "user1",
      senderNick: "Test User",
      chatbotUserId: "bot1",
    };

    expect(isBotMentioned(event, "bot1")).toBe(false);
  });

  test("stripBotMention removes @mention prefix", async () => {
    const { stripBotMention } = await import("./src/bot.js");

    expect(stripBotMention("@MyBot hello world", "MyBot")).toBe("hello world");
    expect(stripBotMention("@OtherBot hello world")).toBe("hello world");
    expect(stripBotMention("hello world")).toBe("hello world");
  });

  // --------------------------------------------------------------------------
  // buildSenderFromEvent
  // --------------------------------------------------------------------------

  test("buildSenderFromEvent builds correct sender", async () => {
    const { buildSenderFromEvent } = await import("./src/bot.js");

    const event = {
      msgtype: "text" as const,
      text: { content: "Hello" },
      msgId: "msg1",
      robotCode: "bot1",
      sessionWebhook: "https://example.com/session/abc",
      sessionWebhookExpiredTime: 9999999999,
      createAt: Date.now(),
      conversationType: "2" as const,
      conversationId: "group123",
      conversationTitle: "Team Chat",
      senderId: "user42",
      senderNick: "Alice",
      senderStaffId: "staff42",
      chatbotUserId: "bot1",
    };

    const sender = buildSenderFromEvent(event);
    expect(sender.senderId).toBe("user42");
    expect(sender.senderNick).toBe("Alice");
    expect(sender.isGroup).toBe(true);
    expect(sender.conversationTitle).toBe("Team Chat");
    expect(sender.sessionWebhook).toBe("https://example.com/session/abc");
  });

  // --------------------------------------------------------------------------
  // Send helpers
  // --------------------------------------------------------------------------

  test("buildTextMessage builds correct payload", async () => {
    const { buildTextMessage } = await import("./src/send.js");

    const msg = buildTextMessage("Hello DingTalk");
    expect(msg.msgtype).toBe("text");
    expect(msg.text?.content).toBe("Hello DingTalk");
  });

  test("buildMarkdownMessage builds correct payload", async () => {
    const { buildMarkdownMessage } = await import("./src/send.js");

    const msg = buildMarkdownMessage("Title", "**Bold** content");
    expect(msg.msgtype).toBe("markdown");
    expect(msg.markdown?.title).toBe("Title");
    expect(msg.markdown?.text).toBe("**Bold** content");
  });

  test("sendViaDingTalkSessionWebhook returns success on 200", async () => {
    const { sendViaDingTalkSessionWebhook, buildTextMessage } = await import("./src/send.js");

    // Mock global fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ processQueryKey: "pqk123" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await sendViaDingTalkSessionWebhook(
      "https://example.com/session-webhook",
      buildTextMessage("Hello"),
    );

    expect(result.success).toBe(true);
    expect(result.processQueryKey).toBe("pqk123");
    expect(mockFetch).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });

  test("sendViaDingTalkSessionWebhook returns error on non-200", async () => {
    const { sendViaDingTalkSessionWebhook, buildTextMessage } = await import("./src/send.js");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => "Forbidden",
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await sendViaDingTalkSessionWebhook(
      "https://example.com/session-webhook",
      buildTextMessage("Hello"),
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("403");

    vi.unstubAllGlobals();
  });

  // --------------------------------------------------------------------------
  // Plugin registration
  // --------------------------------------------------------------------------

  test("plugin registers with correct metadata", async () => {
    const { default: plugin } = await import("./index.js");

    expect(plugin.id).toBe("dingtalk");
    expect(plugin.name).toBe("DingTalk");
    expect(plugin.configSchema).toBeDefined();
    // oxlint-disable-next-line typescript/unbound-method
    expect(plugin.register).toBeInstanceOf(Function);
  });

  test("plugin registers channel on register()", async () => {
    const { default: plugin } = await import("./index.js");

    // oxlint-disable-next-line typescript/no-explicit-any
    const registered: any[] = [];
    const mockApi = {
      id: "dingtalk",
      name: "DingTalk",
      source: "test",
      config: {},
      pluginConfig: {},
      runtime: {},
      logger: { info: () => {}, warn: () => {}, error: () => {} },
      registerTool: () => {},
      registerCli: () => {},
      registerService: () => {},
      on: () => {},
      resolvePath: (p: string) => p,
      // oxlint-disable-next-line typescript/no-explicit-any
      registerChannel: (reg: any) => registered.push(reg),
    };

    // oxlint-disable-next-line typescript/no-explicit-any
    plugin.register(mockApi as any);
    expect(registered.length).toBe(1);
    expect(registered[0].plugin?.id).toBe("dingtalk");
  });

  // --------------------------------------------------------------------------
  // Channel config adapter
  // --------------------------------------------------------------------------

  test("listDingTalkAccountIds returns DEFAULT_ACCOUNT_ID for single-account config", async () => {
    const { listDingTalkAccountIds } = await import("./src/channel.js");

    const config = {
      channels: { dingtalk: { appKey: "key123", appSecret: "secret456" } },
    };

    // oxlint-disable-next-line typescript/no-explicit-any
    const ids = listDingTalkAccountIds(config as any);
    expect(ids).toContain("default");
  });

  test("listDingTalkAccountIds returns empty array when no DingTalk config", async () => {
    const { listDingTalkAccountIds } = await import("./src/channel.js");

    // oxlint-disable-next-line typescript/no-explicit-any
    const ids = listDingTalkAccountIds({} as any);
    expect(ids).toHaveLength(0);
  });

  test("resolveDingTalkAccount resolves from top-level config", async () => {
    const { resolveDingTalkAccount } = await import("./src/channel.js");

    const config = {
      channels: {
        dingtalk: {
          appKey: "key123",
          appSecret: "secret456",
          robotToken: "robot-token",
          webhookPath: "/dingtalk/events",
        },
      },
    };

    // oxlint-disable-next-line typescript/no-explicit-any
    const account = resolveDingTalkAccount(config as any);
    expect(account?.appKey).toBe("key123");
    expect(account?.robotToken).toBe("robot-token");
    expect(account?.webhookPath).toBe("/dingtalk/events");
  });

  test("resolveDingTalkAccount resolves from accounts config", async () => {
    const { resolveDingTalkAccount } = await import("./src/channel.js");

    const config = {
      channels: {
        dingtalk: {
          accounts: {
            bot1: {
              appKey: "account-key",
              appSecret: "account-secret",
              webhookPath: "/dingtalk/bot1",
            },
          },
        },
      },
    };

    // oxlint-disable-next-line typescript/no-explicit-any
    const account = resolveDingTalkAccount(config as any, "bot1");
    expect(account?.appKey).toBe("account-key");
    expect(account?.webhookPath).toBe("/dingtalk/bot1");
  });

  test("dingtalkPlugin has required ChannelPlugin properties", async () => {
    const { dingtalkPlugin } = await import("./src/channel.js");

    expect(dingtalkPlugin.id).toBe("dingtalk");
    expect(dingtalkPlugin.meta.id).toBe("dingtalk");
    expect(dingtalkPlugin.capabilities.chatTypes).toContain("direct");
    expect(dingtalkPlugin.config.listAccountIds).toBeInstanceOf(Function);
    expect(dingtalkPlugin.config.resolveAccount).toBeInstanceOf(Function);
  });
});
