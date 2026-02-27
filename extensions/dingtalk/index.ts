import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { dingtalkPlugin } from "./src/channel.js";
import {
  buildMarkdownMessage,
  buildTextMessage,
  sendMarkdownReply,
  sendTextReply,
  sendViaDingTalkSessionWebhook,
} from "./src/send.js";
import {
  buildSenderFromEvent,
  extractMessageText,
  isBotMentioned,
  stripBotMention,
  verifyDingTalkSignature,
} from "./src/bot.js";

export {
  dingtalkPlugin,
  verifyDingTalkSignature,
  extractMessageText,
  stripBotMention,
  isBotMentioned,
  buildSenderFromEvent,
  sendViaDingTalkSessionWebhook,
  buildTextMessage,
  buildMarkdownMessage,
  sendTextReply,
  sendMarkdownReply,
};

const plugin = {
  id: "dingtalk",
  name: "DingTalk",
  description: "DingTalk (钉钉) channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    api.registerChannel({ plugin: dingtalkPlugin });
  },
};

export default plugin;
