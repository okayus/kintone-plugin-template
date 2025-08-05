import React, { useEffect, useState } from "react";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

import { Cache } from "../../shared/util/cache";

import type {
  AppSelectorProps,
  KintoneApp,
  KintoneField,
} from "../types/WidgetTypes";
import type { RegistryWidgetsType } from "@rjsf/utils";

const AppSelector = (props: AppSelectorProps) => {
  const { value, onChange, formContext } = props;
  const [apps, setApps] = useState<KintoneApp[]>([]);
  const [cache] = useState(() => Cache.getInstance());

  useEffect(() => {
    const loadApps = async () => {
      await cache.init();
      setApps(cache.getApps());
    };
    loadApps();
  }, [cache]);

  const handleAppChange = (newAppId: string) => {
    onChange(newAppId);
    // アプリが変更されたら、対象フィールドとタイムスタンプフィールドをリセット
    if (
      formContext?.currentIndex !== undefined &&
      formContext?.handleUpdateSetting
    ) {
      const currentSetting =
        formContext.formData.settings[formContext.currentIndex];
      if (currentSetting) {
        formContext.handleUpdateSetting(formContext.currentIndex, {
          ...currentSetting,
          appId: newAppId,
          targetField: "", // フィールドをリセット
          timestampField: "", // タイムスタンプフィールドもリセット
        });
      }
    }
  };

  return (
    <FormControl fullWidth>
      <InputLabel>対象アプリ</InputLabel>
      <Select
        value={value || ""}
        onChange={(e) => handleAppChange(e.target.value)}
        label="対象アプリ"
      >
        <MenuItem value="">
          <em>選択してください</em>
        </MenuItem>
        {apps.map((app) => (
          <MenuItem key={app.appId} value={app.appId}>
            {app.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const FieldSelector = (
  props: AppSelectorProps & { idSchema?: { $id?: string } },
) => {
  const { value, onChange, formContext, idSchema } = props;
  const [fields, setFields] = useState<KintoneField[]>([]);
  const [loading, setLoading] = useState(false);
  const [cache] = useState(() => Cache.getInstance());

  // 同じ配列内のappIdを取得
  const getCurrentAppId = () => {
    // タブUIの場合はcurrentSettingから取得
    if (formContext?.currentSetting) {
      return formContext.currentSetting.appId;
    }
    // 通常の配列UIの場合（フォールバック）
    const id = idSchema?.$id || "";
    const match = id.match(/settings_(\d+)_targetField/);
    if (match) {
      const index = parseInt(match[1], 10);
      return formContext?.formData?.settings?.[index]?.appId;
    }
    return null;
  };

  const appId = getCurrentAppId();

  useEffect(() => {
    const loadFields = async () => {
      if (!appId) {
        setFields([]);
        return;
      }

      setLoading(true);
      try {
        const properties = await cache.getFormFields(appId);
        const fieldOptions = Object.entries(properties)
          .filter(([, field]: [string, unknown]) => {
            const typedField = field as { type: string };
            // 表示可能なフィールドタイプのみ選択可能にする
            const allowedTypes = [
              "SINGLE_LINE_TEXT",
              "MULTI_LINE_TEXT",
              "NUMBER",
              "CALC",
              "RADIO_BUTTON",
              "DROP_DOWN",
              "DATE",
              "TIME",
              "DATETIME",
              "LINK",
              "RICH_TEXT",
            ];
            return allowedTypes.includes(typedField.type);
          })
          .map(([code, field]: [string, unknown]): KintoneField => {
            const typedField = field as { label?: string; type: string };
            return {
              code,
              label: typedField.label || code,
              type: typedField.type,
            };
          });
        setFields(fieldOptions);
      } catch (error) {
        console.error("Failed to load fields:", error);
        setFields([]);
      } finally {
        setLoading(false);
      }
    };

    loadFields();
  }, [appId, cache]);

  return (
    <FormControl fullWidth disabled={!appId || loading}>
      <InputLabel>対象フィールド</InputLabel>
      <Select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        label="対象フィールド"
      >
        <MenuItem value="">
          <em>選択してください</em>
        </MenuItem>
        {fields.map((field) => (
          <MenuItem key={field.code} value={field.code}>
            {field.label}
          </MenuItem>
        ))}
      </Select>
      {loading && <div>フィールドを読み込み中...</div>}
    </FormControl>
  );
};

const TimestampFieldSelector = (
  props: AppSelectorProps & { idSchema?: { $id?: string } },
) => {
  const { value, onChange, formContext, idSchema } = props;
  const [fields, setFields] = useState<KintoneField[]>([]);
  const [loading, setLoading] = useState(false);
  const [cache] = useState(() => Cache.getInstance());

  // 同じ配列内のappIdを取得
  const getCurrentAppId = () => {
    // タブUIの場合はcurrentSettingから取得
    if (formContext?.currentSetting) {
      return formContext.currentSetting.appId;
    }
    // 通常の配列UIの場合（フォールバック）
    const id = idSchema?.$id || "";
    const match = id.match(/settings_(\d+)_timestampField/);
    if (match) {
      const index = parseInt(match[1], 10);
      return formContext?.formData?.settings?.[index]?.appId;
    }
    return null;
  };

  const appId = getCurrentAppId();

  useEffect(() => {
    const loadTimestampFields = async () => {
      if (!appId) {
        setFields([]);
        return;
      }

      setLoading(true);
      try {
        const properties = await cache.getFormFields(appId);
        const fieldOptions = Object.entries(properties)
          .filter(([, field]: [string, unknown]) => {
            const typedField = field as { type: string };
            // DATETIMEフィールドのみ選択可能にする
            return typedField.type === "DATETIME";
          })
          .map(([code, field]: [string, unknown]): KintoneField => {
            const typedField = field as { label?: string; type: string };
            return {
              code,
              label: typedField.label || code,
              type: typedField.type,
            };
          });
        setFields(fieldOptions);
      } catch (error) {
        console.error("Failed to load timestamp fields:", error);
        setFields([]);
      } finally {
        setLoading(false);
      }
    };

    loadTimestampFields();
  }, [appId, cache]);

  return (
    <FormControl fullWidth disabled={!appId || loading}>
      <InputLabel>タイムスタンプフィールド</InputLabel>
      <Select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        label="タイムスタンプフィールド"
      >
        <MenuItem value="">
          <em>選択してください</em>
        </MenuItem>
        {fields.map((field) => (
          <MenuItem key={field.code} value={field.code}>
            {field.label} (DATETIME)
          </MenuItem>
        ))}
      </Select>
      {loading && <div>タイムスタンプフィールドを読み込み中...</div>}
    </FormControl>
  );
};

export const customWidgets: RegistryWidgetsType = {
  appSelector: AppSelector,
  fieldSelector: FieldSelector,
  timestampFieldSelector: TimestampFieldSelector,
};
