import type { Record } from "@kintone/rest-api-client/lib/src/client/types";

/**
 * bodyテキスト内の{field_code}形式のプレースホルダーをレコードの値で置換する
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
  return body.replace(/{([^}]+)}/g, (_, fieldCode) => {
    const field = record[fieldCode.trim()];
    return field?.value?.toString() || "";
  });
};
