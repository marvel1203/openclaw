import type {
  DingTalkOutboundMessage,
  DingTalkSendResult,
} from "./types.js";

/**
 * Send a message via DingTalk session webhook.
 * The session webhook URL is provided in the incoming event and is valid for a limited time.
 */
export async function sendViaDingTalkSessionWebhook(
  sessionWebhook: string,
  message: DingTalkOutboundMessage,
): Promise<DingTalkSendResult> {
  try {
    const resp = await fetch(sessionWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(10_000),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      return { success: false, error: `HTTP ${resp.status}: ${body.slice(0, 200)}` };
    }

    const data = (await resp.json()) as { processQueryKey?: string };
    return { success: true, processQueryKey: data.processQueryKey };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Build a plain text outbound message.
 */
export function buildTextMessage(
  content: string,
  opts?: { atUserIds?: string[]; atAll?: boolean },
): DingTalkOutboundMessage {
  return {
    msgtype: "text",
    text: { content },
    at: opts
      ? { atUserIds: opts.atUserIds, isAtAll: opts.atAll ?? false }
      : undefined,
  };
}

/**
 * Build a Markdown outbound message.
 * DingTalk renders a subset of Markdown in group messages.
 */
export function buildMarkdownMessage(
  title: string,
  text: string,
  opts?: { atUserIds?: string[]; atAll?: boolean },
): DingTalkOutboundMessage {
  return {
    msgtype: "markdown",
    markdown: { title, text },
    at: opts
      ? { atUserIds: opts.atUserIds, isAtAll: opts.atAll ?? false }
      : undefined,
  };
}

/**
 * Send a text reply via the session webhook URL.
 */
export async function sendTextReply(
  sessionWebhook: string,
  content: string,
): Promise<DingTalkSendResult> {
  return sendViaDingTalkSessionWebhook(sessionWebhook, buildTextMessage(content));
}

/**
 * Send a Markdown reply via the session webhook URL.
 */
export async function sendMarkdownReply(
  sessionWebhook: string,
  title: string,
  text: string,
): Promise<DingTalkSendResult> {
  return sendViaDingTalkSessionWebhook(
    sessionWebhook,
    buildMarkdownMessage(title, text),
  );
}
