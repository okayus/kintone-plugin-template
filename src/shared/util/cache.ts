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
  restApiClient: KintoneRestAPIClient = new KintoneRestAPIClient(),
) => {
  // プライベート状態をクロージャで保持
  let apps: KintoneApp[] = [];
  let fieldsCache: { [appId: string]: Properties } = {};
  // Promiseキャッシュで競合状態を防ぐ（undefinedを明示的に含む）
  let fieldsPromiseCache: { [appId: string]: Promise<Properties> | undefined } =
    {};

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
     *
     * 【競合状態の解決】
     * Promiseキャッシュパターンを使用して、同じappIdに対する
     * 複数の同時リクエストが発生した場合でも、APIは一度だけ
     * 呼び出され、すべての呼び出し元が同じ結果を受け取る
     */
    getFormFields: async (appId: string | number): Promise<Properties> => {
      const appIdStr = String(appId);

      // データキャッシュから取得（既に完了済み）
      if (fieldsCache[appIdStr]) {
        return fieldsCache[appIdStr];
      }

      // Promiseキャッシュから取得（実行中）
      if (fieldsPromiseCache[appIdStr]) {
        return fieldsPromiseCache[appIdStr];
      }

      // 新しいAPI呼び出しを作成してPromiseキャッシュに保存
      const promise = (async () => {
        try {
          const response = await restApiClient.app.getFormFields({
            app: Number(appId),
            preview: true,
          });
          // 成功時はデータキャッシュに保存
          fieldsCache[appIdStr] = response.properties;
          return response.properties;
        } catch (error) {
          console.error(`Failed to fetch fields for app ${appId}:`, error);
          return {};
        } finally {
          // 完了後はPromiseキャッシュから削除（成功・失敗問わず）
          delete fieldsPromiseCache[appIdStr];
        }
      })();

      // Promiseキャッシュに保存
      fieldsPromiseCache[appIdStr] = promise;
      return promise;
    },

    /**
     * キャッシュをクリア
     */
    clearCache: (): void => {
      apps = [];
      fieldsCache = {};
      fieldsPromiseCache = {};
    },
  };
};

/**
 * キャッシュ関数の戻り値型
 * テスト時やコンポーネントの型定義で使用
 */
export type KintoneCache = ReturnType<typeof createKintoneCache>;
