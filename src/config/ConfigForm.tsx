import React, { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import Ajv from "ajv";

import configSchema from "../shared/jsonSchema/config.schema.json";
import { KintoneSdk } from "../shared/util/kintoneSdk";
import { KintoneUtil } from "../shared/util/KintoneUtil";
import { Cache } from "../shared/util/cache";

import type { ConfigSchema } from "../shared/types/Config";
import type { IChangeEvent } from "@rjsf/core";
import type { RJSFSchema, UiSchema, RegistryWidgetsType } from "@rjsf/utils";

interface AppProps {
  pluginId: string;
  kintoneSdk: KintoneSdk;
  kintoneUtil: typeof KintoneUtil;
}

const log = (type: string) => console.log.bind(console, type);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ConfigForm: React.FC<AppProps> = ({
  pluginId,
  kintoneSdk,
  kintoneUtil,
}) => {
  const [formData, setFormData] = useState<ConfigSchema>({ settings: [] });
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const responseConfig = kintoneUtil.getConfig(pluginId);
        if (responseConfig.config) {
          const parsedConfig = JSON.parse(responseConfig.config);
          // 旧形式のデータをサポート
          if (parsedConfig.config) {
            setFormData(parsedConfig.config);
          } else if (parsedConfig.settings) {
            setFormData(parsedConfig);
          }
        }
      } catch (error) {
        console.error("Failed to load config:", error);
      }
    };

    loadConfig();
  }, [pluginId, kintoneUtil]);

  const ajv = new Ajv();
  const validate = ajv.compile(configSchema);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleAddTab = () => {
    const newSetting = {
      name: `設定 ${formData.settings.length + 1}`,
      appId: '',
      targetField: '',
      prefix: ''
    };
    setFormData({
      ...formData,
      settings: [...formData.settings, newSetting]
    });
    setCurrentTab(formData.settings.length);
  };

  const handleDeleteTab = (index: number) => {
    const newSettings = formData.settings.filter((_, i) => i !== index);
    setFormData({ settings: newSettings });
    if (currentTab >= newSettings.length && currentTab > 0) {
      setCurrentTab(currentTab - 1);
    }
  };

  const handleUpdateSetting = (index: number, settingData: any) => {
    const newSettings = [...formData.settings];
    newSettings[index] = settingData;
    setFormData({ settings: newSettings });
  };

  const handleSubmit = (data: IChangeEvent<ConfigSchema>) => {
    const valid = validate(data.formData);
    if (!valid) {
      console.error("Validation errors:", validate.errors);
      alert("設定にエラーがあります。修正してください。");
      return;
    }

    const configSetting = { config: data.formData };
    kintone.plugin.app.setConfig(
      { config: JSON.stringify(configSetting) },
      function () {
        alert("設定が保存されました。");
        window.location.href = "../../flow?app=" + kintoneUtil.getId();
      },
    );
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target?.result as string);
          const valid = validate(importedConfig);
          if (!valid) {
            console.error("Validation errors:", validate.errors);
            alert("インポートした設定にエラーがあります。修正してください。");
            return;
          }
          setFormData(importedConfig);
          alert("設定がインポートされました。画面に反映されています。");
        } catch (error) {
          console.error("Failed to import config:", error);
          alert("設定のインポートに失敗しました。");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExport = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    downloadAnchorNode.setAttribute("download", `kintone-config-${timestamp}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const uiSchema: UiSchema = {
    settings: {
      items: {
        appId: {
          "ui:widget": "appSelector",
        },
        targetField: {
          "ui:widget": "fieldSelector",
        },
        prefix: {
          "ui:widget": "textarea",
        },
      },
    },
  };

  const customWidgets: RegistryWidgetsType = {
    appSelector: (props: any) => {
      const { value, onChange, formContext } = props;
      const [apps, setApps] = useState<any[]>([]);
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
        // アプリが変更されたら、対象フィールドをリセット
        if (formContext?.currentIndex !== undefined && formContext?.handleUpdateSetting) {
          const currentSetting = formContext.formData.settings[formContext.currentIndex];
          if (currentSetting) {
            formContext.handleUpdateSetting(formContext.currentIndex, {
              ...currentSetting,
              appId: newAppId,
              targetField: '' // フィールドをリセット
            });
          }
        }
      };

      return (
        <FormControl fullWidth>
          <InputLabel>対象アプリ</InputLabel>
          <Select
            value={value || ''}
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
    },
    fieldSelector: (props: any) => {
      const { value, onChange, formContext, idSchema, formData } = props;
      const [fields, setFields] = useState<any[]>([]);
      const [loading, setLoading] = useState(false);
      const [cache] = useState(() => Cache.getInstance());

      // 同じ配列内のappIdを取得
      const getCurrentAppId = () => {
        // タブUIの場合はcurrentSettingから取得
        if (formContext?.currentSetting) {
          return formContext.currentSetting.appId;
        }
        // 通常の配列UIの場合（フォールバック）
        const id = idSchema?.$id || '';
        const match = id.match(/settings_(\d+)_targetField/);
        if (match) {
          const index = parseInt(match[1]);
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
              .filter(([, field]: [string, any]) => {
                // 表示可能なフィールドタイプのみ選択可能にする
                const allowedTypes = [
                  'SINGLE_LINE_TEXT',
                  'MULTI_LINE_TEXT',
                  'NUMBER',
                  'CALC',
                  'RADIO_BUTTON',
                  'DROP_DOWN',
                  'DATE',
                  'TIME',
                  'DATETIME',
                  'LINK',
                  'RICH_TEXT'
                ];
                return allowedTypes.includes(field.type);
              })
              .map(([code, field]: [string, any]) => ({
                code,
                label: field.label || code
              }));
            setFields(fieldOptions);
          } catch (error) {
            console.error('Failed to load fields:', error);
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
            value={value || ''}
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
    },
  };

  // 個別の設定用スキーマを作成
  const createSettingSchema = () => {
    return {
      type: "object",
      properties: {
        name: configSchema.properties.settings.items.properties.name,
        appId: configSchema.properties.settings.items.properties.appId,
        targetField: configSchema.properties.settings.items.properties.targetField,
        prefix: configSchema.properties.settings.items.properties.prefix,
      },
      required: configSchema.properties.settings.items.required,
    };
  };

  const settingUiSchema = {
    appId: {
      "ui:widget": "appSelector",
    },
    targetField: {
      "ui:widget": "fieldSelector",
    },
    prefix: {
      "ui:widget": "textarea",
    },
  };

  return (
    <Box>
      <Paper sx={{ mt: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            {formData.settings.map((setting, index) => (
              <Tab
                key={index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{setting.name || `設定 ${index + 1}`}</span>
                    {formData.settings.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTab(index);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                }
              />
            ))}
            <IconButton onClick={handleAddTab} sx={{ ml: 1 }}>
              <AddIcon />
            </IconButton>
          </Tabs>
        </Box>

        {formData.settings.map((setting, index) => (
          <TabPanel key={index} value={currentTab} index={index}>
            <Form
              schema={createSettingSchema() as RJSFSchema}
              uiSchema={settingUiSchema}
              validator={validator}
              formData={setting}
              formContext={{ formData: formData, currentSetting: setting, currentIndex: index, handleUpdateSetting }}
              onChange={(e) => handleUpdateSetting(index, e.formData)}
              onError={log("errors")}
              widgets={customWidgets}
            >
              <div /> {/* Submit buttonを非表示にする */}
            </Form>
          </TabPanel>
        ))}

        {formData.settings.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTab}
            >
              設定を追加
            </Button>
          </Box>
        )}
      </Paper>

      <Box mt={3} display="flex" justifyContent="space-between">
        <Box display="flex" gap={2}>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: "none" }}
            id="import-button"
          />
          <label htmlFor="import-button">
            <Button variant="outlined" component="span">
              インポート
            </Button>
          </label>
          <Button variant="outlined" onClick={handleExport}>
            エクスポート
          </Button>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleSubmit({ formData } as IChangeEvent<ConfigSchema>)}
          disabled={formData.settings.length === 0}
        >
          保存
        </Button>
      </Box>
    </Box>
  );
};

export default ConfigForm;