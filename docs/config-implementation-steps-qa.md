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
src/config/types/ConfigFormTypes.ts
```

```typescript
// 設定データの構造を定義
export interface ConfigSetting {
  name: string;
  appId: string;
  targetField: string;
  prefix: string;
}

export interface ConfigSchema {
  settings: ConfigSetting[];
}

// React初学者向け：イベントハンドラーの型定義
export interface ConfigFormActions {
  handleAddTab: () => void;
  handleDeleteTab: (index: number) => void;
  handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  handleUpdateSetting: (index: number, setting: ConfigSetting) => void;
}
```

**React初学者ポイント:**
- TypeScriptの型システムをReactのイベントハンドラーに適用
- `React.SyntheticEvent` はReact独自のイベントオブジェクト

#### Step 1-2: JSON Schemaとスキーマユーティリティ
```bash
src/config/utils/schemaUtils.ts
```

```typescript
import { RJSFSchema, UiSchema } from "@rjsf/utils";

// 純粋関数でスキーマを生成（副作用なし）
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

export const settingUiSchema: UiSchema = {
  appId: { "ui:widget": "appSelector" },
  targetField: { "ui:widget": "fieldSelector" },
  prefix: { "ui:widget": "textarea" },
};
```

**React初学者ポイント:**
- 純粋関数：同じ入力→同じ出力、副作用なし
- react-jsonschema-formでフォームを自動生成する仕組み

### Phase 2: ビジネスロジック（純粋関数） 🔧

#### Step 2-1: データ操作の純粋関数
```bash
src/config/utils/configUtils.ts
```

```typescript
import { ConfigSchema, ConfigSetting } from "../types/ConfigFormTypes";

// 設定追加（元のデータを変更せず、新しいオブジェクトを返す）
export const addSetting = (formData: ConfigSchema): ConfigSchema => {
  const newSetting = createNewSetting(formData.settings.length);
  return {
    ...formData,  // スプレッド構文でコピー
    settings: [...formData.settings, newSetting],  // 配列もコピーして追加
  };
};

// 設定削除
export const removeSetting = (formData: ConfigSchema, index: number): ConfigSchema => ({
  ...formData,
  settings: formData.settings.filter((_, i) => i !== index),
});

// 設定更新
export const updateSetting = (
  formData: ConfigSchema,
  index: number,
  newSetting: ConfigSetting
): ConfigSchema => {
  const newSettings = [...formData.settings];
  newSettings[index] = newSetting;
  return { ...formData, settings: newSettings };
};

const createNewSetting = (index: number): ConfigSetting => ({
  name: `設定 ${index + 1}`,
  appId: '',
  targetField: '',
  prefix: '',
});
```

**React初学者ポイント:**
- イミュータブル（不変性）：元のデータを変更せず新しいデータを作成
- `...`（スプレッド構文）でオブジェクトや配列をコピー
- `filter()`、`map()`などの配列メソッドは新しい配列を返す

### Phase 3: サービス層（依存性注入） 🏗️

#### Step 3-1: サービスクラスの作成
```bash
src/config/services/ConfigService.ts
```

```typescript
import { ConfigSchema } from "../types/ConfigFormTypes";

export class ConfigService {
  async getConfig(): Promise<ConfigSchema> {
    try {
      const config = kintone.plugin.app.getConfig(PLUGIN_ID);
      return config ? JSON.parse(config.settings || '{"settings":[]}') : { settings: [] };
    } catch (error) {
      console.error('Failed to load config:', error);
      return { settings: [] };
    }
  }

  async saveConfig(formData: ConfigSchema): Promise<void> {
    const config = { settings: JSON.stringify(formData) };
    kintone.plugin.app.setConfig(config);
  }
}
```

**React初学者ポイント:**
- クラスベースのサービス：Reactコンポーネントとは別の責任
- async/await：非同期処理の現代的な書き方
- 依存性注入：後でテスト用のモックサービスと交換可能

### Phase 4: カスタムフック（状態管理） 🎣

#### Step 4-1: 状態管理フックの作成
```bash
src/config/hooks/useConfigData.ts
```

```typescript
import { useState } from "react";
import { ConfigSchema, ConfigFormActions } from "../types/ConfigFormTypes";
import { addSetting, removeSetting, updateSetting } from "../utils/configUtils";

// カスタムフック：ロジックを再利用可能な形で提供
export const useConfigData = (initialData: ConfigSchema = { settings: [] }) => {
  // React Hooks：関数コンポーネントで状態を管理
  const [formData, setFormData] = useState<ConfigSchema>(initialData);
  const [currentTab, setCurrentTab] = useState<number>(0);

  // イベントハンドラーをオブジェクトにまとめる
  const actions: ConfigFormActions = {
    handleAddTab: () => {
      const newFormData = addSetting(formData);  // 純粋関数を使用
      setFormData(newFormData);
      setCurrentTab(formData.settings.length);
    },
    
    handleDeleteTab: (index: number) => {
      const newFormData = removeSetting(formData, index);
      setFormData(newFormData);
      
      // タブ位置の調整
      if (currentTab >= newFormData.settings.length && currentTab > 0) {
        setCurrentTab(currentTab - 1);
      }
    },
    
    handleTabChange: (_: React.SyntheticEvent, newValue: number) => {
      setCurrentTab(newValue);
    },
    
    handleUpdateSetting: (index: number, newSetting: ConfigSetting) => {
      const newFormData = updateSetting(formData, index, newSetting);
      setFormData(newFormData);
    },
  };

  return {
    state: { formData, currentTab },
    actions,
  };
};
```

**React初学者ポイント:**
- カスタムフック：ロジックを関数として切り出し、複数コンポーネントで再利用
- `useState`：関数コンポーネントで状態を管理するReact Hook
- 状態とアクションを分離：UIとロジックの責任分離

### Phase 5: UIコンポーネント（単一責任） 🎨

#### Step 5-1: TabHeaderコンポーネント
```bash
src/config/components/TabHeader.tsx
```

```typescript
import React from 'react';
import { Tabs, Tab, IconButton, Box } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ConfigSchema } from '../types/ConfigFormTypes';

// Props の型定義（TypeScript的に馴染みやすい）
interface TabHeaderProps {
  formData: ConfigSchema;
  currentTab: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onDeleteTab: (index: number) => void;
  onAddTab: () => void;
}

// 関数コンポーネント：タブ表示のみに責任を限定
export const TabHeader: React.FC<TabHeaderProps> = ({
  formData,
  currentTab,
  onTabChange,
  onDeleteTab,
  onAddTab,
}) => (
  <Tabs value={currentTab} onChange={onTabChange}>
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
                  e.stopPropagation();  // イベントの伝播を止める
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
    <IconButton onClick={onAddTab} sx={{ ml: 1 }}>
      <AddIcon />
    </IconButton>
  </Tabs>
);
```

**React初学者ポイント:**
- 関数コンポーネント：現代のReactの標準的な書き方
- Props：親から子へのデータ受け渡し
- イベントハンドラー：`onClick`、`onChange`などのユーザー操作への応答
- `e.stopPropagation()`：イベントの伝播制御

#### Step 5-2: SettingFormコンポーネント
```bash
src/config/components/SettingForm.tsx
```

```typescript
import React from 'react';
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import { createSettingSchema, settingUiSchema } from "../utils/schemaUtils";
import { customWidgets } from "../widgets/CustomWidgets";
import { ConfigSetting, ConfigSchema } from "../types/ConfigFormTypes";

interface SettingFormProps {
  setting: ConfigSetting;
  index: number;
  currentTab: number;
  onUpdateSetting: (index: number, setting: ConfigSetting) => void;
  formData: ConfigSchema;
}

export const SettingForm: React.FC<SettingFormProps> = ({
  setting,
  index,
  currentTab,
  onUpdateSetting,
  formData,
}) => (
  <TabPanel value={currentTab} index={index}>
    <Form
      schema={createSettingSchema()}
      uiSchema={settingUiSchema}
      validator={validator}
      formData={setting}
      formContext={{
        formData: formData,
        currentSetting: setting,
        currentIndex: index,
        handleUpdateSetting: onUpdateSetting,
      }}
      onChange={(e) => onUpdateSetting(index, e.formData)}
      widgets={customWidgets}
    >
      <div />
    </Form>
  </TabPanel>
);
```

### Phase 6: カスタムウィジェット 🔧

#### Step 6-1: カスタムウィジェットの実装
```bash
src/config/widgets/CustomWidgets.tsx
```

```typescript
import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { RegistryWidgetsType } from "@rjsf/utils";

const AppSelector = (props: any) => {
  const { value, onChange, formContext } = props;
  const [apps, setApps] = useState<any[]>([]);

  // コンポーネントマウント時にアプリ一覧を取得
  useEffect(() => {
    // TODO: アプリ一覧取得のロジック
  }, []);

  const handleAppChange = (newAppId: string) => {
    onChange(newAppId);
    
    // 関連フィールドをリセット
    if (formContext?.handleUpdateSetting) {
      const updatedSetting = {
        ...formContext.currentSetting,
        appId: newAppId,
        targetField: "",
      };
      formContext.handleUpdateSetting(formContext.currentIndex, updatedSetting);
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
        {/* アプリ一覧の表示 */}
      </Select>
    </FormControl>
  );
};

export const customWidgets: RegistryWidgetsType = {
  appSelector: AppSelector,
  // fieldSelector: FieldSelector,  // 後で実装
};
```

### Phase 7: メインコンポーネントの統合 🏠

#### Step 7-1: ConfigFormの実装
```bash
src/config/ConfigForm.tsx
```

```typescript
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Typography } from '@mui/material';
import { ConfigSchema } from './types/ConfigFormTypes';
import { useConfigData } from './hooks/useConfigData';
import { ConfigService } from './services/ConfigService';
import { TabHeader } from './components/TabHeader';
import { SettingForm } from './components/SettingForm';
import { ActionButtons } from './components/ActionButtons';

export const ConfigForm: React.FC = () => {
  // サービスのインスタンス化（依存性注入）
  const configService = useMemo(() => new ConfigService(), []);
  
  // 初期データの管理
  const [initialData, setInitialData] = useState<ConfigSchema>({ settings: [] });
  
  // カスタムフックで状態管理
  const { state, actions } = useConfigData(initialData);

  // 初期データの読み込み
  useEffect(() => {
    const loadConfig = async () => {
      const config = await configService.getConfig();
      setInitialData(config);
    };
    loadConfig();
  }, [configService]);

  // 保存処理
  const handleSubmit = useCallback(async () => {
    try {
      await configService.saveConfig(state.formData);
      alert('設定を保存しました');
    } catch (error) {
      console.error('Save failed:', error);
      alert('設定の保存に失敗しました');
    }
  }, [configService, state.formData]);

  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        プラグイン設定
      </Typography>
      
      <TabHeader 
        formData={state.formData}
        currentTab={state.currentTab}
        onTabChange={actions.handleTabChange}
        onDeleteTab={actions.handleDeleteTab}
        onAddTab={actions.handleAddTab}
      />
      
      {state.formData.settings.map((setting, index) => (
        <SettingForm
          key={index}
          setting={setting}
          index={index}
          currentTab={state.currentTab}
          onUpdateSetting={actions.handleUpdateSetting}
          formData={state.formData}
        />
      ))}
      
      <ActionButtons onSubmit={handleSubmit} />
    </Container>
  );
};
```

**React初学者ポイント:**
- `useMemo`：重い計算やオブジェクト生成を最適化
- `useCallback`：関数の再作成を防いでパフォーマンス向上
- `useEffect`：副作用（API呼び出しなど）の管理

## 実装順序のポイント 🎯

### なぜこの順序なのか？

1. **型定義から開始** → TypeScript経験者にとって馴染みやすい
2. **純粋関数でロジック** → テストしやすく、理解しやすい
3. **サービス層で外部依存** → Reactとは独立してテスト可能
4. **カスタムフックで状態管理** → Reactの核心概念を段階的に学習
5. **小さなコンポーネントから** → 単一責任で理解しやすい
6. **最後に統合** → 全体像が見えてから組み立て

### React初学者が躓きやすいポイントと対策

#### 1. 状態管理の理解
```typescript
// ❌ 直接変更（Reactでは禁止）
formData.settings.push(newSetting);

// ✅ 新しいオブジェクトを作成
setFormData({ ...formData, settings: [...formData.settings, newSetting] });
```

#### 2. イベントハンドラーの定義
```typescript
// ❌ インライン関数（毎回再作成される）
<button onClick={() => handleClick(index)}>

// ✅ useCallbackで最適化
const handleClick = useCallback((index: number) => {
  // 処理
}, [dependencies]);
```

#### 3. useEffectの依存配列
```typescript
// ❌ 依存配列なし（毎回実行）
useEffect(() => {
  loadData();
});

// ✅ 適切な依存配列
useEffect(() => {
  loadData();
}, [dependency1, dependency2]);
```

## 開発時のチェックポイント ✅

### Phase完了後の確認事項

- [ ] **Phase 1**: 型定義が完全で、TypeScriptエラーがない
- [ ] **Phase 2**: 純粋関数のテストが書ける（副作用がない）
- [ ] **Phase 3**: サービスクラスが単独でテスト可能
- [ ] **Phase 4**: カスタムフックが独立して動作する
- [ ] **Phase 5**: 各コンポーネントが単一責任を満たす
- [ ] **Phase 6**: カスタムウィジェットが期待通り動作する
- [ ] **Phase 7**: 全体が統合されて動作する

この手順により、React初学者でもTypeScriptの知識を活かしながら、段階的に複雑なReactアプリケーションを構築できます。