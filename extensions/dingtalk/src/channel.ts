import type {
  ChannelMeta,
  ChannelPlugin,
  OpenClawConfig,
} from "openclaw/plugin-sdk";
import {
  buildBaseChannelStatusSummary,
  DEFAULT_ACCOUNT_ID,
  PAIRING_APPROVED_MESSAGE,
} from "openclaw/plugin-sdk";
import { DingTalkConfigSchema } from "./config-schema.js";
import type { ResolvedDingTalkAccount, DingTalkConfig } from "./types.js";

const meta: ChannelMeta = {
  id: "dingtalk",
  label: "DingTalk",
  selectionLabel: "DingTalk (钉钉)",
  docsPath: "/channels/dingtalk",
  docsLabel: "dingtalk",
  blurb: "钉钉 enterprise messaging (Alibaba DingTalk).",
  aliases: ["ding", "dingding"],
  order: 40,
};

function resolveDingTalkConfig(config: OpenClawConfig): DingTalkConfig | undefined {
  const channels = (config as Record<string, unknown>)?.channels as
    | Record<string, unknown>
    | undefined;
  const raw = channels?.dingtalk;
  if (!raw) return undefined;
  const parsed = DingTalkConfigSchema.safeParse(raw);
  if (!parsed.success) return undefined;
  return parsed.data as DingTalkConfig;
}

export function listDingTalkAccountIds(config: OpenClawConfig): string[] {
  const cfg = resolveDingTalkConfig(config);
  if (!cfg) return [];
  const accountIds = Object.keys(cfg.accounts ?? {});
  if (accountIds.length > 0) return accountIds;
  if (cfg.appKey || cfg.robotToken) return [DEFAULT_ACCOUNT_ID];
  return [];
}

export function resolveDefaultDingTalkAccountId(config: OpenClawConfig): string {
  const cfg = resolveDingTalkConfig(config);
  if (!cfg) return DEFAULT_ACCOUNT_ID;
  const accounts = cfg.accounts ?? {};
  const ids = Object.keys(accounts).filter((id) => accounts[id]?.enabled !== false);
  if (ids.length === 1) return ids[0];
  return DEFAULT_ACCOUNT_ID;
}

export function resolveDingTalkAccount(
  config: OpenClawConfig,
  accountId?: string | null,
): ResolvedDingTalkAccount | undefined {
  const cfg = resolveDingTalkConfig(config);
  if (!cfg) return undefined;

  const resolvedAccountId = accountId ?? resolveDefaultDingTalkAccountId(config);
  const accountCfg = cfg.accounts?.[resolvedAccountId];

  const appKey = accountCfg?.appKey ?? cfg.appKey ?? "";
  const appSecret = accountCfg?.appSecret ?? cfg.appSecret ?? "";
  const robotToken = accountCfg?.robotToken ?? cfg.robotToken;
  const robotSecret = accountCfg?.robotSecret ?? cfg.robotSecret;
  const webhookPath = accountCfg?.webhookPath ?? cfg.webhookPath ?? "/dingtalk/events";

  return {
    accountId: resolvedAccountId,
    appKey,
    appSecret,
    robotToken,
    robotSecret,
    webhookPath,
    config: cfg,
  };
}

export const dingtalkPlugin: ChannelPlugin<ResolvedDingTalkAccount> = {
  id: "dingtalk",
  meta,
  pairing: {
    idLabel: "dingtalkUserId",
    normalizeAllowEntry: (entry) => entry.replace(/^(dingtalk|ding|user):/i, ""),
    notifyApproval: async ({ cfg, id }) => {
      // Approval notification via session webhook requires an active session.
      // The pairing flow sends approval via the reply path after the user
      // sends a pairing request.
      void cfg;
      void id;
      void PAIRING_APPROVED_MESSAGE;
    },
  },
  capabilities: {
    chatTypes: ["direct", "channel"],
    polls: false,
    threads: false,
    media: false,
    reactions: false,
    edit: false,
    reply: true,
  },
  agentPrompt: {
    messageToolHints: () => [
      "- DingTalk targeting: reply to the current conversation by default.",
      "- DingTalk supports Markdown in group messages.",
    ],
  },
  config: {
    listAccountIds: (cfg) => listDingTalkAccountIds(cfg),
    resolveAccount: (cfg, accountId) => resolveDingTalkAccount(cfg, accountId),
    defaultAccountId: (cfg) => resolveDefaultDingTalkAccountId(cfg),
    isEnabled: (account) => Boolean(account?.appKey || account?.robotToken),
    isConfigured: (account) => Boolean(account?.appKey || account?.robotToken),
    unconfiguredReason: () => "DingTalk appKey or robotToken is not configured",
  },
  groups: {
    resolveToolPolicy: (params) => {
      const cfg = resolveDingTalkConfig(params.cfg);
      if (!cfg) return undefined;
      const groupId = params.groupId;
      if (!groupId) return undefined;
      return cfg.groups?.[groupId]?.tools;
    },
  },
  reload: { configPrefixes: ["channels.dingtalk"] },
  configSchema: {
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: { type: "boolean" },
        appKey: { type: "string" },
        appSecret: { type: "string" },
        robotToken: { type: "string" },
        robotSecret: { type: "string" },
        webhookPath: { type: "string" },
        webhookHost: { type: "string" },
        webhookPort: { type: "integer", minimum: 1 },
        dmPolicy: { type: "string", enum: ["open", "pairing", "allowlist"] },
        allowFrom: { type: "array", items: { type: "string" } },
        groupPolicy: { type: "string", enum: ["open", "allowlist", "disabled"] },
        groupAllowFrom: { type: "array", items: { type: "string" } },
        requireMention: { type: "boolean" },
        historyLimit: { type: "integer", minimum: 0 },
        accounts: { type: "object" },
      },
    },
  },
  status: {
    buildChannelSummary: ({ account }) => {
      const hasCredentials = Boolean(account?.appKey || account?.robotToken);
      return buildBaseChannelStatusSummary({
        configured: hasCredentials,
        running: hasCredentials,
      });
    },
  },
};
