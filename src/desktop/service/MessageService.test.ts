import { describe, expect, it, vi } from "vitest";

import { MessageService } from "./MessageService";

import type { ConfigSchema } from "../../shared/types/Config";
import type { SingleLineText } from "@kintone/rest-api-client/lib/src/KintoneFields/types/field";

const mockConfig: ConfigSchema = {
  prefix: "prefix\n",
  fields: ["field1", "field2"],
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
