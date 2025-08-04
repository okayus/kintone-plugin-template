import type { ConfigSetting } from "./ConfigFormTypes";
import type { ConfigSchema } from "../../shared/types/Config";

/**
 * レガシー設定データの型定義
 * 過去のバージョンとの互換性を保つための型
 */

// 共通設定の型 (既存のConfigSchemaから推論)
interface CommonSetting {
  prefix?: string;
}

/**
 * レガシー設定形式 V1
 * config プロパティでラップされた形式
 */
interface LegacyConfigV1 {
  config: {
    settings: ConfigSetting[];
    commonSetting?: CommonSetting;
  };
}

/**
 * レガシー設定形式 V2
 * 直接 settings プロパティを含む形式
 */
interface LegacyConfigV2 {
  settings: ConfigSetting[];
  commonSetting?: CommonSetting;
}

/**
 * 未知の構造を持つ可能性のある設定データ
 * JSONパース後の生データ
 */
interface UnknownConfigData {
  [key: string]: unknown;
}

/**
 * すべてのレガシー設定形式のユニオン型
 */
export type LegacyConfig =
  | LegacyConfigV1
  | LegacyConfigV2
  | ConfigSchema
  | UnknownConfigData
  | unknown;

/**
 * レガシー設定 V1 の型ガード
 */
export function isLegacyConfigV1(config: unknown): config is LegacyConfigV1 {
  return (
    typeof config === "object" &&
    config !== null &&
    "config" in config &&
    typeof (config as any).config === "object" &&
    (config as any).config !== null &&
    "settings" in (config as any).config &&
    Array.isArray((config as any).config.settings)
  );
}

/**
 * レガシー設定 V2 の型ガード
 */
export function isLegacyConfigV2(config: unknown): config is LegacyConfigV2 {
  return (
    typeof config === "object" &&
    config !== null &&
    "settings" in config &&
    Array.isArray((config as any).settings) &&
    !("config" in config) // V1と区別するため
  );
}

/**
 * 現在の設定形式の型ガード
 */
export function isCurrentConfigSchema(config: unknown): config is ConfigSchema {
  return (
    typeof config === "object" &&
    config !== null &&
    "settings" in config &&
    Array.isArray((config as any).settings)
  );
}

/**
 * 有効な設定オブジェクトかどうかを判定
 */
export function isValidConfigObject(
  config: unknown,
): config is Record<string, unknown> {
  return typeof config === "object" && config !== null;
}
