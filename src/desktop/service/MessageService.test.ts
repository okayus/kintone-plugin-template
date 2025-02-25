import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import { beforeEach, describe, expect, it, type Mocked, vi } from "vitest";

import { KintoneSdk } from "../../shared/util/kintoneSdk";

import { MessageService } from "./MessageService";

import type { ConfigSchema } from "../../shared/types/Config";
import type { Record } from "@kintone/rest-api-client/lib/src/client/types";

vi.mock("../shared/util/kintoneSdk");

describe("MessageService", () => {
  let mockkintoneSdk: Mocked<KintoneSdk>;
  let mockRestApiClient: Mocked<KintoneRestAPIClient>;
  let kintone: any;

  beforeEach(() => {
    kintone = {
      app: {
        getQueryCondition: vi.fn(),
      },
    };
    global.kintone = kintone;

    mockRestApiClient = {
      record: {
        getRecords: vi.fn(),
      },
    } as unknown as Mocked<KintoneRestAPIClient>;
    mockkintoneSdk = new KintoneSdk(mockRestApiClient) as Mocked<KintoneSdk>;
    mockkintoneSdk.getRecords = vi.fn();
  });

  describe("fetchRecords", () => {
    it("取得したレコードを返す", async () => {
      const mockConfig: ConfigSchema = {
        prefix: "",
        fields: [],
      };

      const messageService = new MessageService(mockConfig, mockkintoneSdk);
      const appId = "1";

      vi.spyOn(kintone.app, "getQueryCondition").mockReturnValue("");
      mockkintoneSdk.getRecords.mockResolvedValue({
        records: [
          {
            field1: { type: "SINGLE_LINE_TEXT", value: "value1" },
            field2: { type: "SINGLE_LINE_TEXT", value: "value2" },
          },
        ] as Record[],
      });

      const records = await messageService.fetchRecords(appId);
      expect(records).toEqual([
        {
          field1: { type: "SINGLE_LINE_TEXT", value: "value1" },
          field2: { type: "SINGLE_LINE_TEXT", value: "value2" },
        },
      ]);
    });
  });

  describe("generateMessages", () => {
    it("プレフィックスとフィールド値を含むメッセージを返す", () => {
      const mockConfig: ConfigSchema = {
        prefix: "prefix\n",
        fields: ["field1", "field2"],
      };

      const messageService = new MessageService(mockConfig, mockkintoneSdk);

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
