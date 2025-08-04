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
 * レガシー設定データを新形式に変換する純粋関数
 * 型ガードを使用して安全に変換を行う
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
      ...config,
      commonSetting: config.commonSetting || createDefaultCommonSetting(),
    };
  }

  // レガシー設定 V2 形式 または 現在の形式
  if (isLegacyConfigV2(parsedConfig) || isCurrentConfigSchema(parsedConfig)) {
    return {
      ...parsedConfig,
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
