import { createSaveConfig } from "../utils/configUtils";

import type { ConfigSchema } from "../../shared/types/Config";
import type { KintoneUtil } from "../../shared/util/KintoneUtil";

export interface IConfigService {
  loadConfig(): Promise<ConfigSchema>;
  saveConfig(data: ConfigSchema): Promise<void>;
}

export class ConfigService implements IConfigService {
  constructor(
    private pluginId: string,
    private kintoneUtil: typeof KintoneUtil,
  ) {}

  async loadConfig(): Promise<ConfigSchema> {
    try {
      const responseConfig = this.kintoneUtil.getConfig(this.pluginId);
      if (responseConfig.config) {
        const parsedConfig = JSON.parse(responseConfig.config);

        // 標準形式 { config: {...} } の場合
        if (
          parsedConfig &&
          typeof parsedConfig === "object" &&
          "config" in parsedConfig
        ) {
          const configData = parsedConfig.config;
          if (
            configData &&
            typeof configData === "object" &&
            "settings" in configData &&
            Array.isArray(configData.settings)
          ) {
            return configData as ConfigSchema;
          }
        }

        // フォールバック: 直接形式 { settings: [...] } の場合
        if (
          parsedConfig &&
          typeof parsedConfig === "object" &&
          "settings" in parsedConfig &&
          Array.isArray(parsedConfig.settings)
        ) {
          return parsedConfig as ConfigSchema;
        }
      }
      return { settings: [] };
    } catch (error) {
      console.error("Failed to load config:", error);
      return { settings: [] };
    }
  }

  async saveConfig(data: ConfigSchema): Promise<void> {
    return new Promise((resolve) => {
      const configSetting = createSaveConfig(data);
      kintone.plugin.app.setConfig(
        { config: JSON.stringify(configSetting) },
        () => {
          alert("設定が保存されました。");
          window.location.href = "../../flow?app=" + this.kintoneUtil.getId();
          resolve();
        },
      );
    });
  }
}
