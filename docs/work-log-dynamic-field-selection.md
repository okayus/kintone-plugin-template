# kintone-plugin-template 動的フィールド選択機能実装作業ログ

## 作業概要

kintoneプラグインの設定画面において、アプリを選択すると動的にそのアプリのフィールドを取得し、選択肢として表示する機能を実装する。

## 作業日: 2024-06-24

### 1. 現状分析

#### 既存実装の確認
- **フレームワーク**: React + react-jsonschema-form
- **状態管理**: React hooks (useState, useEffect)
- **API**: @kintone/rest-api-client
- **現在の機能**: 
  - 単一アプリ（現在のアプリ）のフィールドのみ取得
  - インポート/エクスポート機能実装済み

#### 課題
1. 複数アプリの選択ができない
2. アプリごとのフィールド取得ができない
3. 設定項目が固定的（配列での管理ができない）

### 2. 実装方針

#### アーキテクチャ設計
```
ConfigForm (親コンポーネント)
├── 設定項目リスト管理
├── 追加/削除機能
└── SettingItem (子コンポーネント) ×N
    ├── アプリ選択
    ├── フィールド選択（動的）
    └── その他の設定
```

#### データ構造の変更
**Before:**
```json
{
  "prefix": "string",
  "fields": ["field1", "field2"]
}
```

**After:**
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

### 3. 実装ステップ

#### Step 1: JSON Schema の更新
新しいデータ構造に対応したJSON Schemaを作成する。

#### Step 2: キャッシュ機能の実装
kintone-conditional-flag-setterを参考に、API呼び出しのキャッシュ機能を実装。

#### Step 3: カスタムウィジェットの作成
react-jsonschema-formのカスタムウィジェットとして、動的フィールド選択コンポーネントを作成。

#### Step 4: 状態管理の実装
各設定項目が独立して動作するよう、適切な状態管理を実装。

### 4. 技術的なポイント

#### react-jsonschema-formでの動的スキーマ
```typescript
// 動的にスキーマを生成する例
const createDynamicSchema = (appId: string, fields: FieldOption[]) => {
  return {
    ...baseSchema,
    properties: {
      ...baseSchema.properties,
      targetField: {
        type: "string",
        enum: fields.map(f => f.const),
        enumNames: fields.map(f => f.title)
      }
    }
  };
};
```

#### useEffectでの依存関係管理
```typescript
// アプリIDが変更されたときのみフィールドを再取得
useEffect(() => {
  if (appId) {
    fetchFields(appId);
  }
}, [appId]);
```

#### キャッシュ戦略
- アプリ一覧: 初回のみ取得
- フィールド情報: アプリIDごとにキャッシュ
- キャッシュ有効期限: セッション中は保持

### 5. 参考にした実装

#### kintone-conditional-flag-setterから学んだポイント
1. **Cache クラスの設計**
   - シングルトンパターンでAPIレスポンスをキャッシュ
   - 非同期初期化パターン

2. **動的フィールド更新**
   - useEffectの依存配列を適切に設定
   - ローディング状態の管理

3. **コンポーネント設計**
   - 責任の分離（親子コンポーネント）
   - propsによるコールバック関数の受け渡し

### 6. 実装上の工夫

#### パフォーマンス最適化
- 不要なAPI呼び出しを避けるキャッシュ
- React.memoによる不要な再レンダリング防止

#### ユーザビリティ
- ローディング中の表示
- エラー時のフィードバック
- 直感的な操作性

### 7. 今後の課題

1. より高度な設定項目の追加
2. バリデーションの強化
3. テストコードの充実

### 8. 実装完了とテスト

#### ビルド結果
- Vitestでの型チェックとビルドが正常に完了
- プラグインファイル（plugin.zip）の生成に成功

#### 実装したファイル
1. `src/shared/jsonSchema/config.schema.json` - 新しい設定構造のスキーマ
2. `src/shared/util/cache.ts` - APIキャッシュ機能
3. `src/config/widgets/AppFieldSelector.tsx` - 動的フィールド選択ウィジェット
4. `src/config/ConfigForm.tsx` - 更新されたメイン設定フォーム

#### 技術的な課題と解決
1. **型定義の問題**: `WidgetProps`の代わりに独自のpropsインターフェースを定義
2. **react-jsonschema-form統合**: カスタムフィールドとウィジェットの組み合わせで実現
3. **状態管理**: useEffectの依存配列を適切に設定してパフォーマンス最適化

## まとめ

react-jsonschema-formを使いながら、動的なフィールド選択機能を実装することで、より柔軟な設定画面を実現できた。kintone-conditional-flag-setterの実装を参考にすることで、効率的に開発を進めることができた。

### 実装の効果
1. **ユーザビリティ向上**: アプリ選択に応じたフィールド選択が可能
2. **設定の柔軟性**: 複数のアプリとフィールドの組み合わせに対応
3. **保守性**: キャッシュ機能によるパフォーマンス最適化
4. **拡張性**: カスタムウィジェットによる機能拡張の基盤作成

### バグ修正3: メッセージ表示機能の修正

#### 問題
"メッセージを表示"ボタンをクリックしてもポップアップの文字列がブランクになる。

#### 原因分析
`MessageService.generateMessage()`メソッドで、複数アプリから取得したレコードを正しく処理できていなかった：
1. **設定とレコードの紐付け問題**: 異なるアプリから取得したレコードを1つの配列にまとめた後、どのレコードがどの設定に対応するかが分からなくなった
2. **フィルタリングロジックの問題**: `$id`での絞り込みが機能していなかった

#### 解決方法
1. **戻り値の構造変更**: `fetchRecordsFromSettings()`で設定とレコードを紐付けた構造で返すように変更
```typescript
// Before: Record[]
// After: Array<{setting: any, records: Record[]}>
public async fetchRecordsFromSettings(): Promise<Array<{setting: any, records: Record[]}>>
```

2. **メッセージ生成ロジックの改善**: 各設定ごとにレコードを処理
```typescript
public generateMessage(recordsWithSettings: Array<{setting: any, records: Record[]}>): string {
  const messages: string[] = [];
  
  for (const { setting, records } of recordsWithSettings) {
    if (setting.appId && setting.targetField && records.length > 0) {
      const messageFromRecords: string = records
        .map((record) => {
          const field = record[setting.targetField];
          if (field && typeof field === 'object' && 'value' in field) {
            return String(field.value || '');
          }
          return '';
        })
        .filter(line => line.trim() !== '')
        .join(", ");
        
      if (messageFromRecords) {
        messages.push(setting.prefix + messageFromRecords);
      }
    }
  }
  
  return messages.join("\n");
}
```

#### 修正後の動作
- 各設定で指定されたアプリからレコードを取得
- 指定されたフィールドの値を抽出
- 設定のプレフィックスを付けてメッセージを生成
- 複数設定がある場合は改行で連結

### 今後の改善点
1. バリデーション機能の強化
2. UI/UXのさらなる改善
3. エラーハンドリングの充実
4. ユニットテストの追加

## トラブルシューティング

### バグ修正 - JSON Schema バリデーションエラー

#### 問題
ブラウザで動作検証した際、以下のエラーが発生して設定を保存できない：

```
errors 
(4) [{…}, {…}, {…}, {…}]
0: {name: 'required', property: '.settings.0.name', message: "must have required property '設定名'", params: {…}, stack: "must have required property '設定名'", …}
1: {name: 'required', property: '.settings.0.prefix', message: "must have required property '通知メッセージのプレフィックス'", params: {…}, stack: "must have required property '通知メッセージのプレフィックス'", …}
```

#### 原因分析
1. **カスタムフィールドの実装問題**: 初期実装で`"ui:field": "appFieldSelector"`を設定していたため、react-jsonschema-formが標準フィールドを正しく認識できていなかった
2. **フォーム構造の不整合**: AppFieldSelectorを全体のフィールドとして実装していたため、`name`や`prefix`などの個別フィールドが生成されていなかった

#### 解決方法
1. **カスタムウィジェットへの変更**: カスタムフィールドではなく、カスタムウィジェットとして実装
   - `appSelector`: アプリ選択専用ウィジェット
   - `fieldSelector`: フィールド選択専用ウィジェット（アプリIDに依存）

2. **uiSchema構造の修正**:
```typescript
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
```

3. **フォームコンテキストの活用**: `fieldSelector`ウィジェットで同じ配列要素の`appId`を参照するために`formContext`を利用

#### 実装のポイント
- **idSchemaからインデックス取得**: `settings_(\d+)_targetField`パターンで配列インデックスを抽出
- **動的フィールド更新**: useEffectでappIdの変更を監視してフィールドリストを更新
- **キャッシュ活用**: Cacheクラスを使用してAPI呼び出しを最適化

#### 修正後の動作
- 各設定項目で独立してアプリ選択が可能
- アプリ選択時に動的にフィールド選択肢が更新
- 他の設定項目に影響しない独立した動作
- JSON Schemaバリデーションが正常に機能

### 学んだ教訓
1. **react-jsonschema-formでの実装方針**: 複雑なUI要件はカスタムフィールドよりもカスタムウィジェットで実装する方が安全
2. **デバッグの重要性**: ブラウザでの実際の動作確認が必須
3. **段階的開発**: 小さな機能から始めて段階的に拡張する重要性

### バグ修正2と機能変更

#### 問題
1. **フィールド選択不可**: 対象フィールドが何も選択できない
2. **UI改善要求**: 各設定をタブ化したい
3. **機能変更**: desktopで設定したアプリのレコードを取得して通知

#### 解決方法

##### 1. フィールドタイプのフィルタリング拡張
**問題**: `SINGLE_LINE_TEXT`のみに制限されていたため、選択できるフィールドが少なかった

**解決**:
```typescript
const allowedTypes = [
  'SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'NUMBER', 'CALC',
  'RADIO_BUTTON', 'DROP_DOWN', 'DATE', 'TIME', 'DATETIME',
  'LINK', 'RICH_TEXT'
];
```

##### 2. タブ化UI実装
**実装内容**:
- Material-UIのTabsコンポーネントを使用
- 個別設定用のスキーマ生成関数を作成
- タブ追加/削除機能を実装
- 各タブで独立したフォーム管理

**重要な実装ポイント**:
```typescript
// 個別設定用スキーマ作成
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
```

##### 3. Desktop機能の変更
**変更内容**:
- `MessageService`を新しい設定構造に対応
- 設定されたアプリからレコードを取得する`fetchRecordsFromSettings`メソッド追加
- 複数アプリからのレコード取得と通知メッセージ生成

**実装のポイント**:
```typescript
public async fetchRecordsFromSettings(): Promise<Record[]> {
  const allRecords: Record[] = [];
  for (const setting of this.config.settings) {
    if (setting.appId && setting.targetField) {
      const records = await this.kintoneSdk.getRecords(
        Number(setting.appId), 
        [setting.targetField], 
        ""
      );
      allRecords.push(...records.records);
    }
  }
  return allRecords;
}
```

#### 技術的課題と解決
1. **フォームコンテキストの管理**: タブUIでは`currentIndex`を使用してappIdを取得
2. **スキーマの動的生成**: 個別設定用のスキーマを実行時に生成
3. **状態管理の複雑化**: タブごとの独立した状態管理を実現

#### 実装後の効果
1. **UI/UX向上**: タブベースの直感的な設定画面
2. **機能の実用性**: 実際の設定を活かした通知機能
3. **拡張性**: より多くのフィールドタイプに対応