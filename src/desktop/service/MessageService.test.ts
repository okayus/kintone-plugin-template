import { describe, expect, it, vi } from "vitest";

import { MessageService } from "./MessageService";

import type { ConfigSchema } from "../../shared/types/Config";
import type { Record } from "@kintone/rest-api-client/lib/src/client/types";

describe("MessageService", () => {
  describe("generateMessages", () => {
    it("プレフィックスとフィールド値を含むメッセージを返す", () => {
      const mockConfig: ConfigSchema = {
        prefix: "prefix\n",
        fields: ["field1", "field2"],
      };

      const messageService = new MessageService(mockConfig);

      const records: Record[] = [
        {
          field1: {
            type: "SINGLE_LINE_TEXT",
            value: "value1",
          },
          field2: {
            type: "SINGLE_LINE_TEXT",
            value: "value2",
          },
        },
        {
          field1: {
            type: "SINGLE_LINE_TEXT",
            value: "value3",
          },
          field2: {
            type: "SINGLE_LINE_TEXT",
            value: "value4",
          },
        },
      ];
      const message = messageService.generateMessage(records);

      expect(message).toBe("prefix\nvalue1 value2\nvalue3 value4");
    });
  });
});
