export class KintoneUtil {
  static getConfig(pluginId: string): any {
    return kintone.plugin.app.getConfig(pluginId);
  }

  static setConfig(config: any, callback: () => void): void {
    kintone.plugin.app.setConfig(config, callback);
  }

  static getAppId(): number | null {
    return kintone.app.getId();
  }

  static getId(): number | null {
    return kintone.app.getId();
  }
}
