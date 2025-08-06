import { KintoneSdk } from "../../shared/util/kintoneSdk";

import type { ConfigSchema } from "../../shared/types/Config";
import type {
  AppID,
  Record,
} from "@kintone/rest-api-client/lib/src/client/types";

// 設定とレコードのペア
interface SettingRecordPair {
  setting: ConfigSchema["settings"][number];
  records: Record[];
}

export class MessageService {
  private config: ConfigSchema;
  private kintoneSdk: KintoneSdk;

  constructor(config: ConfigSchema, kintoneSdk: KintoneSdk) {
    this.config = config;
    this.kintoneSdk = kintoneSdk;
  }

  public async fetchRecords(appId: AppID): Promise<Record[]> {
    const condition = kintone.app.getQueryCondition() || "";
    const records = (await this.kintoneSdk.getRecords(appId, [], condition))
      .records;

    if (!records.length) {
      return [];
    }

    return records;
  }

  public async fetchRecordsFromSettings(): Promise<SettingRecordPair[]> {
    // 設定されたすべてのアプリからレコードを取得し、設定と紐付けて返す
    const allResults: SettingRecordPair[] = [];

    for (const setting of this.config.settings) {
      if (setting.appId && setting.targetField) {
        try {
          const records = (
            await this.kintoneSdk.getRecords(
              Number(setting.appId),
              [setting.targetField],
              "",
            )
          ).records;
          allResults.push({ setting, records });
        } catch (error) {
          console.error(
            `Failed to fetch records from app ${setting.appId}:`,
            error,
          );
          allResults.push({ setting, records: [] });
        }
      }
    }

    return allResults;
  }

  public alertMessage(recordsWithSettings: SettingRecordPair[]): void {
    const totalRecords = recordsWithSettings.reduce(
      (sum, item) => sum + item.records.length,
      0,
    );
    if (totalRecords === 0) {
      alert("表示するレコードがありません。");
      return;
    }
    alert(this.generateMessage(recordsWithSettings));
  }

  public generateMessage(recordsWithSettings: SettingRecordPair[]): string {
    const messages: string[] = [];

    for (const { setting, records } of recordsWithSettings) {
      if (setting.appId && setting.targetField && records.length > 0) {
        const messageLine = (record: Record): string => {
          const field = record[setting.targetField];
          if (field && typeof field === "object" && "value" in field) {
            return String(field.value || "");
          }
          return "";
        };

        const messageFromRecords: string = records
          .map((record) => messageLine(record))
          .filter((line) => line.trim() !== "")
          .join(", ");

        if (messageFromRecords) {
          messages.push(setting.prefix + messageFromRecords);
        }
      }
    }

    return messages.join("\n");
  }
}
