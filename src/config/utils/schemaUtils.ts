import configSchema from "../../shared/jsonSchema/config.schema.json";

import type { RJSFSchema } from "@rjsf/utils";

/**
 * 個別設定用のスキーマを生成する純粋関数
 * JSON schemaから直接参照することで、スキーマ変更に自動対応
 */
export const createSettingSchema = (): RJSFSchema => {
  // 契約プログラミング: 開発時にスキーマ構造を検証
  if (process.env.NODE_ENV === "development") {
    validateSchemaStructure();
  }

  return configSchema.properties.settings.items as RJSFSchema;
};

/**
 * スキーマ構造の整合性を検証する契約関数
 */
const validateSchemaStructure = (): void => {
  const settingsItems = configSchema.properties?.settings?.items;

  if (!settingsItems) {
    console.warn(
      "[Schema Validation] Warning: configSchema.properties.settings.items is missing. " +
        "This may indicate a breaking change in the JSON schema structure.",
    );
    return;
  }

  if (!settingsItems.properties || !settingsItems.required) {
    console.warn(
      "[Schema Validation] Warning: settings.items is missing 'properties' or 'required'. " +
        "Schema structure may have changed.",
    );
  }
};

/**
 * 共通設定用のスキーマを生成する純粋関数
 * JSON schemaから直接参照することで、スキーマ変更に自動対応
 */
export const createCommonSettingSchema = (): RJSFSchema => {
  // 契約プログラミング: 開発時にスキーマ構造を検証
  if (process.env.NODE_ENV === "development") {
    validateCommonSettingSchemaStructure();
  }

  return configSchema.properties.commonSetting as RJSFSchema;
};

/**
 * 共通設定スキーマ構造の整合性を検証する契約関数
 */
const validateCommonSettingSchemaStructure = (): void => {
  const commonSetting = configSchema.properties?.commonSetting;

  if (!commonSetting) {
    console.warn(
      "[Schema Validation] Warning: configSchema.properties.commonSetting is missing. " +
        "This may indicate a breaking change in the JSON schema structure.",
    );
    return;
  }

  if (!commonSetting.properties) {
    console.warn(
      "[Schema Validation] Warning: commonSetting is missing 'properties'. " +
        "Schema structure may have changed.",
    );
  }
};

/**
 * 共通設定用のUI Schemaを生成する純粋関数
 */
export const createCommonSettingUiSchema = () => ({
  prefix: {
    "ui:widget": "textarea",
  },
  targetView: {
    "ui:widget": "viewSelector",
  },
});

/**
 * 個別設定用のUI Schemaを生成する純粋関数
 */
export const createSettingUiSchema = () => ({
  appId: {
    "ui:widget": "appSelector",
  },
  targetField: {
    "ui:widget": "fieldSelector",
  },
  timestampField: {
    "ui:widget": "timestampFieldSelector",
  },
  prefix: {
    "ui:widget": "textarea",
  },
});
