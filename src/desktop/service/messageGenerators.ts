import type { Record } from "@kintone/rest-api-client/lib/src/client/types";

/**
 * フィールド値取得ストラテジー
 * レコードとフィールドコードから値を取得する関数型
 */
export type FieldValueStrategy = (record: Record, fieldCode: string) => string;

/**
 * 通常フィールド用ストラテジーを作成する
 *
 * @returns 通常フィールドの値を取得するストラテジー関数
 */
export const createSimpleFieldStrategy =
  (): FieldValueStrategy => (record, fieldCode) => {
    const field = record[fieldCode];
    return field?.value?.toString() || "";
  };

/**
 * ストラテジーパターンを使用してプレースホルダーを置換する
 *
 * @param strategy - フィールド値取得ストラテジー
 * @param record - kintoneレコードオブジェクト
 * @param body - プレースホルダーを含むテキスト
 * @returns プレースホルダーが置換されたテキスト
 */
export const replacePlaceholdersWithStrategy = (
  strategy: FieldValueStrategy,
  record: Record,
  body: string,
): string => {
  return body.replace(/{([^}]+)}/g, (_, fieldCode) => {
    return strategy(record, fieldCode.trim());
  });
};

/**
 * bodyテキスト内の{field_code}形式のプレースホルダーをレコードの値で置換する
 * 内部的にストラテジーパターンを使用
 *
 * @param body - プレースホルダーを含むテキスト
 * @param record - kintoneレコードオブジェクト
 * @returns プレースホルダーが置換されたテキスト
 *
 * @example
 * ```typescript
 * const record = { name: { value: "田中" }, age: { value: 25 } };
 * replacePlaceholders("こんにちは {name} さん（{age}歳）", record);
 * // => "こんにちは 田中 さん（25歳）"
 * ```
 */
export const replacePlaceholders = (body: string, record: Record): string => {
  const strategy = createSimpleFieldStrategy();
  return replacePlaceholdersWithStrategy(strategy, record, body);
};
