import { KintoneSdk } from "./kintoneSdk";

import type { Properties } from "@kintone/rest-api-client/lib/src/client/types";

interface KintoneApp {
  appId: string;
  code: string;
  name: string;
  description: string;
  spaceId: string | null;
  threadId: string | null;
  createdAt: string;
  creator: {
    code: string;
    name: string;
  };
  modifiedAt: string;
  modifier: {
    code: string;
    name: string;
  };
}

export class Cache {
  private static instance: Cache | null = null;
  private apps: KintoneApp[] = [];
  private fieldsCache: { [appId: string]: Properties } = {};
  private kintoneSdk: KintoneSdk;

  constructor() {
    this.kintoneSdk = new KintoneSdk();
  }

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  async init(): Promise<void> {
    try {
      const response = await this.kintoneSdk.fetchApps();
      this.apps = response.apps;
    } catch (error) {
      console.error("Failed to initialize cache:", error);
      this.apps = [];
    }
  }

  getApps(): KintoneApp[] {
    return this.apps;
  }

  async getFormFields(appId: string | number): Promise<Properties> {
    const appIdStr = String(appId);

    if (this.fieldsCache[appIdStr]) {
      return this.fieldsCache[appIdStr];
    }

    try {
      const response = await this.kintoneSdk.fetchFields(Number(appId));
      this.fieldsCache[appIdStr] = response;
      return response;
    } catch (error) {
      console.error(`Failed to fetch fields for app ${appId}:`, error);
      return {};
    }
  }

  clearCache(): void {
    this.apps = [];
    this.fieldsCache = {};
  }
}
