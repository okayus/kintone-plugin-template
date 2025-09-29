import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { KintoneSdk } from "../../shared/util/kintoneSdk";

import { MessageService } from "./MessageService";

import type {
  ConfigSchema,
  Entity,
  NoName11,
  NoName17,
  NoName23,
  NoName29,
  NoName35,
  NoName41,
  NoName47,
  NoName53,
  NoName59,
  NoName65,
} from "../../shared/types/Config";
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

    it("queryConditionsからもフィールドを抽出", () => {
      const mockConfig: ConfigSchema = { settings: [] };
      const messageService = new MessageService(mockConfig, mockkintoneSdk);

      const setting = {
        name: "test",
        appId: "1",
        targetField: "field1",
        timestampField: "timestamp",
        prefix: "",
        body: "Hello {name}",
        queryConditions: [
          {
            fieldCode: "status",
            fieldType: "STATUS" as const,
            operator: "=" as const,
            stringValue: "進行中",
          },
          {
            fieldCode: "category",
            fieldType: "CHECK_BOX" as const,
            operator: "in" as const,
            arrayValue: ["A", "B"],
          },
        ],
      };

      const fields = messageService.extractRequiredFields(setting);
      expect(fields).toEqual(
        expect.arrayContaining(["name", "status", "category"]),
      );
    });
  });

  describe("buildQueryString", () => {
    let messageService: MessageService;

    beforeEach(() => {
      const mockConfig: ConfigSchema = { settings: [] };
      messageService = new MessageService(mockConfig, mockkintoneSdk);
    });

    describe("文字列値フィールド", () => {
      it("等価演算子でクエリ生成", () => {
        const conditions: NoName11[] = [
          {
            fieldCode: "name",
            fieldType: "SINGLE_LINE_TEXT",
            operator: "=",
            stringValue: "田中",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('name = "田中"');
      });

      it("like演算子でクエリ生成", () => {
        const conditions: NoName11[] = [
          {
            fieldCode: "title",
            fieldType: "SINGLE_LINE_TEXT",
            operator: "like",
            stringValue: "商品%",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('title like "商品%"');
      });

      it("not like演算子でクエリ生成", () => {
        const conditions: NoName11[] = [
          {
            fieldCode: "comment",
            fieldType: "SINGLE_LINE_TEXT",
            operator: "not like",
            stringValue: "%削除%",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('comment not like "%削除%"');
      });

      it("in演算子でクエリ生成（文字列系）", () => {
        const conditions: NoName17[] = [
          {
            fieldCode: "status",
            fieldType: "SINGLE_LINE_TEXT",
            operator: "in",
            arrayValue: ["進行中", "レビュー中", "完了"],
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('status in ("進行中","レビュー中","完了")');
      });
    });

    describe("数値系フィールド", () => {
      it("数値比較演算子でクエリ生成", () => {
        const conditions: NoName23[] = [
          {
            fieldCode: "amount",
            fieldType: "NUMBER",
            operator: ">=",
            stringValue: "1000",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('amount >= "1000"');
      });

      it("計算フィールドでクエリ生成", () => {
        const conditions: NoName23[] = [
          {
            fieldCode: "total",
            fieldType: "CALC",
            operator: "<",
            stringValue: "500",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('total < "500"');
      });

      it("in演算子でクエリ生成（数値系）", () => {
        const conditions: NoName29[] = [
          {
            fieldCode: "priority",
            fieldType: "NUMBER",
            operator: "in",
            arrayValue: ["1", "2", "3"],
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('priority in ("1","2","3")');
      });
    });

    describe("複数行テキスト系フィールド", () => {
      it("複数行テキストのlike演算子", () => {
        const conditions: NoName35[] = [
          {
            fieldCode: "description",
            fieldType: "MULTI_LINE_TEXT",
            operator: "like",
            stringValue: "%重要%",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('description like "%重要%"');
      });

      it("複数行テキストのis演算子", () => {
        const conditions: NoName35[] = [
          {
            fieldCode: "notes",
            fieldType: "MULTI_LINE_TEXT",
            operator: "is",
            stringValue: "",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('notes is ""');
      });

      it("複数行テキストのis not演算子", () => {
        const conditions: NoName35[] = [
          {
            fieldCode: "memo",
            fieldType: "MULTI_LINE_TEXT",
            operator: "is not",
            stringValue: "",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('memo is not ""');
      });
    });

    describe("リッチエディター", () => {
      it("リッチエディターのlike演算子", () => {
        const conditions: NoName41[] = [
          {
            fieldCode: "content",
            fieldType: "RICH_TEXT",
            operator: "like",
            stringValue: "%画像%",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('content like "%画像%"');
      });

      it("リッチエディターのnot like演算子", () => {
        const conditions: NoName41[] = [
          {
            fieldCode: "article",
            fieldType: "RICH_TEXT",
            operator: "not like",
            stringValue: "%draft%",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('article not like "%draft%"');
      });
    });

    describe("選択系フィールド", () => {
      it("ラジオボタンでクエリ生成", () => {
        const conditions: NoName47[] = [
          {
            fieldCode: "priority",
            fieldType: "RADIO_BUTTON",
            operator: "in",
            arrayValue: ["高"],
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('priority in ("高")');
      });

      it("ドロップダウンでクエリ生成", () => {
        const conditions: NoName47[] = [
          {
            fieldCode: "status",
            fieldType: "DROP_DOWN",
            operator: "not in",
            arrayValue: ["完了", "キャンセル"],
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('status not in ("完了","キャンセル")');
      });

      it("チェックボックスでクエリ生成", () => {
        const conditions: NoName47[] = [
          {
            fieldCode: "category",
            fieldType: "CHECK_BOX",
            operator: "in",
            arrayValue: ["A", "B", "C"],
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('category in ("A","B","C")');
      });

      it("複数選択でクエリ生成", () => {
        const conditions: NoName47[] = [
          {
            fieldCode: "tags",
            fieldType: "MULTI_SELECT",
            operator: "not in",
            arrayValue: ["draft", "archived"],
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('tags not in ("draft","archived")');
      });
    });

    describe("ステータス系フィールド", () => {
      it("ステータス等価演算子でクエリ生成", () => {
        const conditions: NoName53[] = [
          {
            fieldCode: "status",
            fieldType: "STATUS",
            operator: "=",
            stringValue: "進行中",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('status = "進行中"');
      });

      it("ステータス不等価演算子でクエリ生成", () => {
        const conditions: NoName53[] = [
          {
            fieldCode: "status",
            fieldType: "STATUS",
            operator: "!=",
            stringValue: "完了",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('status != "完了"');
      });

      it("ステータスin演算子でクエリ生成", () => {
        const conditions: NoName59[] = [
          {
            fieldCode: "status",
            fieldType: "STATUS",
            operator: "in",
            arrayValue: ["進行中", "レビュー中"],
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('status in ("進行中","レビュー中")');
      });
    });

    describe("日時系フィールド", () => {
      it("日付フィールドでクエリ生成", () => {
        const conditions: NoName65[] = [
          {
            fieldCode: "due_date",
            fieldType: "DATE",
            operator: ">=",
            stringValue: "2024-01-01",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('due_date >= "2024-01-01"');
      });

      it("時刻フィールドでクエリ生成", () => {
        const conditions: NoName65[] = [
          {
            fieldCode: "start_time",
            fieldType: "TIME",
            operator: "<",
            stringValue: "09:00",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('start_time < "09:00"');
      });

      it("日時フィールドでクエリ生成", () => {
        const conditions: NoName65[] = [
          {
            fieldCode: "updated_at",
            fieldType: "DATETIME",
            operator: ">",
            stringValue: "2024-01-01T00:00:00Z",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('updated_at > "2024-01-01T00:00:00Z"');
      });
    });

    describe("Entity配列フィールド", () => {
      it("ユーザー選択フィールドでクエリ生成", () => {
        const conditions: Entity[] = [
          {
            fieldCode: "assignee",
            fieldType: "USER_SELECT",
            operator: "in",
            entityValue: [
              { code: "user1", name: "田中" },
              { code: "user2", name: "佐藤" },
            ],
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('assignee in ("user1","user2")');
      });

      it("組織選択フィールドでクエリ生成", () => {
        const conditions: Entity[] = [
          {
            fieldCode: "organization",
            fieldType: "ORGANIZATION_SELECT",
            operator: "not in",
            entityValue: [{ code: "org1" }],
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('organization not in ("org1")');
      });

      it("グループ選択フィールドでクエリ生成", () => {
        const conditions: Entity[] = [
          {
            fieldCode: "group",
            fieldType: "GROUP_SELECT",
            operator: "in",
            entityValue: [
              { code: "group1", name: "開発チーム" },
              { code: "group2", name: "営業チーム" },
              { code: "group3", name: "管理チーム" },
            ],
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('group in ("group1","group2","group3")');
      });
    });

    describe("複数条件と論理演算子", () => {
      it("and条件で複数フィールド連結", () => {
        const conditions: Array<NoName53 | NoName47> = [
          {
            fieldCode: "status",
            fieldType: "STATUS",
            operator: "=",
            stringValue: "進行中",
          },
          {
            fieldCode: "priority",
            fieldType: "DROP_DOWN",
            operator: "in",
            arrayValue: ["高"],
            logicalOperator: "and",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('status = "進行中" and priority in ("高")');
      });

      it("or条件で複数フィールド連結", () => {
        const conditions: NoName47[] = [
          {
            fieldCode: "category",
            fieldType: "RADIO_BUTTON",
            operator: "in",
            arrayValue: ["A"],
          },
          {
            fieldCode: "category",
            fieldType: "RADIO_BUTTON",
            operator: "in",
            arrayValue: ["B"],
            logicalOperator: "or",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('category in ("A") or category in ("B")');
      });

      it("混在条件（and/or組み合わせ）", () => {
        const conditions: Array<NoName53 | NoName47> = [
          {
            fieldCode: "status",
            fieldType: "STATUS",
            operator: "!=",
            stringValue: "完了",
          },
          {
            fieldCode: "priority",
            fieldType: "DROP_DOWN",
            operator: "in",
            arrayValue: ["高"],
            logicalOperator: "and",
          },
          {
            fieldCode: "category",
            fieldType: "CHECK_BOX",
            operator: "in",
            arrayValue: ["重要", "緊急"],
            logicalOperator: "or",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe(
          'status != "完了" and priority in ("高") or category in ("重要","緊急")',
        );
      });

      it("論理演算子のデフォルト値（and）", () => {
        const conditions: Array<NoName53 | NoName11> = [
          {
            fieldCode: "status",
            fieldType: "STATUS",
            operator: "=",
            stringValue: "進行中",
          },
          {
            fieldCode: "assignee",
            fieldType: "SINGLE_LINE_TEXT",
            operator: "!=",
            stringValue: "",
            // logicalOperatorを省略（デフォルトでand）
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('status = "進行中" and assignee != ""');
      });
    });

    describe("エッジケース", () => {
      it("空配列の場合は空文字列を返す", () => {
        const conditions: never[] = [];
        const result = messageService.buildQueryString(conditions);
        expect(result).toBe("");
      });

      it("nullやundefinedの場合は空文字列を返す", () => {
        expect(messageService.buildQueryString(null as any)).toBe("");
        expect(messageService.buildQueryString(undefined as any)).toBe("");
      });

      it("特殊文字エスケープ（ダブルクォート）", () => {
        const conditions: NoName35[] = [
          {
            fieldCode: "comment",
            fieldType: "MULTI_LINE_TEXT",
            operator: "like",
            stringValue: 'test"quote',
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('comment like "test\\"quote"');
      });

      it("特殊文字エスケープ（配列内のダブルクォート）", () => {
        const conditions: NoName47[] = [
          {
            fieldCode: "tags",
            fieldType: "MULTI_SELECT",
            operator: "in",
            arrayValue: ['tag"with"quotes', "normal"],
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('tags in ("tag\\"with\\"quotes","normal")');
      });

      it("特殊文字エスケープ（Entity内のダブルクォート）", () => {
        const conditions: Entity[] = [
          {
            fieldCode: "assignee",
            fieldType: "USER_SELECT",
            operator: "in",
            entityValue: [
              { code: 'user"test', name: "Test User" },
              { code: "normal_user", name: "Normal User" },
            ],
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('assignee in ("user\\"test","normal_user")');
      });

      it("空文字列値でクエリ生成", () => {
        const conditions: NoName11[] = [
          {
            fieldCode: "notes",
            fieldType: "SINGLE_LINE_TEXT",
            operator: "=",
            stringValue: "",
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe('notes = ""');
      });

      it("空配列値でクエリ生成", () => {
        const conditions: NoName47[] = [
          {
            fieldCode: "tags",
            fieldType: "MULTI_SELECT",
            operator: "in",
            arrayValue: [],
          },
        ];

        const result = messageService.buildQueryString(conditions);
        expect(result).toBe("tags in ()");
      });
    });
  });
});
