import { describe, expect, it, vi } from "vitest";

import { MessageService } from "../../src/desktop/service/MessageService";

import type { SingleLineText } from "../../node_modules/@kintone/rest-api-client/lib/src/KintoneFields/types/field";
import type { ConfigSchema } from "../../src/shared/types/Config";

const mockConfig: ConfigSchema = {
  prefix: "prefix\n",
  fields: [
    { type: "SINGLE_LINE_TEXT", value: "field1" },
    { type: "SINGLE_LINE_TEXT", value: "field2" },
  ] as SingleLineText[],
};

describe("MessageService", () => {
  const messageService = new MessageService(mockConfig);

  describe("generateMessages", () => {
    it("プレフィックスとフィールド値を含むメッセージを返す", () => {
      const records = [
        { field1: { value: "value1" }, field2: { value: "value2" } },
        { field1: { value: "value3" }, field2: { value: "value4" } },
      ];
      const message = messageService.generateMessage(records);

      expect(message).toBe("prefix\nvalue1 value2\nvalue3 value4");
    });
  });
});
