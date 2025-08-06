import { KintoneRestAPIClient } from "@kintone/rest-api-client";

import type { KintoneApp } from "../../config/types/WidgetTypes";
import type { Properties } from "@kintone/rest-api-client/lib/src/client/types";

/**
 * クロージャベースのkintoneキャッシュ実装
 *
 * 【なぜクロージャを使用するか】
 * 1. シンプルさ: クラス定義不要で関数型プログラミング的
 * 2. メモリ効率: シングルトンインスタンスが不要
 * 3. テスト容易性: 各コンポーネントで独立したキャッシュインスタンス作成可能
 * 4. TypeScript親和性: より直感的なAPI設計
 * 
 * 【なぜKintoneRestAPIClientを直接使用するか】
 * 1. 依存関係の単純化: 中間レイヤー（KintoneSdk）を排除
 * 2. テスト容易性の向上: KintoneRestAPIClientを直接モックできる
 * 3. パフォーマンス向上: 不要なラッパーレイヤーの削除
 */
export const createKintoneCache = (
  restApiClient: KintoneRestAPIClient = new KintoneRestAPIClient()
) => {
  // プライベート状態をクロージャで保持
  let apps: KintoneApp[] = [];
  let fieldsCache: { [appId: string]: Properties } = {};

  return {
    /**
     * キャッシュを初期化し、アプリ一覧を取得
     */
    init: async (): Promise<void> => {
      try {
        const response = await restApiClient.app.getApps({
          ids: null,
          codes: null,
          name: null,
          spaceIds: null,
        });
        // response.appsを簡略化されたKintoneApp型に変換
        apps = response.apps.map((app) => ({
          appId: app.appId,
          name: app.name,
        }));
      } catch (error) {
        console.error("Failed to initialize cache:", error);
        apps = [];
      }
    },

    /**
     * キャッシュされたアプリ一覧を取得
     */
    getApps: (): KintoneApp[] => {
      return apps;
    },

    /**
     * 指定されたアプリのフォームフィールドを取得（キャッシュ機能付き）
     */
    getFormFields: async (appId: string | number): Promise<Properties> => {
      const appIdStr = String(appId);

      // キャッシュから取得
      if (fieldsCache[appIdStr]) {
        return fieldsCache[appIdStr];
      }

      // APIから取得してキャッシュに保存
      try {
        const response = await restApiClient.app.getFormFields({ 
          app: Number(appId), 
          preview: true 
        });
        fieldsCache[appIdStr] = response.properties;
        return response.properties;
      } catch (error) {
        console.error(`Failed to fetch fields for app ${appId}:`, error);
        return {};
      }
    },

    /**
     * キャッシュをクリア
     */
    clearCache: (): void => {
      apps = [];
      fieldsCache = {};
    },
  };
};

/**
 * キャッシュ関数の戻り値型
 * テスト時やコンポーネントの型定義で使用
 */
export type KintoneCache = ReturnType<typeof createKintoneCache>;
