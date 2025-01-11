import type { ConfigSchema } from "../../shared/types/Config";
import type { Record } from "@kintone/rest-api-client/lib/src/client/types";
import type { SingleLineText } from "@kintone/rest-api-client/lib/src/KintoneFields/types/field";

export class MessageService {
  private config: ConfigSchema;

  constructor(config: ConfigSchema) {
    this.config = config;
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
        return (record[field.value] as SingleLineText).value;
      });
      return fieldValues.join(" ");
    };

    const messageFromRecords: string = records
      .map((record) => messageLine(record))
      .join("\n");
    return this.config.prefix + messageFromRecords;
  }
}
