import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { KintoneSdk } from "../../shared/util/kintoneSdk";

import { MessageService } from "./MessageService";

import type { ConfigSchema } from "../../shared/types/Config";
import type { KintoneRestAPIClient } from "@kintone/rest-api-client";
import type { Record as KintoneRecord } from "@kintone/rest-api-client/lib/src/client/types";

vi.mock("../shared/util/kintoneSdk");

// テスト用のグローバルkintoneオブジェクト設定
const mockKintone = {
  app: {
    getId: vi.fn(),
    getQueryCondition: vi.fn(),
  },
  plugin: {
    app: {
      getConfig: vi.fn(),
    },
  },
};

// 型安全なテストレコード作成
function createTestRecord(
  fields: Record<string, { type: string; value: string }>,
): KintoneRecord {
  const record: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) {
    record[key] = value;
  }
  return record;
}

describe("MessageService", () => {
  let mockkintoneSdk: KintoneSdk & { getRecords: Mock };
  let mockRestApiClient: { record: { getRecords: Mock } };

  beforeEach(() => {
    // global.kintone設定
    Object.assign(global, { kintone: mockKintone });

    // モック初期化
    mockKintone.app.getId.mockReturnValue(123);
    mockKintone.app.getQueryCondition.mockReturnValue("");
    mockKintone.plugin.app.getConfig.mockReturnValue({});

    // 最小限のmockRestApiClient
    mockRestApiClient = {
      record: {
        getRecords: vi.fn(),
      },
    };

    // KintoneSdk作成（KintoneSdkの設計上の問題のためasキャスト使用）
    const sdkInstance = new KintoneSdk(
      mockRestApiClient as unknown as KintoneRestAPIClient,
    );
    Object.defineProperty(sdkInstance, "getRecords", {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
    mockkintoneSdk = sdkInstance as KintoneSdk & { getRecords: Mock };
  });

  describe("fetchRecords", () => {
    it("取得したレコードを返す", async () => {
      const mockConfig: ConfigSchema = {
        settings: [],
      };

      const messageService = new MessageService(mockConfig, mockkintoneSdk);
      const appId = "1";

      vi.spyOn(global.kintone.app, "getId").mockReturnValue(123);
      const mockRecords: KintoneRecord[] = [
        createTestRecord({
          field1: { type: "SINGLE_LINE_TEXT", value: "value1" },
          field2: { type: "SINGLE_LINE_TEXT", value: "value2" },
        }),
      ];

      mockkintoneSdk.getRecords.mockResolvedValue({
        records: mockRecords,
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

  describe("generateMessage (破壊的変更版)", () => {
    it("bodyフィールドでプレースホルダーを使用したメッセージ生成", () => {
      const mockConfig: ConfigSchema = {
        settings: [
          {
            name: "プレースホルダー設定",
            appId: "1",
            targetField: "field1", // 無視される
            timestampField: "timestamp",
            prefix: "通知: ",
            body: "Hello {field1}, you have {field2}",
          },
        ],
      };

      const messageService = new MessageService(mockConfig, mockkintoneSdk);

      const records: KintoneRecord[] = [
        createTestRecord({
          field1: { type: "SINGLE_LINE_TEXT", value: "value1" },
          field2: { type: "SINGLE_LINE_TEXT", value: "value2" },
        }),
      ];
      const recordsWithSettings = [
        {
          setting: mockConfig.settings[0],
          records: records,
        },
      ];
      const message = messageService.generateMessage(recordsWithSettings);

      expect(message).toBe("通知: Hello value1, you have value2");
    });

    it("複数レコードで個別メッセージ生成", () => {
      const mockConfig: ConfigSchema = {
        settings: [
          {
            name: "複数レコード設定",
            appId: "1",
            targetField: "field1", // 無視される
            timestampField: "timestamp",
            prefix: "お知らせ: ",
            body: "{field1} has {field2}",
          },
        ],
      };

      const messageService = new MessageService(mockConfig, mockkintoneSdk);

      const records: KintoneRecord[] = [
        createTestRecord({
          field1: { type: "SINGLE_LINE_TEXT", value: "User1" },
          field2: { type: "SINGLE_LINE_TEXT", value: "Action1" },
        }),
        createTestRecord({
          field1: { type: "SINGLE_LINE_TEXT", value: "User2" },
          field2: { type: "SINGLE_LINE_TEXT", value: "Action2" },
        }),
      ];
      const recordsWithSettings = [
        {
          setting: mockConfig.settings[0],
          records: records,
        },
      ];
      const message = messageService.generateMessage(recordsWithSettings);

      expect(message).toBe(
        "お知らせ: User1 has Action1\nお知らせ: User2 has Action2",
      );
    });

    it("bodyが空の場合は警告ログを出力してスキップ", () => {
      const consoleSpy = vi.spyOn(console, "warn");

      const mockConfig: ConfigSchema = {
        settings: [
          {
            name: "空body設定",
            appId: "1",
            targetField: "field1",
            timestampField: "timestamp",
            prefix: "prefix: ",
            body: "", // 空
          },
        ],
      };

      const messageService = new MessageService(mockConfig, mockkintoneSdk);

      const records: KintoneRecord[] = [
        createTestRecord({
          field1: { type: "SINGLE_LINE_TEXT", value: "value1" },
        }),
      ];
      const recordsWithSettings = [
        {
          setting: mockConfig.settings[0],
          records: records,
        },
      ];

      const message = messageService.generateMessage(recordsWithSettings);
      expect(message).toBe(""); // 空文字
      expect(consoleSpy).toHaveBeenCalledWith(
        'Setting "空body設定" has empty body field. Skipping.',
      );

      consoleSpy.mockRestore();
    });

    it("テーブルフィールドプレースホルダーでメッセージ生成", () => {
      const mockConfig: ConfigSchema = {
        settings: [
          {
            name: "テーブル設定",
            appId: "1",
            targetField: "items", // 無視される
            timestampField: "timestamp",
            prefix: "商品一覧: ",
            body: "取扱商品: {items.name}",
          },
        ],
      };

      const messageService = new MessageService(mockConfig, mockkintoneSdk);

      const records: KintoneRecord[] = [
        {
          items: {
            type: "SUBTABLE",
            value: [
              {
                id: "1",
                value: { name: { type: "SINGLE_LINE_TEXT", value: "商品A" } },
              },
              {
                id: "2",
                value: { name: { type: "SINGLE_LINE_TEXT", value: "商品B" } },
              },
            ],
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
      expect(message).toBe("商品一覧: 取扱商品: 商品A, 商品B");
    });

    it("複数設定での混在処理", () => {
      const mockConfig: ConfigSchema = {
        settings: [
          {
            name: "設定1",
            appId: "1",
            targetField: "field1",
            timestampField: "timestamp",
            prefix: "A: ",
            body: "User {name}",
          },
          {
            name: "設定2",
            appId: "2",
            targetField: "field2",
            timestampField: "timestamp",
            prefix: "B: ",
            body: "Product {title}",
          },
        ],
      };

      const messageService = new MessageService(mockConfig, mockkintoneSdk);

      const recordsWithSettings = [
        {
          setting: mockConfig.settings[0],
          records: [
            createTestRecord({
              name: { type: "SINGLE_LINE_TEXT", value: "田中" },
            }),
          ],
        },
        {
          setting: mockConfig.settings[1],
          records: [
            createTestRecord({
              title: { type: "SINGLE_LINE_TEXT", value: "商品A" },
            }),
          ],
        },
      ];

      const message = messageService.generateMessage(recordsWithSettings);
      expect(message).toBe("A: User 田中\nB: Product 商品A");
    });
  });

  describe("extractRequiredFields (破壊的変更版)", () => {
    it("bodyからプレースホルダーフィールドを抽出", () => {
      const mockConfig: ConfigSchema = { settings: [] };
      const messageService = new MessageService(mockConfig, mockkintoneSdk);

      const setting = {
        name: "test",
        appId: "1",
        targetField: "ignored_field", // 無視される
        timestampField: "timestamp",
        prefix: "",
        body: "Hello {name}, you are in {dept}. Items: {items.name}",
      };

      const fields = messageService.extractRequiredFields(setting);
      expect(fields).toEqual(expect.arrayContaining(["name", "dept", "items"]));
      expect(fields).not.toContain("ignored_field"); // targetFieldは無視される
    });

    it("bodyが空の場合は空配列を返す", () => {
      const mockConfig: ConfigSchema = { settings: [] };
      const messageService = new MessageService(mockConfig, mockkintoneSdk);

      const setting = {
        name: "test",
        appId: "1",
        targetField: "field1",
        timestampField: "timestamp",
        prefix: "",
        body: "",
      };

      const fields = messageService.extractRequiredFields(setting);
      expect(fields).toEqual([]);
    });

    it("プレースホルダーがない場合は空配列を返す", () => {
      const mockConfig: ConfigSchema = { settings: [] };
      const messageService = new MessageService(mockConfig, mockkintoneSdk);

      const setting = {
        name: "test",
        appId: "1",
        targetField: "field1",
        timestampField: "timestamp",
        prefix: "",
        body: "Fixed message without placeholders",
      };

      const fields = messageService.extractRequiredFields(setting);
      expect(fields).toEqual([]);
    });
  });
});
