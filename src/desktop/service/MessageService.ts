import { KintoneSdk } from "../../shared/util/kintoneSdk";

import { replaceAllPlaceholders } from "./messageGenerators";

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
    const allResults: SettingRecordPair[] = [];

    for (const setting of this.config.settings) {
      if (!setting.appId) {
        console.warn(`Setting "${setting.name}" has no appId. Skipping.`);
        continue;
      }

      if (!setting.body || setting.body.trim() === "") {
        console.warn(
          `Setting "${setting.name}" has empty body field. Skipping.`,
        );
        continue;
      }

      try {
        const fieldsToFetch = this.extractRequiredFields(setting);
        if (fieldsToFetch.length === 0) {
          console.warn(
            `Setting "${setting.name}" has no extractable fields. Skipping.`,
          );
          continue;
        }

        const records = (
          await this.kintoneSdk.getRecords(
            Number(setting.appId),
            fieldsToFetch,
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
      if (!setting.body || setting.body.trim() === "") {
        console.warn(
          `Setting "${setting.name}" has empty body field. Skipping.`,
        );
        continue;
      }

      // 各レコードごとに個別メッセージ生成
      for (const record of records) {
        const message = replaceAllPlaceholders(setting.body, record);
        if (message.trim()) {
          messages.push(setting.prefix + message);
        }
      }
    }

    return messages.join("\n");
  }

  private extractRequiredFields(
    setting: ConfigSchema["settings"][number],
  ): string[] {
    const fields = new Set<string>();

    if (!setting.body) return [];

    // bodyからプレースホルダーフィールド抽出
    const placeholders = setting.body.match(/{([^}]+)}/g);
    if (placeholders) {
      for (const placeholder of placeholders) {
        const fieldCode = placeholder.slice(1, -1).trim();
        const [tableField] = fieldCode.split(".");
        fields.add(tableField);
      }
    }

    return Array.from(fields);
  }
}
