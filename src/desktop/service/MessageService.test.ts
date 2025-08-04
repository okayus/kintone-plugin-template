import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import { beforeEach, describe, expect, it, type Mocked, vi } from "vitest";

import { KintoneSdk } from "../../shared/util/kintoneSdk";

import { MessageService } from "./MessageService";

import type { ConfigSchema } from "../../shared/types/Config";
import type { Record as KintoneRecord } from "@kintone/rest-api-client/lib/src/client/types";

vi.mock("../shared/util/kintoneSdk");

// kintone global object type
interface MockKintone {
  app: {
    getId: () => number;
    getQueryCondition: () => string;
  };
  plugin: {
    app: {
      getConfig: (pluginId: string) => { [key: string]: string };
    };
  };
}

describe("MessageService", () => {
  let mockkintoneSdk: Mocked<KintoneSdk>;
  let mockRestApiClient: Mocked<KintoneRestAPIClient>;
  let kintone: MockKintone;

  beforeEach(() => {
    kintone = {
      app: {
        getId: () => 123,
        getQueryCondition: () => "",
      },
      plugin: {
        app: {
          getConfig: () => ({}),
        },
      },
    };
    global.kintone = kintone as any;

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
        settings: [],
      };

      const messageService = new MessageService(mockConfig, mockkintoneSdk);
      const appId = "1";

      vi.spyOn(kintone.app, "getId").mockReturnValue(123);
      mockkintoneSdk.getRecords.mockResolvedValue({
        records: [
          {
            field1: { type: "SINGLE_LINE_TEXT", value: "value1" },
            field2: { type: "SINGLE_LINE_TEXT", value: "value2" },
          },
        ] as KintoneRecord[],
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
        settings: [
          {
            name: "設定1",
            appId: "1",
            targetField: "field1",
            prefix: "prefix\n",
          },
        ],
      };

      const messageService = new MessageService(mockConfig, mockkintoneSdk);

      const records: KintoneRecord[] = [
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
      const recordsWithSettings = [
        {
          setting: mockConfig.settings[0],
          records: records,
        },
      ];
      const message = messageService.generateMessage(recordsWithSettings);

      expect(message).toBe("prefix\nvalue1 value2\nvalue3 value4");
    });
  });
});
