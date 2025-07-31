import configSchema from "../../shared/jsonSchema/config.schema.json";

import type { RJSFSchema } from "@rjsf/utils";

/**
 * 個別設定用のスキーマを生成する純粋関数
 */
export const createSettingSchema = (): RJSFSchema => ({
  type: "object",
  properties: {
    name: configSchema.properties.settings.items.properties.name as any,
    appId: configSchema.properties.settings.items.properties.appId as any,
    targetField: configSchema.properties.settings.items.properties
      .targetField as any,
    prefix: configSchema.properties.settings.items.properties.prefix as any,
  },
  required: configSchema.properties.settings.items.required as any,
});

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
