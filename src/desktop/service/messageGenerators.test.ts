import { describe, expect, it } from "vitest";

import {
  createAutoFieldStrategy,
  createSimpleFieldStrategy,
  createTableFieldStrategy,
  replaceAllPlaceholders,
  replacePlaceholders,
  replacePlaceholdersWithStrategy,
} from "./messageGenerators";

import type { Record as KintoneRecord } from "@kintone/rest-api-client/lib/src/client/types";

describe("replacePlaceholders", () => {
  it("単一プレースホルダーを置換する", () => {
    const record: KintoneRecord = {
      name: { type: "SINGLE_LINE_TEXT", value: "田中" },
    };
    expect(replacePlaceholders("{name}", record)).toBe("田中");
  });

  it("複数プレースホルダーを置換する", () => {
    const record: KintoneRecord = {
      name: { type: "SINGLE_LINE_TEXT", value: "田中" },
      dept: { type: "SINGLE_LINE_TEXT", value: "開発" },
    };
    expect(
      replacePlaceholders("こんにちは {name} さん、{dept} 部です", record),
    ).toBe("こんにちは 田中 さん、開発 部です");
  });

  it("存在しないフィールドは空文字に置換する", () => {
    const record: KintoneRecord = {
      name: { type: "SINGLE_LINE_TEXT", value: "田中" },
    };
    expect(replacePlaceholders("Hello {name}, {unknown}", record)).toBe(
      "Hello 田中, ",
    );
  });

  it("プレースホルダーがない場合はそのまま返す", () => {
    const record: KintoneRecord = {};
    expect(replacePlaceholders("Hello world", record)).toBe("Hello world");
  });

  it("空文字列の場合はそのまま返す", () => {
    const record: KintoneRecord = {};
    expect(replacePlaceholders("", record)).toBe("");
  });

  it("数値フィールドを文字列に変換して置換する", () => {
    const record: KintoneRecord = {
      age: { type: "NUMBER", value: "25" },
      price: { type: "NUMBER", value: "1000" },
    };
    expect(replacePlaceholders("年齢: {age}歳、価格: {price}円", record)).toBe(
      "年齢: 25歳、価格: 1000円",
    );
  });

  it("スペースを含むフィールドコードを正しく処理する", () => {
    const record: KintoneRecord = {
      name: { type: "SINGLE_LINE_TEXT", value: "田中" },
    };
    expect(replacePlaceholders("Hello { name }, world", record)).toBe(
      "Hello 田中, world",
    );
  });

  it("複数の同じプレースホルダーを置換する", () => {
    const record: KintoneRecord = {
      name: { type: "SINGLE_LINE_TEXT", value: "田中" },
    };
    expect(replacePlaceholders("{name}さん、{name}さん", record)).toBe(
      "田中さん、田中さん",
    );
  });
});

describe("Strategy Pattern", () => {
  describe("createSimpleFieldStrategy", () => {
    it("通常フィールドの値を取得する", () => {
      const strategy = createSimpleFieldStrategy();
      const record: KintoneRecord = {
        name: { type: "SINGLE_LINE_TEXT", value: "田中" },
        age: { type: "NUMBER", value: "25" },
      };

      expect(strategy(record, "name")).toBe("田中");
      expect(strategy(record, "age")).toBe("25");
    });

    it("存在しないフィールドは空文字を返す", () => {
      const strategy = createSimpleFieldStrategy();
      const record: KintoneRecord = {};

      expect(strategy(record, "unknown")).toBe("");
    });
  });

  describe("replacePlaceholdersWithStrategy", () => {
    it("カスタムストラテジーを使用してプレースホルダーを置換する", () => {
      const customStrategy = (record: KintoneRecord, fieldCode: string) => {
        const field = record[fieldCode];
        if (!field?.value) return "[未設定]";
        return `[${field.value}]`;
      };

      const record: KintoneRecord = {
        name: { type: "SINGLE_LINE_TEXT", value: "田中" },
      };

      expect(
        replacePlaceholdersWithStrategy(
          customStrategy,
          record,
          "Hello {name}, {unknown}",
        ),
      ).toBe("Hello [田中], [未設定]");
    });

    it("simpleFieldStrategyと同じ動作をする", () => {
      const strategy = createSimpleFieldStrategy();
      const record: KintoneRecord = {
        name: { type: "SINGLE_LINE_TEXT", value: "田中" },
        dept: { type: "SINGLE_LINE_TEXT", value: "開発" },
      };

      const body = "こんにちは {name} さん、{dept} 部です";
      const resultWithStrategy = replacePlaceholdersWithStrategy(
        strategy,
        record,
        body,
      );
      const resultWithOriginal = replacePlaceholders(body, record);

      expect(resultWithStrategy).toBe(resultWithOriginal);
      expect(resultWithStrategy).toBe("こんにちは 田中 さん、開発 部です");
    });
  });
});

describe("Table Field Strategy", () => {
  describe("createTableFieldStrategy", () => {
    const tableRecord: KintoneRecord = {
      items: {
        type: "SUBTABLE",
        value: [
          {
            id: "1",
            value: {
              name: { type: "SINGLE_LINE_TEXT", value: "商品A" },
              price: { type: "NUMBER", value: "1000" },
            },
          },
          {
            id: "2",
            value: {
              name: { type: "SINGLE_LINE_TEXT", value: "商品B" },
              price: { type: "NUMBER", value: "2000" },
            },
          },
        ],
      },
    };

    it("テーブルフィールドの値を連結する", () => {
      const strategy = createTableFieldStrategy();
      expect(strategy(tableRecord, "items.name")).toBe("商品A, 商品B");
    });

    it("カスタム区切り文字を使用する", () => {
      const strategy = createTableFieldStrategy(" | ");
      expect(strategy(tableRecord, "items.name")).toBe("商品A | 商品B");
    });

    it("数値フィールドも文字列として連結する", () => {
      const strategy = createTableFieldStrategy();
      expect(strategy(tableRecord, "items.price")).toBe("1000, 2000");
    });

    it("存在しないテーブルは空文字を返す", () => {
      const strategy = createTableFieldStrategy();
      expect(strategy(tableRecord, "unknown.name")).toBe("");
    });

    it("存在しないサブフィールドは空文字を返す", () => {
      const strategy = createTableFieldStrategy();
      expect(strategy(tableRecord, "items.unknown")).toBe("");
    });

    it("空のテーブルは空文字を返す", () => {
      const emptyTableRecord: KintoneRecord = {
        items: {
          type: "SUBTABLE",
          value: [],
        },
      };
      const strategy = createTableFieldStrategy();
      expect(strategy(emptyTableRecord, "items.name")).toBe("");
    });

    it("空値を含む行は除外される", () => {
      const recordWithEmptyValues: KintoneRecord = {
        items: {
          type: "SUBTABLE",
          value: [
            {
              id: "1",
              value: {
                name: { type: "SINGLE_LINE_TEXT", value: "商品A" },
              },
            },
            {
              id: "2",
              value: {
                name: { type: "SINGLE_LINE_TEXT", value: "" },
              },
            },
            {
              id: "3",
              value: {
                name: { type: "SINGLE_LINE_TEXT", value: "商品C" },
              },
            },
          ],
        },
      };
      const strategy = createTableFieldStrategy();
      expect(strategy(recordWithEmptyValues, "items.name")).toBe(
        "商品A, 商品C",
      );
    });
  });
});

describe("Auto Strategy Selection", () => {
  describe("createAutoFieldStrategy", () => {
    const mixedRecord: KintoneRecord = {
      title: { type: "SINGLE_LINE_TEXT", value: "商品リスト" },
      count: { type: "NUMBER", value: "5" },
      items: {
        type: "SUBTABLE",
        value: [
          {
            id: "1",
            value: {
              name: { type: "SINGLE_LINE_TEXT", value: "商品A" },
              price: { type: "NUMBER", value: "1000" },
            },
          },
          {
            id: "2",
            value: {
              name: { type: "SINGLE_LINE_TEXT", value: "商品B" },
              price: { type: "NUMBER", value: "2000" },
            },
          },
        ],
      },
    };

    it("通常フィールドを取得する", () => {
      const strategy = createAutoFieldStrategy();
      expect(strategy(mixedRecord, "title")).toBe("商品リスト");
      expect(strategy(mixedRecord, "count")).toBe("5");
    });

    it("テーブルフィールドを連結して取得する", () => {
      const strategy = createAutoFieldStrategy();
      expect(strategy(mixedRecord, "items.name")).toBe("商品A, 商品B");
      expect(strategy(mixedRecord, "items.price")).toBe("1000, 2000");
    });

    it("カスタム区切り文字でテーブルフィールドを取得する", () => {
      const strategy = createAutoFieldStrategy(" | ");
      expect(strategy(mixedRecord, "items.name")).toBe("商品A | 商品B");
    });

    it("存在しないフィールドは空文字を返す", () => {
      const strategy = createAutoFieldStrategy();
      expect(strategy(mixedRecord, "unknown")).toBe("");
      expect(strategy(mixedRecord, "items.unknown")).toBe("");
      expect(strategy(mixedRecord, "unknown.field")).toBe("");
    });
  });

  describe("replaceAllPlaceholders", () => {
    const mixedRecord: KintoneRecord = {
      title: { type: "SINGLE_LINE_TEXT", value: "商品リスト" },
      count: { type: "NUMBER", value: "5" },
      items: {
        type: "SUBTABLE",
        value: [
          {
            id: "1",
            value: {
              name: { type: "SINGLE_LINE_TEXT", value: "商品A" },
              price: { type: "NUMBER", value: "1000" },
            },
          },
          {
            id: "2",
            value: {
              name: { type: "SINGLE_LINE_TEXT", value: "商品B" },
              price: { type: "NUMBER", value: "2000" },
            },
          },
        ],
      },
    };

    it("通常フィールドとテーブルフィールドを混在処理する", () => {
      const result = replaceAllPlaceholders(
        "{title} ({count}件): {items.name}",
        mixedRecord,
      );
      expect(result).toBe("商品リスト (5件): 商品A, 商品B");
    });

    it("カスタム区切り文字を使用する", () => {
      const result = replaceAllPlaceholders(
        "{title}: {items.name}",
        mixedRecord,
        " / ",
      );
      expect(result).toBe("商品リスト: 商品A / 商品B");
    });

    it("存在しないフィールドは空文字に置換する", () => {
      const result = replaceAllPlaceholders(
        "{title}, {unknown}, {items.unknown}",
        mixedRecord,
      );
      expect(result).toBe("商品リスト, , ");
    });

    it("プレースホルダーがない場合はそのまま返す", () => {
      const result = replaceAllPlaceholders("固定メッセージ", mixedRecord);
      expect(result).toBe("固定メッセージ");
    });

    it("複雑なメッセージテンプレートを処理する", () => {
      const template = `
タイトル: {title}
件数: {count}件
商品名: {items.name}
価格: {items.price}円
      `.trim();

      const expected = `
タイトル: 商品リスト
件数: 5件
商品名: 商品A, 商品B
価格: 1000, 2000円
      `.trim();

      const result = replaceAllPlaceholders(template, mixedRecord);
      expect(result).toBe(expected);
    });
  });
});
