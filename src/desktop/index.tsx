import React from "react";
import { createRoot } from "react-dom/client";

import { KintoneSdk } from "../shared/util/kintoneSdk";

import IndexShowButton from "./components/IndexShowButton";
import { MessageService } from "./service/MessageService";

import type { ConfigSchema } from "../shared/types/Config";

const renderButton = (
  container: HTMLElement,
  onClick: () => Promise<void>,
  buttonLabel: string,
) => {
  createRoot(container).render(
    <IndexShowButton onClick={onClick} buttonLabel={buttonLabel} />,
  );
};

interface KintoneEvent {
  record: Record<string, { value: string }>;
  viewId: number;
  viewName: string;
}

// メイン処理
((PLUGIN_ID) => {
  kintone.events.on("app.record.index.show", async (event: KintoneEvent) => {
    const pluginConfig = kintone.plugin.app.getConfig(PLUGIN_ID).config;
    if (!pluginConfig) return;

    const config: ConfigSchema = JSON.parse(pluginConfig).config;
    const kintoneSdk = new KintoneSdk();

    const messageService = new MessageService(config);

    const headerMenuSpace = kintone.app.getHeaderMenuSpaceElement();
    if (!headerMenuSpace) return;

    const container = document.createElement("div");
    headerMenuSpace.appendChild(container);

    renderButton(
      container,
      async () => {
        const appId = kintone.app.getId();
        if (!appId) throw new Error("アプリIDを取得できませんでした");

        const condition = kintone.app.getQueryCondition() || "";
        const records = (await kintoneSdk.getRecords(appId, [], condition))
          .records;

        if (!records.length) {
          alert("対象レコードがありません");
          return;
        }
        // カーソルAPIを使用しない場合は、取得件数の上限が10,000件
        if (records.length === 10000) {
          if (
            !confirm(
              "レコード取得件数が最大値の10,000件に達しました。続行しますか？",
            )
          ) {
            return;
          }
        }

        messageService.alertMessage(
          records as Array<Record<string, { value: string }>>,
        );
      },
      `[${event.viewName}]のレコードを表示`,
    );
  });
})(kintone.$PLUGIN_ID);
