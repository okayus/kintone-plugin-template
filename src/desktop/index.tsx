import React from "react";
import { createRoot } from "react-dom/client";

import { KintoneRestAPIClient } from "@kintone/rest-api-client";

import { KintoneSdk } from "../shared/util/kintoneSdk";

import IndexShowButton from "./components/IndexShowButton";
import { MessageService } from "./service/MessageService";

import type { ConfigSchema } from "../shared/types/Config";
import type { Record } from "@kintone/rest-api-client/lib/src/client/types";

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
  appId: number;
  record: Record;
  viewId: number;
  viewName: string;
}

// メイン処理
((PLUGIN_ID) => {
  kintone.events.on("app.record.index.show", async (event: KintoneEvent) => {
    const pluginConfig = kintone.plugin.app.getConfig(PLUGIN_ID).config;
    if (!pluginConfig) return;

    const config: ConfigSchema = JSON.parse(pluginConfig).config;
    const restApiClient = new KintoneRestAPIClient();
    const kintoneSdk = new KintoneSdk(restApiClient);
    const messageService = new MessageService(config, kintoneSdk);

    const headerMenuSpace = kintone.app.getHeaderMenuSpaceElement();
    if (!headerMenuSpace) return;

    const container = document.createElement("div");
    headerMenuSpace.appendChild(container);

    renderButton(
      container,
      async () => {
        const records = await messageService.fetchRecords(event.appId);

        if (records.length > 0) {
          messageService.alertMessage(records as Record[]);
        }
      },
      `[${event.viewName}]のレコードを表示`,
    );
  });
})(kintone.$PLUGIN_ID);
