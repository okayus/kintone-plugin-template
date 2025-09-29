# QueryConditionsWidget解説 - React初学者向け

## 概要

`QueryConditionsWidget`は、kintoneのレコード取得条件を設定するためのReactコンポーネントです。ユーザーが複数の検索条件を動的に追加・編集・削除できるUIを提供します。

## 1. コンポーネントの基本構造

### ファイル構成
```
src/config/widgets/QueryConditionsWidget.tsx
├── インポート（必要なライブラリとコンポーネント）
├── 型定義（TypeScript）
├── データ定義（oneOfパターン、フィールドタイプマップ）
├── ヘルパー関数（データ変換・操作）
└── メインコンポーネント（QueryConditionsWidget）
```

## 2. 主要な概念

### 2.1 Props（プロパティ）
Reactコンポーネントが親から受け取るデータです。

```typescript
export const QueryConditionsWidget: React.FC<WidgetProps> = (props) => {
  const { value, onChange } = props;
  // ...
};
```

- `value`: 現在の条件データ（配列形式）
- `onChange`: データが変更されたときに呼び出される関数

### 2.2 State管理
このコンポーネントは**制御されたコンポーネント**です。状態は親コンポーネント（react-jsonschema-form）で管理されます。

```typescript
const conditions: QueryCondition[] = parseConditionsFromValue(value);
```

## 3. データ構造

### 3.1 QueryCondition型
1つの検索条件を表現する型です。

```typescript
type QueryCondition = {
  fieldCode: string;           // フィールドコード（例: "title"）
  fieldType: string;           // フィールドタイプ（例: "SINGLE_LINE_TEXT"）
  operator: string;            // 演算子（例: "="）
  stringValue?: string;        // 文字列値
  arrayValue?: string[];       // 配列値
  entityValue?: Array<{ code: string; name?: string }>; // エンティティ値
  logicalOperator?: "and" | "or"; // 論理演算子
};
```

### 3.2 oneOfパターン
kintoneの11種類のフィールドタイプと演算子の組み合わせパターンです。

```typescript
const oneOfPatterns: OneOfPattern[] = [
  // 例: 文字列系フィールド
  {
    fieldTypes: ["SINGLE_LINE_TEXT", "LINK"],
    operators: ["=", "!=", "like", "not like"],
    valueType: "string",
    requiresLogicalOperator: true,
  },
  // ... 他のパターン
];
```

## 4. 主要な関数

### 4.1 データ操作関数

#### `addCondition()` - 条件追加
```typescript
const addCondition = () => {
  const newCondition: QueryCondition = {
    fieldCode: "",
    fieldType: "SINGLE_LINE_TEXT",
    operator: "=",
    stringValue: "",
    logicalOperator: "and",
  };

  const newConditions = [...conditions, newCondition];
  onChange(newConditions.map(createConditionObject));
};
```

**ポイント:**
- スプレッド演算子（`...`）でイミュータブルな配列操作
- `map()`で各条件をJSON Schema形式に変換
- `onChange()`で親に変更を通知

#### `removeCondition(index)` - 条件削除
```typescript
const removeCondition = (index: number) => {
  const newConditions = conditions.filter((_, i) => i !== index);
  onChange(newConditions.map(createConditionObject));
};
```

**ポイント:**
- `filter()`で指定インデックスの条件を除外
- アンダースコア（`_`）で使用しない引数を表現

#### `updateCondition(index, updates)` - 条件更新
```typescript
const updateCondition = (index: number, updates: Partial<QueryCondition>) => {
  const newConditions = [...conditions];
  const currentCondition = newConditions[index];

  // フィールドタイプ変更時のロジック
  if (updates.fieldType && updates.fieldType !== currentCondition.fieldType) {
    const availableOperators = fieldTypeOperatorMap[updates.fieldType] || [];
    updates.operator = availableOperators[0] || "=";
    // 値をリセット
    updates.stringValue = "";
    updates.arrayValue = [];
    updates.entityValue = [];
  }

  newConditions[index] = { ...currentCondition, ...updates };
  onChange(newConditions.map(createConditionObject));
};
```

**ポイント:**
- `Partial<QueryCondition>` で部分更新を型安全に実現
- オブジェクトスプレッド（`...`）でマージ
- 依存関係のあるフィールドの自動リセット

### 4.2 レンダリング関数

#### `renderValueInput()` - 値入力UIの動的切り替え
```typescript
const renderValueInput = (condition: QueryCondition, index: number) => {
  const valueInputType = getValueInputType(condition.fieldType, condition.operator);

  if (valueInputType === "array") {
    // 配列値用UI
    return (/* 複数値入力UI */);
  }

  if (valueInputType === "entity") {
    // エンティティ値用UI
    return (/* エンティティ入力UI */);
  }

  // 文字列値用UI（デフォルト）
  return (/* 単一値入力UI */);
};
```

**ポイント:**
- 条件分岐で異なるUIを返す
- JSXの条件レンダリング
- 関数コンポーネント内での部分UI関数

## 5. React/JavaScript パターン

### 5.1 イベントハンドリング
```typescript
onChange={(e) => {
  const newArrayValue = [...arrayValue];
  newArrayValue[valueIndex] = e.target.value;
  updateCondition(index, { arrayValue: newArrayValue });
}}
```

**学習ポイント:**
- アロー関数でイベントハンドラー定義
- `e.target.value`でフォーム入力値取得
- クロージャーで外部変数（`index`など）をキャプチャ

### 5.2 条件レンダリング
```typescript
{index < conditions.length - 1 && (
  <FormControl size="small" sx={{ minWidth: 100 }}>
    {/* 論理演算子セレクト */}
  </FormControl>
)}
```

**学習ポイント:**
- `&&`演算子による条件レンダリング
- 最後の条件では論理演算子を表示しない

### 5.3 リストレンダリング
```typescript
{conditions.map((condition, index) => (
  <Box key={index} sx={{ /* スタイル */ }}>
    {/* 条件UI */}
  </Box>
))}
```

**学習ポイント:**
- `map()`でリスト要素をレンダリング
- `key`プロパティでReactの再レンダリング最適化
- インデックスをキーとして使用（この場合は適切）

## 6. TypeScriptの活用

### 6.1 型安全性
```typescript
// 型注釈でコンパイル時エラー検出
const updateCondition = (index: number, updates: Partial<QueryCondition>) => {
  // updates.invalidProperty = "test"; // ← TypeScriptエラー
};
```

### 6.2 Union型
```typescript
logicalOperator: e.target.value as "and" | "or"
```

**ポイント:**
- 型アサーション（`as`）で型を明示
- Union型で限定された値のみ許可

## 7. Material-UI（MUI）の使用

### 7.1 コンポーネント構成
```typescript
<Box sx={{ display: "flex", gap: 2, mb: 2 }}>
  <TextField /* props */ />
  <FormControl /* props */>
    <Select /* props */ />
  </FormControl>
</Box>
```

**学習ポイント:**
- `sx`プロパティでCSS-in-JS
- Flexboxレイアウト
- Material Designの設計原則

## 8. パフォーマンス考慮事項

### 8.1 不要な再レンダリングの回避
- propsの変更時のみ再レンダリング
- `map()`での新しい配列作成は必要な場合のみ

### 8.2 メモリリーク防止
- イベントハンドラーでのクロージャー使用は適切
- 大きなデータ構造の不要な複製を避ける

## 9. 実践的な学習ポイント

### 初学者が押さえるべき概念：

1. **制御されたコンポーネント**: 状態を親で管理
2. **イミュータブル更新**: 元データを変更せず新しいデータを作成
3. **条件レンダリング**: `&&`や三項演算子の活用
4. **TypeScript**: 型安全性による開発効率向上
5. **関数型プログラミング**: `map()`, `filter()`, スプレッド演算子

### 次のステップ：

1. カスタムフックでの状態管理
2. useMemoやuseCallbackでの最適化
3. テスト駆動開発（TDD）
4. ストーリーブック（Storybook）での孤立開発

## まとめ

`QueryConditionsWidget`は複雑な動的UIを実現していますが、基本的なReactパターンの組み合わせで構成されています。この解説を通して、React開発における実践的なパターンを理解し、より高度なコンポーネント開発に取り組んでください。