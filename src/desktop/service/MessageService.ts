import type { ConfigSchema } from "../../shared/types/Config";

type RecordData = Record<string, { value: string }>;

export class MessageService {
  private config: ConfigSchema;

  constructor(config: ConfigSchema) {
    this.config = config;
  }

  public alertMessage(records: Array<Record<string, { value: string }>>): void {
    if (records.length === 0) {
      return;
    }
    alert(this.generateMessage(records));
  }

  public generateMessage(records: RecordData[]): string {
    const messageLine = (record: RecordData): string => {
      const fieldValues: string[] = this.config.fields.map((field) => {
        return record[field].value;
      });
      return fieldValues.join(" ");
    };

    const messageFromRecords: string = records
      .map((record) => messageLine(record))
      .join("\n");
    return this.config.prefix + messageFromRecords;
  }
}
