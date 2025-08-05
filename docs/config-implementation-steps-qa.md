# React初学者向け：src/config/ の実装手順 Q&A

## Q: src/config/ をもう一回最初から実装する場合、どういう手順になる？

**前提条件:**
- TypeScript経験者
- React初学者
- kintone-plugin-templateプロジェクトでの開発

## A: 段階的実装手順（React初学者向け）

### Phase 1: 基盤設計とスキーマ定義 📋

#### Step 1-1: 型定義の作成
```bash
# まず型定義から始める（TypeScript経験者なので理解しやすい）
src/shared/types/Config.ts        # 共通設定の型定義
src/config/types/ConfigFormTypes.ts    # フォーム専用の型定義
src/config/types/WidgetTypes.ts        # カスタムウィジェット用の型定義
```

**現在の実装に基づいた型定義:**
```typescript
// src/shared/types/Config.ts
export interface ConfigSetting {
  name: string;
  appId: string;
  targetField: string;
  prefix: string;
}

export interface ConfigSchema {
  settings: ConfigSetting[];
  commonSetting?: {
    prefix: string;
  };
}

// src/config/types/ConfigFormTypes.ts
export interface ConfigFormState {
  formData: ConfigSchema;
  currentTab: number;
}

export interface ConfigFormActions {
  setFormData: (data: ConfigSchema) => void;
  setCurrentTab: (tab: number) => void;
  handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  handleAddTab: () => void;
  handleDeleteTab: (index: number) => void;
  handleUpdateSetting: (index: number, setting: ConfigSetting) => void;
  handleUpdateCommonSetting: (commonSetting: ConfigSchema["commonSetting"]) => void;
}

// src/config/types/WidgetTypes.ts
export interface KintoneApp {
  appId: string;
  name: string;
}

export interface KintoneField {
  code: string;
  label: string;
  type: string;
}

export interface CustomFormContext {
  formData: ConfigSchema;
  currentSetting: ConfigSetting;
  currentIndex: number;
  handleUpdateSetting: (index: number, setting: ConfigSetting) => void;
}
```

**React初学者ポイント:**
- TypeScriptの型システムをReactのイベントハンドラーに適用
- `React.SyntheticEvent` はReact独自のイベントオブジェクト
- 現在の実装では共通設定（commonSetting）も含む構造

#### Step 1-2: JSON Schemaとスキーマユーティリティ
```bash
src/config/utils/schemaUtils.ts
```

**現在の実装に対応したスキーマ:**
```typescript
import { RJSFSchema, UiSchema } from "@rjsf/utils";

// 個別設定用スキーマ
export const createSettingSchema = (): RJSFSchema => ({
  type: "object",
  properties: {
    name: { type: "string", title: "設定名" },
    appId: { type: "string", title: "対象アプリ" },
    targetField: { type: "string", title: "対象フィールド" },
    prefix: { type: "string", title: "通知メッセージのプレフィックス" },
  },
  required: ["name", "appId", "targetField", "prefix"],
  additionalProperties: false,
});

export const createSettingUiSchema = (): UiSchema => ({
  appId: { "ui:widget": "appSelector" },
  targetField: { "ui:widget": "fieldSelector" },
  prefix: { "ui:widget": "textarea" },
});

// 共通設定用スキーマ
export const createCommonSettingSchema = (): RJSFSchema => ({
  type: "object",
  properties: {
    prefix: { type: "string", title: "共通プレフィックス" },
  },
  additionalProperties: false,
});

export const createCommonSettingUiSchema = (): UiSchema => ({
  prefix: { "ui:widget": "textarea" },
});
```

### Phase 2: ビジネスロジック（純粋関数） 🔧

#### Step 2-1: データ操作の純粋関数
```bash
src/config/utils/configUtils.ts
```

**現在の実装に基づいた純粋関数:**
```typescript
import type { ConfigSchema, ConfigSetting } from "../../shared/types/Config";

// 新しい設定項目を作成する純粋関数
export const createNewSetting = (index: number): ConfigSetting => ({
  name: `設定 ${index + 1}`,
  appId: "",
  targetField: "",
  prefix: "",
});

// 設定を追加する純粋関数
export const addSetting = (formData: ConfigSchema): ConfigSchema => {
  const newSetting = createNewSetting(formData.settings.length);
  return {
    ...formData,
    settings: [...formData.settings, newSetting],
  };
};

// 設定を削除する純粋関数
export const deleteSetting = (
  formData: ConfigSchema,
  index: number,
): ConfigSchema => ({
  ...formData,
  settings: formData.settings.filter((_, i) => i !== index),
});

// 設定を更新する純粋関数
export const updateSetting = (
  formData: ConfigSchema,
  index: number,
  settingData: ConfigSetting,
): ConfigSchema => {
  const newSettings = [...formData.settings];
  newSettings[index] = settingData;
  return { ...formData, settings: newSettings };
};

// タブインデックスを調整する純粋関数
export const adjustCurrentTab = (
  currentTab: number,
  settingsLength: number,
): number => {
  if (currentTab >= settingsLength && currentTab > 0) {
    return currentTab - 1;
  }
  return currentTab;
};

// 新しいタブのインデックスを計算する純粋関数
export const calculateNewTabIndex = (settingsLength: number): number =>
  settingsLength;

// 共通設定のデフォルト値を生成する純粋関数
export const createDefaultCommonSetting = () => ({
  prefix: "",
});
```

**React初学者ポイント:**
- イミュータブル（不変性）：元のデータを変更せず新しいデータを作成
- `...`（スプレッド構文）でオブジェクトや配列をコピー
- 現在の実装では共通設定の管理機能も含む

### Phase 3: サービス層（依存性注入） 🏗️

#### Step 3-1: サービスクラスの作成
```bash
src/config/services/ConfigService.ts
src/config/services/ValidationService.ts  
src/config/services/FileService.ts
```

**現在の実装に対応したサービス層:**
```typescript
// src/config/services/ConfigService.ts
import { convertLegacyConfig, createSaveConfig } from "../utils/configUtils";
import type { ConfigSchema } from "../../shared/types/Config";

export interface IConfigService {
  loadConfig(): Promise<ConfigSchema>;
  saveConfig(data: ConfigSchema): Promise<void>;
}

export class ConfigService implements IConfigService {
  constructor(
    private pluginId: string,
    private kintoneUtil: typeof KintoneUtil,
  ) {}

  async loadConfig(): Promise<ConfigSchema> {
    try {
      const responseConfig = this.kintoneUtil.getConfig(this.pluginId);
      if (responseConfig.config) {
        const parsedConfig = JSON.parse(responseConfig.config) as unknown;
        return convertLegacyConfig(parsedConfig);
      }
      return { settings: [] };
    } catch (error) {
      console.error("Failed to load config:", error);
      return { settings: [] };
    }
  }

  async saveConfig(data: ConfigSchema): Promise<void> {
    return new Promise((resolve) => {
      const configSetting = createSaveConfig(data);
      kintone.plugin.app.setConfig(
        { config: JSON.stringify(configSetting) },
        () => {
          alert("設定が保存されました。");
          window.location.href = "../../flow?app=" + this.kintoneUtil.getId();
          resolve();
        },
      );
    });
  }
}

// src/config/services/ValidationService.ts
import Ajv, { ValidateFunction } from "ajv";
import type { ConfigSchema } from "../../shared/types/Config";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface IValidationService {
  validate(data: ConfigSchema): ValidationResult;
}

export class ValidationService implements IValidationService {
  private validateFunction: ValidateFunction;

  constructor() {
    const ajv = new Ajv();
    this.validateFunction = ajv.compile(this.getSchema());
  }

  validate(data: ConfigSchema): ValidationResult {
    const isValid = this.validateFunction(data);
    return {
      isValid,
      errors: isValid ? [] : (this.validateFunction.errors || []).map(err => err.message || ""),
    };
  }

  private getSchema() {
    // バリデーション用のスキーマ定義
    return {
      type: "object",
      properties: {
        settings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              appId: { type: "string" },
              targetField: { type: "string" },
              prefix: { type: "string" },
            },
            required: ["name", "appId", "targetField", "prefix"],
          },
        },
      },
      required: ["settings"],
    };
  }
}
```

**React初学者ポイント:**
- インターフェース指向設計：テスト用のモックサービスと交換可能
- async/await：非同期処理の現代的な書き方
- レガシー設定データの安全な変換機能を含む

### Phase 4: カスタムフック（状態管理） 🎣

#### Step 4-1: 状態管理フックの作成
```bash
src/config/hooks/useConfigData.ts
src/config/hooks/useConfigPersistence.ts
```

**現在の実装の分離されたフック設計:**
```typescript
// src/config/hooks/useConfigData.ts
import { useState } from "react";
import {
  addSetting,
  adjustCurrentTab,
  calculateNewTabIndex,
  createDefaultCommonSetting,
  deleteSetting,
  updateSetting,
} from "../utils/configUtils";
import type { ConfigSchema } from "../../shared/types/Config";
import type { ConfigFormState, ConfigSetting } from "../types/ConfigFormTypes";

export const useConfigData = (
  initialData: ConfigSchema = {
    settings: [],
    commonSetting: createDefaultCommonSetting(),
  },
) => {
  const [formData, setFormData] = useState<ConfigSchema>(initialData);
  const [currentTab, setCurrentTab] = useState(0);

  const state: ConfigFormState = {
    formData,
    currentTab,
  };

  const actions = {
    setFormData,
    setCurrentTab,

    handleTabChange: (_: React.SyntheticEvent, newValue: number) => {
      setCurrentTab(newValue);
    },

    handleAddTab: () => {
      const newFormData = addSetting(formData);
      setFormData(newFormData);
      setCurrentTab(calculateNewTabIndex(formData.settings.length));
    },

    handleDeleteTab: (index: number) => {
      const newFormData = deleteSetting(formData, index);
      setFormData(newFormData);
      setCurrentTab(adjustCurrentTab(currentTab, newFormData.settings.length));
    },

    handleUpdateSetting: (index: number, settingData: ConfigSetting) => {
      const newFormData = updateSetting(formData, index, settingData);
      setFormData(newFormData);
    },

    handleUpdateCommonSetting: (
      commonSettingData: ConfigSchema["commonSetting"],
    ) => {
      const newFormData: ConfigSchema = commonSettingData
        ? { ...formData, commonSetting: commonSettingData }
        : { ...formData };
      setFormData(newFormData);
    },
  };

  return {
    state,
    actions,
  };
};

// src/config/hooks/useConfigPersistence.ts
import { useEffect } from "react";
import type { ConfigSchema } from "../../shared/types/Config";
import type { IConfigService } from "../services/ConfigService";
import type { IFileService } from "../services/FileService";
import type { IValidationService } from "../services/ValidationService";

interface UseConfigPersistenceOptions {
  configService: IConfigService;
  validationService: IValidationService;
  fileService: IFileService;
  onDataLoaded: (data: ConfigSchema) => void;
}

export const useConfigPersistence = ({
  configService,
  validationService,
  fileService,
  onDataLoaded,
}: UseConfigPersistenceOptions) => {
  // 初期データロード
  useEffect(() => {
    const loadData = async () => {
      const data = await configService.loadConfig();
      onDataLoaded(data);
    };
    loadData();
  }, [configService, onDataLoaded]);

  const handleSubmit = async (data: ConfigSchema) => {
    const validationResult = validationService.validate(data);

    if (!validationResult.isValid) {
      console.error("Validation errors:", validationResult.errors);
      alert("設定にエラーがあります。修正してください。");
      return;
    }

    try {
      await configService.saveConfig(data);
    } catch (error) {
      console.error("Failed to save config:", error);
      alert("設定の保存に失敗しました。");
    }
  };

  const handleImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (data: ConfigSchema) => void,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await fileService.importConfig(file);

      if (result.success && result.data) {
        onSuccess(result.data);
        alert("設定がインポートされました。画面に反映されています。");
      } else {
        alert(result.error || "インポートに失敗しました。");
      }
    } catch (error) {
      console.error("Failed to import config:", error);
      alert("設定のインポートに失敗しました。");
    }
  };

  const handleExport = (data: ConfigSchema) => {
    fileService.exportConfig(data);
  };

  return {
    handleSubmit,
    handleImport,
    handleExport,
  };
};
```

**React初学者ポイント:**
- **責務の分離**: useConfigData（状態管理）とuseConfigPersistence（永続化）を分離
- **カスタムフック**: ロジックを関数として切り出し、複数コンポーネントで再利用
- **Dependency Injection**: onDataLoadedコールバックで外部からの状態更新方法を注入

### Phase 5: カスタムウィジェット 🔧

#### Step 5-1: 動的フィールド選択ウィジェット
```bash
src/config/widgets/AppFieldSelectorWidget.tsx
src/config/widgets/CustomWidgets.tsx
```

**現在の実装の高度なウィジェット:**
```typescript
// src/config/widgets/AppFieldSelectorWidget.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import type { WidgetProps } from "@rjsf/utils";
import { KintoneFieldCache } from "../services/KintoneFieldCache";
import type { KintoneApp, KintoneField } from "../types/WidgetTypes";

const AppFieldSelectorWidget: React.FC<WidgetProps> = ({
  value,
  onChange,
  schema,
  formContext,
}) => {
  const [apps, setApps] = useState<KintoneApp[]>([]);
  const [fields, setFields] = useState<KintoneField[]>([]);
  const [loading, setLoading] = useState(false);

  const cache = useMemo(() => new KintoneFieldCache(), []);
  const isAppSelector = schema.title?.includes("アプリ");
  const currentAppId = formContext?.currentSetting?.appId;

  // アプリ一覧の取得
  useEffect(() => {
    if (isAppSelector) {
      cache.getApps().then(setApps);
    }
  }, [cache, isAppSelector]);

  // フィールド一覧の取得
  useEffect(() => {
    if (!isAppSelector && currentAppId) {
      setLoading(true);
      cache.getFields(currentAppId).then((fieldList) => {
        setFields(fieldList);
        setLoading(false);
      });
    }
  }, [cache, isAppSelector, currentAppId]);

  const handleAppChange = useCallback((event: SelectChangeEvent) => {
    const newAppId = event.target.value;
    onChange(newAppId);

    // アプリ変更時は対象フィールドをリセット
    if (formContext?.handleUpdateSetting) {
      const updatedSetting = {
        ...formContext.currentSetting,
        appId: newAppId,
        targetField: "", // フィールドリセット
      };
      formContext.handleUpdateSetting(formContext.currentIndex, updatedSetting);
    }
  }, [onChange, formContext]);

  const handleFieldChange = useCallback((event: SelectChangeEvent) => {
    onChange(event.target.value);
  }, [onChange]);

  if (isAppSelector) {
    return (
      <FormControl fullWidth>
        <InputLabel>対象アプリ</InputLabel>
        <Select
          value={value || ""}
          onChange={handleAppChange}
          label="対象アプリ"
        >
          {apps.map((app) => (
            <MenuItem key={app.appId} value={app.appId}>
              {app.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <FormControl fullWidth>
      <InputLabel>対象フィールド</InputLabel>
      <Select
        value={value || ""}
        onChange={handleFieldChange}
        label="対象フィールド"
        disabled={!currentAppId || loading}
      >
        {fields.map((field) => (
          <MenuItem key={field.code} value={field.code}>
            {field.label} ({field.type})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default AppFieldSelectorWidget;
```

### Phase 6: UIコンポーネント（単一責任） 🎨

#### Step 6-1: タブ化されたコンポーネント
```bash
src/config/components/TabHeader.tsx
src/config/components/SettingForm.tsx
src/config/components/CommonSettingForm.tsx
src/config/components/ActionButtons.tsx
```

**現在の実装のタブ対応コンポーネント:**
```typescript
// src/config/components/TabHeader.tsx
import React from "react";
import { Box, Tab, Tabs, IconButton } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import type { ConfigSchema } from "../../shared/types/Config";

interface TabHeaderProps {
  formData: ConfigSchema;
  currentTab: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onAddTab: () => void;
  onDeleteTab: (index: number) => void;
}

export const TabHeader: React.FC<TabHeaderProps> = ({
  formData,
  currentTab,
  onTabChange,
  onAddTab,
  onDeleteTab,
}) => (
  <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
    <Tabs value={currentTab} onChange={onTabChange}>
      {formData.settings.map((setting, index) => (
        <Tab
          key={index}
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span>{setting.name || `設定 ${index + 1}`}</span>
              {formData.settings.length > 1 && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTab(index);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          }
        />
      ))}
    </Tabs>
    <IconButton onClick={onAddTab} sx={{ ml: 1 }}>
      <AddIcon />
    </IconButton>
  </Box>
);

// src/config/components/CommonSettingForm.tsx
import React from "react";
import { Paper, Typography, Box } from "@mui/material";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { ConfigSchema } from "../../shared/types/Config";

interface CommonSettingFormProps {
  formData: ConfigSchema;
  schema: RJSFSchema;
  uiSchema: UiSchema;
  onUpdateCommonSetting: (data: ConfigSchema["commonSetting"]) => void;
}

export const CommonSettingForm: React.FC<CommonSettingFormProps> = ({
  formData,
  schema,
  uiSchema,
  onUpdateCommonSetting,
}) => (
  <Paper sx={{ p: 2, mb: 2 }}>
    <Typography variant="h6" gutterBottom>
      共通設定
    </Typography>
    <Box>
      <Form
        schema={schema}
        uiSchema={uiSchema}
        validator={validator}
        formData={formData.commonSetting}
        onChange={(e) => onUpdateCommonSetting(e.formData)}
        onSubmit={() => {}} // 個別の送信は無効化
      >
        <div />
      </Form>
    </Box>
  </Paper>
);
```

### Phase 7: メインコンポーネントの統合 🏠

#### Step 7-1: ConfigFormの実装
```bash
src/config/ConfigForm.tsx
```

**現在の実装のサービス統合パターン:**
```typescript
// src/config/ConfigForm.tsx
import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";

import { KintoneSdk } from "../shared/util/kintoneSdk";
import { KintoneUtil } from "../shared/util/KintoneUtil";

// Components
import { ActionButtons } from "./components/ActionButtons";
import { CommonSettingForm } from "./components/CommonSettingForm";
import { SettingForm } from "./components/SettingForm";
import { TabHeader } from "./components/TabHeader";
// Hooks
import { useConfigData } from "./hooks/useConfigData";
import { useConfigPersistence } from "./hooks/useConfigPersistence";
// Services
import { ConfigService } from "./services/ConfigService";
import { FileService } from "./services/FileService";
import { ValidationService } from "./services/ValidationService";
// Utils
import {
  createCommonSettingSchema,
  createCommonSettingUiSchema,
  createSettingSchema,
  createSettingUiSchema,
} from "./utils/schemaUtils";

interface AppProps {
  pluginId: string;
  kintoneSdk: KintoneSdk;
  kintoneUtil: typeof KintoneUtil;
}

const ConfigForm: React.FC<AppProps> = ({ pluginId, kintoneUtil }) => {
  // Services initialization with dependency injection
  const services = useMemo(() => {
    const configService = new ConfigService(pluginId, kintoneUtil);
    const validationService = new ValidationService();
    const fileService = new FileService(validationService);

    return { configService, validationService, fileService };
  }, [pluginId, kintoneUtil]);

  // State management
  const { state, actions } = useConfigData();
  const { formData, currentTab } = state;

  // Persistence operations
  const { handleSubmit, handleImport, handleExport } = useConfigPersistence({
    ...services,
    onDataLoaded: actions.setFormData,
  });

  // Schema generation
  const schema = useMemo(() => createSettingSchema(), []);
  const uiSchema = useMemo(() => createSettingUiSchema(), []);
  const commonSchema = useMemo(() => createCommonSettingSchema(), []);
  const commonUiSchema = useMemo(() => createCommonSettingUiSchema(), []);

  // Event handlers
  const onSubmit = () => handleSubmit(formData);
  const onImport = (event: React.ChangeEvent<HTMLInputElement>) =>
    handleImport(event, actions.setFormData);
  const onExport = () => handleExport(formData);

  return (
    <Box>
      {/* 共通設定セクション */}
      <CommonSettingForm
        formData={formData}
        schema={commonSchema}
        uiSchema={commonUiSchema}
        onUpdateCommonSetting={actions.handleUpdateCommonSetting}
      />

      {/* 個別設定タブセクション */}
      <Paper sx={{ mt: 2 }}>
        <TabHeader
          formData={formData}
          currentTab={currentTab}
          onTabChange={actions.handleTabChange}
          onAddTab={actions.handleAddTab}
          onDeleteTab={actions.handleDeleteTab}
        />

        <SettingForm
          formData={formData}
          currentTab={currentTab}
          schema={schema}
          uiSchema={uiSchema}
          onUpdateSetting={actions.handleUpdateSetting}
        />
      </Paper>

      <ActionButtons
        formData={formData}
        onImport={onImport}
        onExport={onExport}
        onSubmit={onSubmit}
        onAddTab={actions.handleAddTab}
      />
    </Box>
  );
};

export default ConfigForm;
```

**React初学者ポイント:**
- **useMemo でサービス最適化**: 依存関係が変わった時のみサービス再作成
- **フック間の連携**: onDataLoaded コールバックで状態管理と永続化を連携
- **責務の明確な分離**: UI、状態管理、永続化、ビジネスロジックが独立

## 実装順序のポイント 🎯

### なぜこの順序なのか？

1. **型定義から開始** → TypeScript経験者にとって馴染みやすい
2. **純粋関数でロジック** → テストしやすく、理解しやすい
3. **サービス層で外部依存** → Reactとは独立してテスト可能
4. **分離されたカスタムフック** → 状態管理と永続化の責務を明確に分離
5. **高度なカスタムウィジェット** → 動的フィールド選択などの複雑なUI
6. **コンポーネント分割** → 共通設定とタブ化された個別設定
7. **最後に統合** → 依存性注入パターンで全体を組み立て

### React初学者が躓きやすいポイントと対策

#### 1. フック間の連携パターン
```typescript
// ✅ 現在の実装：責務を分離したフック連携
const { state, actions } = useConfigData();
const { handleSubmit } = useConfigPersistence({
  ...services,
  onDataLoaded: actions.setFormData,  // コールバックで連携
});
```

#### 2. 依存性注入パターン
```typescript
// ✅ サービスの注入による疎結合
const services = useMemo(() => {
  const configService = new ConfigService(pluginId, kintoneUtil);
  const validationService = new ValidationService();
  const fileService = new FileService(validationService);
  return { configService, validationService, fileService };
}, [pluginId, kintoneUtil]);
```

#### 3. 動的ウィジェットの状態管理
```typescript
// ✅ アプリ選択時のフィールドリセット
const handleAppChange = useCallback((event: SelectChangeEvent) => {
  const newAppId = event.target.value;
  onChange(newAppId);
  
  // 他の設定に影響を与えずにフィールドをリセット
  if (formContext?.handleUpdateSetting) {
    const updatedSetting = {
      ...formContext.currentSetting,
      appId: newAppId,
      targetField: "", // フィールドリセット
    };
    formContext.handleUpdateSetting(formContext.currentIndex, updatedSetting);
  }
}, [onChange, formContext]);
```

## 開発時のチェックポイント ✅

### Phase完了後の確認事項

- [ ] **Phase 1**: 型定義が完全で、共通設定も含む構造になっている
- [ ] **Phase 2**: 純粋関数のテストが書ける（レガシー変換含む）
- [ ] **Phase 3**: サービスクラスが独立してテスト可能（インターフェース指向）
- [ ] **Phase 4**: 分離されたカスタムフックが適切に連携する
- [ ] **Phase 5**: カスタムウィジェットが動的フィールド選択を実現する
- [ ] **Phase 6**: 共通設定とタブ化されたコンポーネントが動作する
- [ ] **Phase 7**: 依存性注入パターンで全体が統合されて動作する

## 現在の実装の特徴 🚀

### 高度な機能
1. **レガシー設定対応**: 型ガードによる安全な設定データ移行
2. **動的フィールド選択**: アプリ選択に連動したフィールド一覧更新
3. **共通設定**: 全設定に共通する項目の管理
4. **タブ化UI**: 複数設定の見やすい管理
5. **インポート/エクスポート**: 設定データのファイル操作
6. **キャッシュ機能**: kintoneAPIレスポンスの効率的な管理

### 設計パターン
- **Repository Pattern**: サービス層でデータアクセスを抽象化
- **Dependency Injection**: インターフェースによる疎結合設計
- **Observer Pattern**: コールバックによるフック間連携
- **Command Pattern**: 各操作を独立したコマンドとして実装

この手順により、React初学者でもTypeScriptの知識を活かしながら、高度で保守性の高いReactアプリケーションを段階的に構築できます。