import type { Record } from "@kintone/rest-api-client/lib/src/client/types";

export type KintoneEvent = AppRecordIndexShowEvent;

export type AppRecordIndexShowEvent = {
  appId: number;
  record: Record;
  viewId: number;
  viewName: string;
};
