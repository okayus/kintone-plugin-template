import { KintoneRestAPIClient } from "@kintone/rest-api-client";

import { KintoneSdk } from "../shared/util/kintoneSdk";

import { renderExecutionButton } from "./components/desktopUIHelpers";
import { MessageService } from "./service/MessageService";

import type { ConfigSchema } from "../shared/types/Config";
import type { Record } from "@kintone/rest-api-client/lib/src/client/types";
import type { KintoneEvent } from "src/shared/types/KintoneTypes";

// メイン処理
((PLUGIN_ID) => {
  kintone.events.on("app.record.index.show", async (event: KintoneEvent) => {
    const pluginConfig = kintone.plugin.app.getConfig(PLUGIN_ID).config;
    if (!pluginConfig) return;

    const config: ConfigSchema = JSON.parse(pluginConfig).config;
    const restApiClient = new KintoneRestAPIClient();
    const kintoneSdk = new KintoneSdk(restApiClient);
    const messageService = new MessageService(config, kintoneSdk);

    const handleAlertButtonClick = async () => {
      try {
        // 設定されたアプリからレコードを取得
        const recordsWithSettings = await messageService.fetchRecordsFromSettings();
        messageService.alertMessage(recordsWithSettings);
      } catch (error) {
        console.error("Error:", error);
        alert("エラーが発生しました: " + error);
      }
    };

    renderExecutionButton(
      "alert-button",
      handleAlertButtonClick,
      "メッセージを表示",
    );
  });
})(kintone.$PLUGIN_ID);
