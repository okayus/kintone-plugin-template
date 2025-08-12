import { describe, expect, it } from "vitest";

import {
  createSimpleFieldStrategy,
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
