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
 * テーブルフィールド用ストラテジーを作成する
 *
 * @param separator 連結時の区切り文字（デフォルト: ", "）
 * @returns テーブルフィールドの値を連結するストラテジー関数
 */
export const createTableFieldStrategy =
  (separator = ", "): FieldValueStrategy =>
  (record, fieldCode) => {
    const [tableField, subField] = fieldCode.split(".");
    const table = record[tableField];

    if (!table || table.type !== "SUBTABLE" || !Array.isArray(table.value)) {
      return "";
    }

    return table.value
      .map((row) => row.value[subField]?.value?.toString() || "")
      .filter((val) => val.trim() !== "")
      .join(separator);
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
 * フィールドコードに基づいて適切なストラテジーを自動選択する
 *
 * @param separator テーブルフィールド用の区切り文字（デフォルト: ", "）
 * @returns フィールドコードを判定してストラテジーを選択する関数
 */
export const createAutoFieldStrategy =
  (separator = ", "): FieldValueStrategy =>
  (record, fieldCode) => {
    if (fieldCode.includes(".")) {
      // テーブルフィールド（table.field形式）
      return createTableFieldStrategy(separator)(record, fieldCode);
    }
    // 通常フィールド
    return createSimpleFieldStrategy()(record, fieldCode);
  };

/**
 * 通常フィールドとテーブルフィールドの両方に対応した置換関数
 *
 * @param body プレースホルダーを含むテキスト
 * @param record kintoneレコードオブジェクト
 * @param separator テーブルフィールド値の区切り文字（デフォルト: ", "）
 * @returns プレースホルダーが置換されたテキスト
 *
 * @example
 * ```typescript
 * const record = {
 *   name: { value: "田中" },
 *   items: { type: "SUBTABLE", value: [{ value: { title: { value: "商品A" } } }] }
 * };
 * replaceAllPlaceholders("こんにちは {name} さん、商品: {items.title}", record);
 * // => "こんにちは 田中 さん、商品: 商品A"
 * ```
 */
export const replaceAllPlaceholders = (
  body: string,
  record: Record,
  separator = ", ",
): string => {
  const strategy = createAutoFieldStrategy(separator);
  return replacePlaceholdersWithStrategy(strategy, record, body);
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
