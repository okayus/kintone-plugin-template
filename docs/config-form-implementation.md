# kintone-plugin-template 設定画面実装まとめ

## 概要

kintoneプラグインの設定画面において、アプリを選択すると動的にそのアプリのフィールドを取得し、選択肢として表示する機能を実装しました。さらに、複数の設定を管理するためのタブベースのUIも実装しています。

## 実装した機能

### 1. 動的フィールド選択機能
- **目的**: アプリ選択時に、そのアプリのフィールド一覧を動的に取得して選択可能にする
- **技術**: react-jsonschema-form のカスタムウィジェット
- **効果**: ユーザビリティの向上とデータ入力ミスの防止

### 2. タブベースUI
- **目的**: 複数の設定を効率的に管理
- **技術**: Material-UI の Tabs コンポーネント
- **効果**: 設定の整理と操作性の向上

### 3. インポート/エクスポート機能
- **目的**: 設定の保存・復元・共有
- **技術**: FileReader API と Blob API
- **効果**: 設定の再利用性とバックアップ機能

## アーキテクチャ

### データ構造

```json
{
  "settings": [
    {
      "name": "設定名",
      "appId": "123",
      "targetField": "field_code",
      "prefix": "通知："
    }
  ]
}
```

### コンポーネント構成

```
ConfigForm (メインコンポーネント)
├── Material-UI Tabs (タブ管理)
├── react-jsonschema-form (フォーム管理)
├── カスタムウィジェット
│   ├── appSelector (アプリ選択)
│   └── fieldSelector (フィールド選択)
└── Cache (APIキャッシュ)
```

## 実装の詳細

### 1. カスタムウィジェット

#### appSelector ウィジェット

```typescript
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
}
```

#### fieldSelector ウィジェット

```typescript
fieldSelector: (props: any) => {
  const { value, onChange, formContext } = props;
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cache] = useState(() => Cache.getInstance());

  // 同じ設定内のappIdを取得
  const getCurrentAppId = () => {
    if (formContext?.currentSetting) {
      return formContext.currentSetting.appId;
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
              'SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'NUMBER', 'CALC',
              'RADIO_BUTTON', 'DROP_DOWN', 'DATE', 'TIME', 'DATETIME',
              'LINK', 'RICH_TEXT'
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
}
```

### 2. タブ管理

```typescript
const ConfigForm: React.FC<AppProps> = ({ pluginId, kintoneSdk, kintoneUtil }) => {
  const [formData, setFormData] = useState<ConfigSchema>({ settings: [] });
  const [currentTab, setCurrentTab] = useState(0);

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
              formContext={{ 
                formData: formData, 
                currentSetting: setting, 
                currentIndex: index, 
                handleUpdateSetting 
              }}
              onChange={(e) => handleUpdateSetting(index, e.formData)}
              widgets={customWidgets}
            >
              <div /> {/* Submit buttonを非表示にする */}
            </Form>
          </TabPanel>
        ))}
      </Paper>
    </Box>
  );
};
```

### 3. キャッシュ機能

```typescript
export class Cache {
  private static instance: Cache;
  private apps: any[] = [];
  private formFields: { [appId: string]: any } = {};
  private initialized = false;

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const restApiClient = new KintoneRestAPIClient();
      const kintoneSdk = new KintoneSdk(restApiClient);
      
      const appsResponse = await kintoneSdk.getApps();
      this.apps = appsResponse.apps;
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize cache:', error);
      throw error;
    }
  }

  public getApps(): any[] {
    return this.apps;
  }

  public async getFormFields(appId: string): Promise<any> {
    if (this.formFields[appId]) {
      return this.formFields[appId];
    }

    try {
      const restApiClient = new KintoneRestAPIClient();
      const kintoneSdk = new KintoneSdk(restApiClient);
      
      const fieldsResponse = await kintoneSdk.getFormFields(Number(appId));
      this.formFields[appId] = fieldsResponse.properties;
      
      return this.formFields[appId];
    } catch (error) {
      console.error(`Failed to get form fields for app ${appId}:`, error);
      throw error;
    }
  }
}
```

## 主要な技術的課題と解決策

### 1. react-jsonschema-form との統合

**課題**: カスタムUIコンポーネントをreact-jsonschema-formと統合する必要がある

**解決策**: 
- カスタムフィールドではなくカスタムウィジェットとして実装
- `formContext`を活用して、ウィジェット間でのデータ共有を実現

### 2. 動的フィールド更新

**課題**: アプリ選択時に、同じ設定内のフィールド選択肢を動的に更新する

**解決策**:
- `useEffect`でappIdの変更を監視
- `formContext.currentSetting`を使用してアプリIDを取得
- キャッシュ機能でAPI呼び出しを最適化

### 3. 複数設定の独立性

**課題**: 複数の設定が存在する場合、各設定が独立して動作する必要がある

**解決策**:
- タブベースUIで設定を分離
- 各タブで独立したフォームコンテキストを管理
- `currentIndex`と`currentSetting`でコンテキストを特定

## パフォーマンス最適化

### 1. APIキャッシュ
- アプリ一覧: 初回のみ取得
- フィールド情報: アプリIDごとにキャッシュ
- セッション中はキャッシュを保持

### 2. 不要な再レンダリング防止
- `useState`と`useEffect`の依存配列を適切に設定
- 必要最小限のコンポーネント更新

## ユーザビリティの向上

### 1. 直感的な操作
- アプリ選択時のフィールド自動リセット
- ローディング状態の表示
- わかりやすいエラーメッセージ

### 2. 設定の管理
- タブによる複数設定の整理
- 設定の追加・削除機能
- インポート・エクスポート機能

## 今後の拡張可能性

### 1. 機能拡張
- より複雑な条件設定
- フィールド間の関連性設定
- バリデーション機能の強化

### 2. UI/UX改善
- ドラッグ&ドロップによる設定並び替え
- プレビュー機能
- 設定のコピー・複製機能

## まとめ

この実装により、以下の価値を提供できました：

1. **開発効率の向上**: 動的フィールド選択により、手動でのフィールド入力が不要
2. **ユーザビリティの向上**: タブベースUIによる直感的な設定管理
3. **保守性の向上**: キャッシュ機能とコンポーネント分離による効率的な実装
4. **拡張性の確保**: カスタムウィジェットによる将来的な機能拡張の基盤

react-jsonschema-formとMaterial-UIを組み合わせることで、堅牢で使いやすい設定画面を実現できました。