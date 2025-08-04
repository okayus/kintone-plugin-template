import type { KintonePluginConfig } from "../types/KintoneTypes";

export class KintoneUtil {
  static getConfig(pluginId: string): KintonePluginConfig {
    return kintone.plugin.app.getConfig(pluginId);
  }

  static setConfig(config: KintonePluginConfig, callback: () => void): void {
    kintone.plugin.app.setConfig(config, callback);
  }

  static getAppId(): number | null {
    return kintone.app.getId();
  }

  static getId(): number | null {
    return kintone.app.getId();
  }
}
