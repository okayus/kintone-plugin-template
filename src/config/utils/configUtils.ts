import type { ConfigSchema } from "../../shared/types/Config";
import type { ConfigSetting } from "../types/ConfigFormTypes";

/**
 * ConfigSettingのデフォルト値を型安全に生成するファクトリー関数
 * 新しいプロパティがConfigSetting型に追加されると、ここでコンパイルエラーが発生し、
 * 開発者が更新箇所を見逃すことを防ぐ
 */
function createDefaultConfigSetting(): ConfigSetting {
  return {
    name: "",
    appId: "",
    targetField: "",
    timestampField: "",
    prefix: "",
    body: "",
  } satisfies ConfigSetting;
}

/**
 * 新しい設定項目を作成する純粋関数
 * createDefaultConfigSettingを活用して型安全に作成
 */
export const createNewSetting = (index: number): ConfigSetting => ({
  ...createDefaultConfigSetting(),
  name: `設定 ${index + 1}`,
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
  ...formData, // 既存のcommonSettingを保持
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
  return {
    ...formData, // 既存のcommonSettingを保持
    settings: newSettings,
  };
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
 * 保存用の設定データを作成する純粋関数
 */
export const createSaveConfig = (formData: ConfigSchema) => ({
  config: formData,
});
