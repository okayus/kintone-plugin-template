import type { Record as KintoneRecord } from "@kintone/rest-api-client/lib/src/client/types";

export type KintoneEvent = AppRecordIndexShowEvent;

export type AppRecordIndexShowEvent = {
  appId: number;
  record: KintoneRecord;
  viewId: number;
  viewName: string;
};

/**
 * kintone プラグインの設定データ
 */
export interface KintonePluginConfig {
  [key: string]: string;
}

/**
 * kintone REST API のエラーレスポンス
 */
export interface KintoneAPIError {
  code: string;
  message: string;
  id: string;
  errors?: { [key: string]: { messages: string[] } };
}

/**
 * AJVバリデーションエラーの詳細情報
 * AJVのErrorObjectをベースにした型定義
 */
export interface ValidationError {
  keyword: string;
  instancePath: string;
  schemaPath: string;
  data: unknown;
  message?: string;
  params?: { [key: string]: unknown };
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationError[];
}
