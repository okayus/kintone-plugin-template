import { describe, expect, it } from "vitest";

import { replacePlaceholders } from "./messageGenerators";

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
