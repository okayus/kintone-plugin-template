import {
  KintoneFormFieldProperty,
  KintoneRestAPIClient,
} from "@kintone/rest-api-client";

import type {
  AppID,
  Record,
} from "@kintone/rest-api-client/lib/src/client/types";

export class KintoneSdk {
  private restApiClient: KintoneRestAPIClient;

  constructor(restApiClient?: KintoneRestAPIClient) {
    this.restApiClient = restApiClient || new KintoneRestAPIClient();
  }

  public async fetchApps() {
    const apps = await this.restApiClient.app.getApps({
      ids: null,
      codes: null,
      name: null,
      spaceIds: null,
    });
    return apps;
  }

  public async fetchFields(appId: AppID, preview: boolean = true) {
    const fields = (
      await this.restApiClient.app.getFormFields({ app: appId, preview })
    ).properties;
    return fields;
  }

  public async getViews(appId: AppID) {
    const views = await this.restApiClient.app.getViews({ app: appId });
    return views;
  }

  public async getRecords(
    appId: AppID,
    fields: string[] = [],
    query: string = "",
  ) {
    const MAX_READ_LIMIT = 500;
    const MAX_TOTAL_RECORDS = 10000;

    let allRecords: Record[] = [];
    let offset = 0;

    while (allRecords.length < MAX_TOTAL_RECORDS) {
      const effectiveQuery = query.trim() ? `${query} ` : "";
      const paginatedQuery = `${effectiveQuery}limit ${MAX_READ_LIMIT} offset ${offset}`;

      const response = await this.restApiClient.record.getRecords({
        app: appId,
        fields,
        query: paginatedQuery,
      });

      allRecords = allRecords.concat(response.records);

      if (response.records.length < MAX_READ_LIMIT) break;

      offset += MAX_READ_LIMIT;
    }

    return { records: allRecords };
  }

  public async updateRecord(appId: AppID, recordId: number, record: Record) {
    const res = await this.restApiClient.record.updateRecord({
      app: appId,
      id: recordId,
      record,
    });
    return res;
  }

  public async updateAllRecords(
    appId: AppID,
    records: Array<{ id: string; record: Record }>,
  ) {
    const res = await this.restApiClient.record.updateAllRecords({
      app: appId,
      records,
    });
    return res;
  }
}

export type kintoneType = KintoneFormFieldProperty.OneOf["type"];
