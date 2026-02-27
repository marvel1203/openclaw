import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";
import { formatRelativeTimestamp } from "../format.ts";
import type { ChannelAccountSnapshot } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import type { ChannelsProps } from "./channels.types.ts";

export function renderFeishuCard(params: {
  props: ChannelsProps;
  feishuAccounts: ChannelAccountSnapshot[];
  accountCountLabel: unknown;
}) {
  const { props, feishuAccounts, accountCountLabel } = params;
  const feishuStatus = props.snapshot?.channels?.feishu as
    | {
        configured?: boolean;
        running?: boolean;
        connected?: boolean;
        domain?: string;
        botName?: string;
        lastStartAt?: number;
        lastError?: string;
      }
    | undefined;
  const hasMultipleAccounts = feishuAccounts.length > 1;

  const renderAccountCard = (account: ChannelAccountSnapshot) => {
    const label = account.name || account.accountId;
    return html`
      <div class="account-card">
        <div class="account-card-header">
          <div class="account-card-title">${label}</div>
          <div class="account-card-id">${account.accountId}</div>
        </div>
        <div class="status-list account-card-status">
          <div>
            <span class="label">${t("channels.running")}</span>
            <span>${account.running ? t("channels.yes") : t("channels.no")}</span>
          </div>
          <div>
            <span class="label">${t("channels.configured")}</span>
            <span>${account.configured ? t("channels.yes") : t("channels.no")}</span>
          </div>
          <div>
            <span class="label">${t("channels.lastInbound")}</span>
            <span>${account.lastInboundAt ? formatRelativeTimestamp(account.lastInboundAt) : t("common.na")}</span>
          </div>
          ${
            account.lastError
              ? html`
                <div class="account-card-error">
                  ${account.lastError}
                </div>
              `
              : nothing
          }
        </div>
      </div>
    `;
  };

  return html`
    <div class="card">
      <div class="card-title">${t("channels.feishu.title")}</div>
      <div class="card-sub">${t("channels.feishu.sub")}</div>
      ${accountCountLabel}

      ${
        hasMultipleAccounts
          ? html`
            <div class="account-card-list">
              ${feishuAccounts.map((account) => renderAccountCard(account))}
            </div>
          `
          : html`
            <div class="status-list" style="margin-top: 16px;">
              <div>
                <span class="label">${t("channels.configured")}</span>
                <span>${feishuStatus?.configured ? t("channels.yes") : t("channels.no")}</span>
              </div>
              <div>
                <span class="label">${t("channels.running")}</span>
                <span>${feishuStatus?.running ? t("channels.yes") : t("channels.no")}</span>
              </div>
              ${
                feishuStatus?.domain
                  ? html`<div>
                    <span class="label">${t("channels.feishu.domain")}</span>
                    <span>${feishuStatus.domain}</span>
                  </div>`
                  : nothing
              }
              ${
                feishuStatus?.botName
                  ? html`<div>
                    <span class="label">${t("channels.feishu.botName")}</span>
                    <span>${feishuStatus.botName}</span>
                  </div>`
                  : nothing
              }
              <div>
                <span class="label">${t("channels.lastStart")}</span>
                <span>${feishuStatus?.lastStartAt ? formatRelativeTimestamp(feishuStatus.lastStartAt) : t("common.na")}</span>
              </div>
            </div>
          `
      }

      ${
        feishuStatus?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${feishuStatus.lastError}
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({ channelId: "feishu", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${t("channels.probe")}
        </button>
      </div>
    </div>
  `;
}
