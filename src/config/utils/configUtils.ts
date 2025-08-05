import {
  isCurrentConfigSchema,
  isLegacyConfigV1,
  isLegacyConfigV2,
  isValidConfigObject,
  type LegacyConfig,
} from "../types/LegacyConfigTypes";

import type { ConfigSchema } from "../../shared/types/Config";
import type { ConfigSetting } from "../types/ConfigFormTypes";

/**
 * 新しい設定項目を作成する純粋関数
 */
export const createNewSetting = (index: number): ConfigSetting => ({
  name: `設定 ${index + 1}`,
  appId: "",
  targetField: "",
  timestampField: "",
  prefix: "",
});

/**
 * 設定を追加する純粋関数
 */
export const addSetting = (formData: ConfigSchema): ConfigSchema => {
  const newSetting = createNewSetting(formData.settings.length);
  return {
    ...formData,
    settings: [...formData.settings, newSetting],
  };
};

/**
 * 設定を削除する純粋関数
 */
export const deleteSetting = (
  formData: ConfigSchema,
  index: number,
): ConfigSchema => ({
  settings: formData.settings.filter((_, i) => i !== index),
});

/**
 * 設定を更新する純粋関数
 */
export const updateSetting = (
  formData: ConfigSchema,
  index: number,
  settingData: ConfigSetting,
): ConfigSchema => {
  const newSettings = [...formData.settings];
  newSettings[index] = settingData;
  return { settings: newSettings };
};

/**
 * 現在のタブインデックスを調整する純粋関数
 */
export const adjustCurrentTab = (
  currentTab: number,
  settingsLength: number,
): number => {
  if (currentTab >= settingsLength && currentTab > 0) {
    return currentTab - 1;
  }
  return currentTab;
};

/**
 * 新しいタブのインデックスを計算する純粋関数
 */
export const calculateNewTabIndex = (settingsLength: number): number =>
  settingsLength;

/**
 * 共通設定のデフォルト値を生成する純粋関数
 */
export const createDefaultCommonSetting = () => ({
  prefix: "",
});

/**
 * 既存の設定項目に不足しているプロパティを追加する純粋関数
 * 
 * 【なぜこの実装なのか】
 * - JSON Schemaで新しく必須プロパティが追加された際の後方互換性を保つため
 * - anyを使用: レガシーデータの構造が予測できないため型安全性よりも柔軟性を優先
 * - ||演算子でデフォルト値設定: undefinedやnullの場合に安全にフォールバック
 * - 全プロパティを明示的に列挙: 将来的な必須プロパティ追加時の修正箇所を明確化
 */
const ensureSettingProperties = (setting: any): ConfigSetting => ({
  name: setting.name || "",
  appId: setting.appId || "",
  targetField: setting.targetField || "",
  timestampField: setting.timestampField || "", // timestampField追加によるバリデーションエラー対策
  prefix: setting.prefix || "",
});

/**
 * レガシー設定データを新形式に変換する純粋関数
 * 型ガードを使用して安全に変換を行う
 * 
 * 【なぜこの実装なのか】
 */
export const convertLegacyConfig = (
  parsedConfig: LegacyConfig,
): ConfigSchema => {
  // 不正なデータの場合はデフォルト値を返す
  if (!isValidConfigObject(parsedConfig)) {
    return {
      settings: [],
      commonSetting: createDefaultCommonSetting(),
    };
  }

  // レガシー設定 V1 形式 (config プロパティでラップされた形式)
  if (isLegacyConfigV1(parsedConfig)) {
    const config = parsedConfig.config;
    return {
      // 【重要】既存設定にensureSettingPropertiesを適用してtimestampFieldを追加
      // スプレッド演算子だけでは新しい必須プロパティが欠落してバリデーションエラーになる
      settings: config.settings.map(ensureSettingProperties),
      commonSetting: config.commonSetting || createDefaultCommonSetting(),
    };
  }

  // レガシー設定 V2 形式 または 現在の形式
  if (isLegacyConfigV2(parsedConfig) || isCurrentConfigSchema(parsedConfig)) {
    return {
      // 【重要】現在の形式でもensureSettingPropertiesを適用
      // 理由: 段階的なスキーマ更新により一部プロパティが欠落している可能性があるため
      settings: parsedConfig.settings.map(ensureSettingProperties),
      commonSetting: parsedConfig.commonSetting || createDefaultCommonSetting(),
    };
  }

  // 未知の形式の場合はデフォルト値を返す
  return {
    settings: [],
    commonSetting: createDefaultCommonSetting(),
  };
};

/**
 * 保存用の設定データを作成する純粋関数
 */
export const createSaveConfig = (formData: ConfigSchema) => ({
  config: formData,
});
