import { z } from "zod";

export { z };

const DmPolicySchema = z.enum(["open", "pairing", "allowlist"]);
const GroupPolicySchema = z.enum(["open", "allowlist", "disabled"]);

const ToolPolicySchema = z
  .object({
    allow: z.array(z.string()).optional(),
    deny: z.array(z.string()).optional(),
  })
  .strict()
  .optional();

const MarkdownConfigSchema = z
  .object({
    mode: z.enum(["native", "escape", "strip"]).optional(),
  })
  .strict()
  .optional();

export const DingTalkGroupSchema = z
  .object({
    requireMention: z.boolean().optional(),
    tools: ToolPolicySchema,
    skills: z.array(z.string()).optional(),
    enabled: z.boolean().optional(),
    allowFrom: z.array(z.union([z.string(), z.number()])).optional(),
    systemPrompt: z.string().optional(),
  })
  .strict();

const DingTalkSharedConfigShape = {
  webhookHost: z.string().optional(),
  webhookPort: z.number().int().positive().optional(),
  markdown: MarkdownConfigSchema,
  dmPolicy: DmPolicySchema.optional(),
  allowFrom: z.array(z.union([z.string(), z.number()])).optional(),
  groupPolicy: GroupPolicySchema.optional(),
  groupAllowFrom: z.array(z.union([z.string(), z.number()])).optional(),
  requireMention: z.boolean().optional(),
  groups: z.record(z.string(), DingTalkGroupSchema.optional()).optional(),
  historyLimit: z.number().int().min(0).optional(),
};

/**
 * Per-account configuration for multi-account DingTalk bots.
 */
export const DingTalkAccountConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    name: z.string().optional(),
    /** DingTalk app key (AppKey) */
    appKey: z.string().optional(),
    /** DingTalk app secret (AppSecret) */
    appSecret: z.string().optional(),
    /** Outgoing webhook robot token (for robot webhook bots) */
    robotToken: z.string().optional(),
    /** Outgoing webhook signing secret */
    robotSecret: z.string().optional(),
    webhookPath: z.string().optional(),
    ...DingTalkSharedConfigShape,
  })
  .strict();

export const DingTalkConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    /** DingTalk app key (AppKey) */
    appKey: z.string().optional(),
    /** DingTalk app secret (AppSecret) */
    appSecret: z.string().optional(),
    /** Outgoing webhook robot token */
    robotToken: z.string().optional(),
    /** Outgoing webhook signing secret */
    robotSecret: z.string().optional(),
    webhookPath: z.string().optional().default("/dingtalk/events"),
    ...DingTalkSharedConfigShape,
    dmPolicy: DmPolicySchema.optional().default("pairing"),
    groupPolicy: GroupPolicySchema.optional().default("allowlist"),
    requireMention: z.boolean().optional().default(true),
    accounts: z.record(z.string(), DingTalkAccountConfigSchema.optional()).optional(),
  })
  .strict();

export type DingTalkAccountConfig = z.infer<typeof DingTalkAccountConfigSchema>;
export type DingTalkConfig = z.infer<typeof DingTalkConfigSchema>;
