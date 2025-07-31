# ConfigForm.tsx 詳細解説

## 概要
ConfigForm.tsxは、kintone-plugin-templateの設定画面のメインコンポーネントです。タブベースのUIで複数の設定を管理し、動的なフィールド選択機能を提供します。

## アーキテクチャの改善点
このコンポーネントは、Reactのベストプラクティスに従い、以下の改善が行われています：
- **カスタムウィジェットの外部化**: `CustomWidgets.tsx`として分離し、レンダリング最適化を実現
- **型安全性の向上**: 独自のKintoneApp型定義により、外部ライブラリ依存を削減
- **コードの保守性向上**: 関心の分離により、各コンポーネントの責任を明確化

## コンポーネント構造の全体像

```mermaid
graph TB
    subgraph "ConfigForm Component"
        subgraph "State管理"
            FormData["formData<br/>設定データの配列"]
            CurrentTab["currentTab<br/>現在のタブ番号"]
        end
        
        subgraph "UI構造"
            TabHeader["タブヘッダー<br/>(Tabs + Tab)"]
            TabPanels["タブパネル<br/>(TabPanel)"]
            ActionButtons["アクションボタン<br/>(Import/Export/Save)"]
        end
        
        subgraph "カスタムウィジェット (外部ファイル)"
            AppSelector["appSelector<br/>(CustomWidgets.tsx)"]
            FieldSelector["fieldSelector<br/>(CustomWidgets.tsx)"]
        end
        
        subgraph "外部連携"
            KintoneAPI["kintone Plugin API"]
            Cache["Cacheクラス"]
        end
    end
    
    FormData --> TabPanels
    CurrentTab --> TabHeader
    CurrentTab --> TabPanels
    
    TabPanels --> AppSelector
    TabPanels --> FieldSelector
    
    AppSelector --> Cache
    FieldSelector --> Cache
    ActionButtons --> KintoneAPI
```

## 1. インポートと型定義

```typescript
// Material-UIコンポーネント
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
// ... その他のMUI imports

// react-jsonschema-form関連
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import Ajv from "ajv";

// プロジェクト内部のimports
import configSchema from "../shared/jsonSchema/config.schema.json";
import { KintoneSdk } from "../shared/util/kintoneSdk";
import { KintoneUtil } from "../shared/util/KintoneUtil";

// カスタムウィジェットのインポート (外部ファイル)
import { customWidgets } from "./widgets/CustomWidgets";

// 型定義
interface AppProps {
  pluginId: string;                    // プラグインID
  kintoneSdk: KintoneSdk;             // SDK インスタンス (※修正により未使用)
  kintoneUtil: typeof KintoneUtil;     // ユーティリティ関数
}
```

## 2. State管理

```typescript
const [formData, setFormData] = useState<ConfigSchema>({ settings: [] });
const [currentTab, setCurrentTab] = useState(0);
```

### State構造の詳細

```mermaid
graph LR
    subgraph "formData"
        Settings["settings: [<br/>{<br/>  name: '設定1',<br/>  appId: '10',<br/>  targetField: 'field_1',<br/>  prefix: 'お知らせ'<br/>},<br/>{<br/>  name: '設定2',<br/>  appId: '20',<br/>  targetField: 'field_2',<br/>  prefix: '通知'<br/>}<br/>]"]
    end
    
    subgraph "currentTab"
        TabIndex["0 | 1 | 2 | ..."]
    end
    
    Settings --> |"currentTab=0"| Tab1["タブ1の内容表示"]
    Settings --> |"currentTab=1"| Tab2["タブ2の内容表示"]
```

## 3. 初期化処理（useEffect）

```typescript
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
```

### 処理フロー

```mermaid
sequenceDiagram
    participant Component as ConfigForm
    participant Kintone as kintone API
    participant State as Component State
    
    Component->>Component: useEffect実行
    Component->>Kintone: getConfig(pluginId)
    Kintone-->>Component: 保存済み設定
    Component->>Component: JSON.parse()
    Component->>Component: データ形式判定
    alt 新形式 (settings)
        Component->>State: setFormData(parsedConfig)
    else 旧形式 (config.settings)
        Component->>State: setFormData(parsedConfig.config)
    end
```

## 4. タブ操作関数

### タブ追加 (handleAddTab)

```typescript
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
  setCurrentTab(formData.settings.length);  // 新しいタブを選択
};
```

### タブ削除 (handleDeleteTab)

```typescript
const handleDeleteTab = (index: number) => {
  const newSettings = formData.settings.filter((_, i) => i !== index);
  setFormData({ settings: newSettings });
  
  // 現在のタブ位置を調整
  if (currentTab >= newSettings.length && currentTab > 0) {
    setCurrentTab(currentTab - 1);
  }
};
```

### 設定更新 (handleUpdateSetting)

```typescript
const handleUpdateSetting = (index: number, settingData: any) => {
  const newSettings = [...formData.settings];
  newSettings[index] = settingData;
  setFormData({ settings: newSettings });
};
```

## 5. カスタムウィジェットの実装（外部ファイル化）

### アーキテクチャの変更
パフォーマンス向上とコードの保守性向上のため、カスタムウィジェットを外部ファイル `CustomWidgets.tsx` に分離しました。

```mermaid
graph LR
    subgraph "Before (問題のある実装)"
        ConfigForm1["ConfigForm.tsx"] --> InlineWidgets["インラインウィジェット<br/>(毎レンダリング時に再作成)"]
    end
    
    subgraph "After (改善された実装)"
        ConfigForm2["ConfigForm.tsx"] --> ExternalWidgets["CustomWidgets.tsx<br/>(コンポーネント外で定義)"]
    end
```

### CustomWidgets.tsx の構造

```typescript
// CustomWidgets.tsx
import { RegistryWidgetsType } from "@rjsf/utils";

const AppSelector = (props: any) => {
  // appSelector実装
};

const FieldSelector = (props: any) => {
  // fieldSelector実装  
};

export const customWidgets: RegistryWidgetsType = {
  appSelector: AppSelector,
  fieldSelector: FieldSelector,
};
```

### 利用方法
```typescript
// ConfigForm.tsx
import { customWidgets } from "./widgets/CustomWidgets";

// react-jsonschema-formで使用
<Form
  widgets={customWidgets}
  // その他のprops
/>
```

### AppSelectorウィジェット

```mermaid
graph TB
    subgraph "appSelector処理フロー"
        Init["初期化<br/>Cache.getInstance()"]
        LoadApps["アプリ一覧取得<br/>cache.init()"]
        Display["ドロップダウン表示"]
        OnChange["選択変更時"]
        Reset["targetFieldリセット"]
        Update["formData更新"]
    end
    
    Init --> LoadApps
    LoadApps --> Display
    Display --> OnChange
    OnChange --> Reset
    Reset --> Update
```

主な特徴：
- **外部コンポーネント化**: レンダリング最適化により不要な再作成を防止
- Cacheクラスを使用してアプリ一覧を取得
- アプリ変更時に関連するtargetFieldを自動リセット
- formContextを通じて親コンポーネントと連携

### FieldSelectorウィジェット

```mermaid
graph TB
    subgraph "fieldSelector処理フロー"
        GetAppId["現在のappId取得"]
        CheckAppId{appIdあり?}
        LoadFields["フィールド取得<br/>cache.getFormFields()"]
        FilterFields["表示可能な<br/>フィールドのみ抽出"]
        ShowFields["ドロップダウン表示"]
        EmptyFields["空のリスト表示"]
    end
    
    GetAppId --> CheckAppId
    CheckAppId -->|Yes| LoadFields
    CheckAppId -->|No| EmptyFields
    LoadFields --> FilterFields
    FilterFields --> ShowFields
```

getCurrentAppId関数の実装：
```typescript
const getCurrentAppId = () => {
  // タブUIの場合はcurrentSettingから取得
  if (formContext?.currentSetting) {
    return formContext.currentSetting.appId;
  }
  // 通常の配列UIの場合（フォールバック）
  const id = idSchema?.$id || '';
  const match = id.match(/settings_(\d+)_targetField/);
  if (match) {
    const index = parseInt(match[1], 10); // radixパラメータを明示
    return formContext?.formData?.settings?.[index]?.appId;
  }
  return null;
};
```

### 外部化による利点

1. **パフォーマンス向上**: コンポーネントの不要な再作成を防止
2. **Reactルール準拠**: ESLintの`react/no-unstable-nested-components`ルールに対応
3. **保守性向上**: 各ウィジェットを独立してテスト・修正可能
4. **再利用性**: 他のコンポーネントからも利用可能

## 6. 保存処理

```typescript
const handleSubmit = (data: IChangeEvent<ConfigSchema>) => {
  // バリデーション
  const valid = validate(data.formData);
  if (!valid) {
    console.error("Validation errors:", validate.errors);
    alert("設定にエラーがあります。修正してください。");
    return;
  }

  // 設定の保存
  const configSetting = { config: data.formData };
  kintone.plugin.app.setConfig(
    { config: JSON.stringify(configSetting) },
    function () {
      alert("設定が保存されました。");
      window.location.href = "../../flow?app=" + kintoneUtil.getId();
    },
  );
};
```

### 保存データの構造

```json
{
  "config": {
    "settings": [
      {
        "name": "設定1",
        "appId": "10",
        "targetField": "field_1",
        "prefix": "お知らせ"
      },
      {
        "name": "設定2",
        "appId": "20",
        "targetField": "field_2",
        "prefix": "通知"
      }
    ]
  }
}
```

## 7. インポート/エクスポート機能

### エクスポート処理

```typescript
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
```

### インポート処理

```typescript
const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string) as ConfigSchema;
        const valid = validate(importedConfig);
        if (!valid) {
          console.error("Validation errors:", validate.errors);
          alert("インポートした設定にエラーがあります。");
          return;
        }
        setFormData(importedConfig);
        alert("設定がインポートされました。");
      } catch (error) {
        console.error("Failed to import config:", error);
        alert("設定のインポートに失敗しました。");
      }
    };
    reader.readAsText(file);
  }
};
```

## 8. レンダリング構造

```mermaid
graph TB
    subgraph "ConfigForm JSX構造"
        Box1["Box (ルートコンテナ)"]
        
        subgraph "Paper (メインコンテンツ)"
            TabsSection["Tabs セクション"]
            TabPanelSection["TabPanel セクション"]
            EmptyState["空状態表示"]
        end
        
        subgraph "Box (アクションボタン)"
            ImportExport["Import/Export ボタン"]
            SaveButton["保存ボタン"]
        end
    end
    
    Box1 --> Paper
    Box1 --> Box
    
    Paper --> TabsSection
    Paper --> TabPanelSection
    Paper --> EmptyState
    
    Box --> ImportExport
    Box --> SaveButton
```

## まとめ

ConfigForm.tsxの主な機能：

1. **タブベースの設定管理**: 複数の設定を独立したタブで管理
2. **動的フィールド選択**: アプリ選択に連動したフィールド取得
3. **データ永続化**: kintone Plugin APIを使用した設定の保存
4. **インポート/エクスポート**: 設定のバックアップと復元
5. **バリデーション**: JSON Schemaベースの自動検証
6. **カスタムウィジェット**: 外部ファイル化による最適化された独自UI部品
7. **型安全性**: TypeScript厳格モードによる高い品質保証

## 改善後のメリット

### パフォーマンス
- カスタムウィジェットの外部化により、不要な再レンダリングを削減
- メモリ使用量の最適化

### 保守性
- 各コンポーネントの責任が明確化
- 単体テストの実装が容易
- ESLint/TypeScriptルールへの完全準拠

### 拡張性
- 新しいウィジェットの追加が簡単
- 他のコンポーネントからの再利用が可能

この実装により、Reactのベストプラクティスに従った、ユーザーフレンドリーで拡張可能かつ高品質な設定画面が実現されています。