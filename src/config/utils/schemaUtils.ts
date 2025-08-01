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
 * UI Schemaを生成する純粋関数
 */
export const createSettingUiSchema = () => ({
  appId: {
    "ui:widget": "appSelector",
  },
  targetField: {
    "ui:widget": "fieldSelector",
  },
  prefix: {
    "ui:widget": "textarea",
  },
});
