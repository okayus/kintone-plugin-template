import { KintoneSdk } from "../../shared/util/kintoneSdk";

import type { ConfigSchema } from "../../shared/types/Config";
import type {
  AppID,
  Record,
} from "@kintone/rest-api-client/lib/src/client/types";
import type { SingleLineText } from "@kintone/rest-api-client/lib/src/KintoneFields/types/field";

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

  public alertMessage(records: Record[]): void {
    if (records.length === 0) {
      return;
    }
    alert(this.generateMessage(records));
  }

  public generateMessage(records: Record[]): string {
    const messageLine = (record: Record): string => {
      const fieldValues: string[] = this.config.fields.map((field) => {
        return (record[field] as SingleLineText).value;
      });
      return fieldValues.join(" ");
    };

    const messageFromRecords: string = records
      .map((record) => messageLine(record))
      .join("\n");
    return this.config.prefix + messageFromRecords;
  }
}
