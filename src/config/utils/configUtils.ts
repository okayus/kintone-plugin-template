import type { ConfigSchema } from "../../shared/types/Config";
import type { Setting } from "../types/ConfigFormTypes";

/**
 * 新しい設定項目を作成する純粋関数
 */
export const createNewSetting = (index: number): Setting => ({
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
  settingData: Setting,
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
 * レガシー設定データを新形式に変換する純粋関数
 */
export const convertLegacyConfig = (parsedConfig: any): ConfigSchema => {
  // 旧形式のデータをサポート
  if (parsedConfig.config) {
    return parsedConfig.config;
  }
  if (parsedConfig.settings) {
    return parsedConfig;
  }
  return { settings: [] };
};

/**
 * 保存用の設定データを作成する純粋関数
 */
export const createSaveConfig = (formData: ConfigSchema) => ({
  config: formData,
});
