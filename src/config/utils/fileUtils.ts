import type { ConfigSchema } from "../../shared/types/Config";
import type { FileOperationResult } from "../types/ConfigFormTypes";

/**
 * タイムスタンプを生成する純粋関数
 */
export const generateTimestamp = (date: Date = new Date()): string =>
  date.toISOString().replace(/[:.]/g, "-").split("T")[0];

/**
 * ダウンロード用のファイル名を生成する純粋関数
 */
export const generateDownloadFilename = (timestamp: string): string =>
  `kintone-config-${timestamp}.json`;

/**
 * データURLを生成する純粋関数
 */
export const generateDataUrl = (data: ConfigSchema): string =>
  "data:text/json;charset=utf-8," +
  encodeURIComponent(JSON.stringify(data, null, 2));

/**
 * ファイルエクスポート処理の純粋関数
 */
export const createExportData = (formData: ConfigSchema) => {
  const timestamp = generateTimestamp();
  const filename = generateDownloadFilename(timestamp);
  const dataUrl = generateDataUrl(formData);

  return {
    dataUrl,
    filename,
  };
};

/**
 * ファイル読み込み結果をパースする純粋関数
 */
export const parseImportedFile = (
  content: string,
  validator: (data: unknown) => boolean,
): FileOperationResult => {
  try {
    const importedConfig = JSON.parse(content) as ConfigSchema;
    const isValid = validator(importedConfig);

    if (!isValid) {
      return {
        success: false,
        error: "インポートした設定にエラーがあります。修正してください。",
      };
    }

    return {
      success: true,
      data: importedConfig,
    };
  } catch (error) {
    return {
      success: false,
      error: "設定のインポートに失敗しました。",
    };
  }
};

/**
 * ファイルダウンロードを実行する副作用関数
 * 注意: DOMの操作が含まれるため完全な純粋関数ではありません
 */
export const executeDownload = (dataUrl: string, filename: string): void => {
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataUrl);
  downloadAnchorNode.setAttribute("download", filename);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
