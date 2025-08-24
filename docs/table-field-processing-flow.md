# テーブルフィールド処理の関数呼び出しフロー

## 概要

kintoneプラグインでテーブルフィールド（SUBTABLE）のプレースホルダー `{items.name}` を処理する際の関数呼び出しの流れを、具体的な設定例とともに解説します。

## 前提条件

### 設定例
```json
{
  "name": "商品通知設定",
  "appId": "123",
  "prefix": "新着商品: ",
  "body": "カテゴリ: {category}, 商品: {items.name}, 合計: {items.price}円"
}
```

### レコードデータ例
```json
{
  "category": {
    "type": "SINGLE_LINE_TEXT",
    "value": "電子機器"
  },
  "items": {
    "type": "SUBTABLE", 
    "value": [
      {
        "id": "1",
        "value": {
          "name": { "type": "SINGLE_LINE_TEXT", "value": "iPhone" },
          "price": { "type": "NUMBER", "value": "80000" }
        }
      },
      {
        "id": "2", 
        "value": {
          "name": { "type": "SINGLE_LINE_TEXT", "value": "MacBook" },
          "price": { "type": "NUMBER", "value": "150000" }
        }
      }
    ]
  }
}
```

## 関数呼び出しフロー

```mermaid
sequenceDiagram
    participant User as "ユーザー"
    participant MS as "MessageService"
    participant RH as "replaceAllPlaceholders"
    participant RWS as "replacePlaceholdersWithStrategy"
    participant AFS as "createAutoFieldStrategy"
    participant TFS as "createTableFieldStrategy"
    participant SFS as "createSimpleFieldStrategy"

    User->>MS: alertMessage()
    MS->>MS: fetchRecordsFromSettings()
    
    Note over MS: 設定からフィールドを抽出
    MS->>MS: extractRequiredFields(setting)
    
    Note over MS: body: "カテゴリ: {category}, 商品: {items.name}, 合計: {items.price}円"<br/>抽出結果: ["category", "items"]
    
    MS->>MS: kintoneSdk.getRecords(appId, ["category", "items"], "")
    
    Note over MS: レコード取得完了、メッセージ生成開始
    MS->>MS: generateMessage(recordsWithSettings)
    
    loop 各レコードに対して
        MS->>RH: replaceAllPlaceholders("カテゴリ: {category}, 商品: {items.name}, 合計: {items.price}円", record)
        
        Note over RH: デフォルト区切り文字 ", " でautoストラテジー作成
        RH->>AFS: createAutoFieldStrategy(", ")
        AFS-->>RH: autoStrategy function
        
        Note over RH: ストラテジーパターンのエンジン部分を呼び出し
        RH->>RWS: replacePlaceholdersWithStrategy(autoStrategy, record, body)
        
        Note over RWS: 正規表現 /{([^}]+)}/g で各プレースホルダーを処理
        
        RWS->>AFS: autoStrategy(record, "category")
        Note over AFS: "category" にはドット(.)がないため通常フィールド
        AFS->>SFS: createSimpleFieldStrategy()
        SFS-->>AFS: simpleStrategy function
        AFS->>SFS: simpleStrategy(record, "category")
        Note over SFS: record["category"].value = "電子機器"
        SFS-->>AFS: "電子機器"
        AFS-->>RWS: "電子機器"
        
        RWS->>AFS: autoStrategy(record, "items.name")
        Note over AFS: "items.name" にはドット(.)があるためテーブルフィールド
        AFS->>TFS: createTableFieldStrategy(", ")
        TFS-->>AFS: tableStrategy function
        AFS->>TFS: tableStrategy(record, "items.name")
        
        Note over TFS: fieldCode.split('.') → ["items", "name"]<br/>tableField = "items", subField = "name"
        Note over TFS: record["items"].type === "SUBTABLE" かつ Array.isArray(record["items"].value)
        
        loop テーブルの各行
            Note over TFS: row.value["name"].value = "iPhone"
            Note over TFS: row.value["name"].value = "MacBook"
        end
        
        Note over TFS: .filter(val => val.trim() !== "")<br/>.join(", ") → "iPhone, MacBook"
        TFS-->>AFS: "iPhone, MacBook"
        AFS-->>RWS: "iPhone, MacBook"
        
        RWS->>AFS: autoStrategy(record, "items.price")
        Note over AFS: "items.price" にはドット(.)があるためテーブルフィールド
        AFS->>TFS: createTableFieldStrategy(", ")  
        TFS-->>AFS: tableStrategy function
        AFS->>TFS: tableStrategy(record, "items.price")
        
        Note over TFS: fieldCode.split('.') → ["items", "price"]<br/>tableField = "items", subField = "price"
        
        loop テーブルの各行
            Note over TFS: row.value["price"].value = "80000"
            Note over TFS: row.value["price"].value = "150000"
        end
        
        Note over TFS: .join(", ") → "80000, 150000"
        TFS-->>AFS: "80000, 150000"
        AFS-->>RWS: "80000, 150000"
        
        Note over RWS: 最終的な置換結果<br/>"カテゴリ: 電子機器, 商品: iPhone, MacBook, 合計: 80000, 150000円"
        RWS-->>RH: "カテゴリ: 電子機器, 商品: iPhone, MacBook, 合計: 80000, 150000円"
        RH-->>MS: "カテゴリ: 電子機器, 商品: iPhone, MacBook, 合計: 80000, 150000円"
        
        Note over MS: prefix + message<br/>"新着商品: カテゴリ: 電子機器, 商品: iPhone, MacBook, 合計: 80000, 150000円"
    end
    
    MS-->>User: alert("新着商品: カテゴリ: 電子機器, 商品: iPhone, MacBook, 合計: 80000, 150000円")
```

## 処理の詳細解説

### 1. フィールド抽出フェーズ
```typescript
// MessageService.extractRequiredFields()
const placeholders = setting.body.match(/{([^}]+)}/g);
// 結果: ["{category}", "{items.name}", "{items.price}"]

for (const placeholder of placeholders) {
  const fieldCode = placeholder.slice(1, -1).trim();
  const [tableField] = fieldCode.split('.');
  fields.add(tableField);
}
// 結果: Set(["category", "items"])
```

### 2. プレースホルダー置換フェーズ
```typescript
// createAutoFieldStrategy での分岐判定
(record, fieldCode) => {
  if (fieldCode.includes(".")) {
    // "items.name" → テーブルフィールド処理
    return createTableFieldStrategy(separator)(record, fieldCode);
  } else {
    // "category" → 通常フィールド処理  
    return createSimpleFieldStrategy()(record, fieldCode);
  }
}
```

### 3. テーブルフィールド処理の詳細
```typescript
// createTableFieldStrategy での処理
const [tableField, subField] = fieldCode.split("."); 
// "items.name" → tableField="items", subField="name"

const table = record[tableField]; // SUBTABLEフィールド取得

return table.value
  .map(row => row.value[subField]?.value?.toString() || "")
  .filter(val => val.trim() !== "")
  .join(separator);
// ["iPhone", "MacBook"] → "iPhone, MacBook"
```

## 最適化ポイント

### ストラテジーパターンの効果
- **createAutoFieldStrategy**: ドット記法の有無で自動判定
- **createTableFieldStrategy**: テーブル行の反復処理を効率化
- **createSimpleFieldStrategy**: 通常フィールドの高速処理

### フィールド抽出の効率化
- API呼び出し前にプレースホルダーから必要フィールドを抽出
- `["category", "items"]` のみ取得（`items.name`, `items.price` → `items` に集約）
- 不要なフィールドの取得を回避

## エラーハンドリング

### 安全な処理
```typescript
// 存在しないテーブルフィールド
if (!table || table.type !== "SUBTABLE" || !Array.isArray(table.value)) {
  return "";
}

// 存在しないサブフィールド
row.value[subField]?.value?.toString() || ""

// 空値の自動除外
.filter(val => val.trim() !== "")
```

## `replacePlaceholdersWithStrategy`の役割

### ストラテジーパターンのエンジン部分
`replacePlaceholdersWithStrategy`は、ストラテジーパターンの中核となる**汎用的な置換エンジン**です。

### 関数の階層構造
```typescript
// 1. 実際に使用される関数（ラッパー）
replaceAllPlaceholders(body, record, separator)
  ↓
// 2. ストラテジーパターンのエンジン（内部実装）
replacePlaceholdersWithStrategy(autoStrategy, record, body)
  ↓ 
// 3. 各プレースホルダーごとにストラテジーを実行
autoStrategy(record, fieldCode) → simpleStrategy | tableStrategy
```

### 使用箇所の詳細

#### 1. `replaceAllPlaceholders`からの呼び出し（メイン）
```typescript
export const replaceAllPlaceholders = (body, record, separator = ", ") => {
  const strategy = createAutoFieldStrategy(separator);  // 自動選択
  return replacePlaceholdersWithStrategy(strategy, record, body);
}
```

#### 2. `replacePlaceholders`からの呼び出し（後方互換性）
```typescript
export const replacePlaceholders = (body, record) => {
  const strategy = createSimpleFieldStrategy();  // 通常フィールドのみ
  return replacePlaceholdersWithStrategy(strategy, record, body);
}
```

#### 3. テストでの直接使用（カスタムストラテジー）
```typescript
const customStrategy = (record, fieldCode) => {
  const field = record[fieldCode];
  if (!field?.value) return "[未設定]";
  return `[${field.value}]`;
};

// 直接テスト可能
replacePlaceholdersWithStrategy(customStrategy, record, "Hello {name}")
```

### 設計上のメリット

1. **汎用性**: どんなストラテジーでも使用可能
2. **テスタビリティ**: カスタムストラテジーでのテストが容易
3. **拡張性**: 新しいフィールドタイプへの対応が簡単
4. **責任分離**: 置換ロジックとストラテジー作成を分離

### 実際のコールチェーン（MessageService視点）
```
MessageService.generateMessage()
├── replaceAllPlaceholders(setting.body, record)
│   ├── createAutoFieldStrategy(", ")
│   └── replacePlaceholdersWithStrategy(autoStrategy, record, body)
│       ├── autoStrategy(record, "category") → simpleFieldStrategy
│       ├── autoStrategy(record, "items.name") → tableFieldStrategy  
│       └── autoStrategy(record, "items.price") → tableFieldStrategy
```

### なぜ直接呼ばれないのか？

- **実用性**: `replaceAllPlaceholders`が自動判定で便利
- **抽象化**: ユーザーはストラテジーを意識する必要なし  
- **保守性**: 内部実装の変更が外部APIに影響しない

`replacePlaceholdersWithStrategy`は**エンジン部分**として、ストラテジーパターンの柔軟性を提供しながら、実際のアプリケーションでは`replaceAllPlaceholders`がシンプルなAPIとして機能しています。

## Q&A: ストラテジー切り替えの仕組み

### Q: `replacePlaceholdersWithStrategy`のreplaceコールバック内でテーブルかどうかはどのように切り替えられている？

```typescript
export const replacePlaceholdersWithStrategy = (
  strategy: FieldValueStrategy,
  record: Record,
  body: string,
): string => {
  return body.replace(/{([^}]+)}/g, (_, fieldCode) => {
    return strategy(record, fieldCode.trim());
  });
};
```

**A: ストラテジー関数内のドット記法判定により切り替えられています。**

### 詳細解説

#### 1. ストラテジー関数の事前作成と切り替えロジック

`replacePlaceholdersWithStrategy`が呼ばれる前に、`createAutoFieldStrategy`で**切り替えロジックを含むstrategy関数**が作成されます：

```typescript
export const createAutoFieldStrategy = (separator = ", "): FieldValueStrategy =>
  (record, fieldCode) => {
    if (fieldCode.includes(".")) {
      // ドット記法検出 → テーブルフィールド処理
      return createTableFieldStrategy(separator)(record, fieldCode);
    } else {
      // ドット記法なし → 通常フィールド処理
      return createSimpleFieldStrategy()(record, fieldCode);
    }
  };
```

#### 2. 実行時の動的切り替え

`replace`のコールバックが実行されるたびに、**strategy関数内で判定**が行われます：

```typescript
// body: "カテゴリ: {category}, 商品: {items.name}, 合計: {items.price}円"

// 1回目: {category} → fieldCode = "category"
strategy(record, "category")
└── fieldCode.includes(".") → false
    └── createSimpleFieldStrategy()(...) → "電子機器"

// 2回目: {items.name} → fieldCode = "items.name"  
strategy(record, "items.name")
└── fieldCode.includes(".") → true
    └── createTableFieldStrategy()(...) → "iPhone, MacBook"

// 3回目: {items.price} → fieldCode = "items.price"
strategy(record, "items.price")
└── fieldCode.includes(".") → true
    └── createTableFieldStrategy()(...) → "80000, 150000"
```

#### 3. 実行フローの詳細

```mermaid
flowchart TD
    A["replaceAllPlaceholders(body, record)"] --> B["createAutoFieldStrategy(', ')"]
    B --> C["autoStrategy function 作成"]
    C --> D["replacePlaceholdersWithStrategy(autoStrategy, record, body)"]
    
    D --> E["body.replace(/{([^}]+)}/g, callback)"]
    E --> F["各プレースホルダーでコールバック実行"]
    
    F --> G1["{category} → fieldCode='category'"]
    F --> G2["{items.name} → fieldCode='items.name'"]
    F --> G3["{items.price} → fieldCode='items.price'"]
    
    G1 --> H1["autoStrategy(record, 'category')"]
    G2 --> H2["autoStrategy(record, 'items.name')"]
    G3 --> H3["autoStrategy(record, 'items.price')"]
    
    H1 --> I1["fieldCode.includes('.') → false"]
    H2 --> I2["fieldCode.includes('.') → true"]
    H3 --> I3["fieldCode.includes('.') → true"]
    
    I1 --> J1["createSimpleFieldStrategy()"]
    I2 --> J2["createTableFieldStrategy()"]
    I3 --> J3["createTableFieldStrategy()"]
    
    J1 --> K1["'電子機器'"]
    J2 --> K2["'iPhone, MacBook'"]
    J3 --> K3["'80000, 150000'"]
```

#### 4. キーポイント

1. **事前判定**: `createAutoFieldStrategy`で切り替えロジックを含むstrategy関数を作成
2. **動的実行**: `replace`コールバックのたびに`fieldCode`を検査して適切な処理を選択
3. **ドット記法判定**: `fieldCode.includes(".")` でテーブルフィールドを識別
4. **遅延評価**: 実際に必要になった時点で`createTableFieldStrategy`または`createSimpleFieldStrategy`を実行

#### 5. 具体例での実行順序

```typescript
// body: "カテゴリ: {category}, 商品: {items.name}"

replace(/{([^}]+)}/g, (_, fieldCode) => {
  // 1回目: fieldCode = "category"
  if ("category".includes(".")) { // false
    return createSimpleFieldStrategy()(record, "category"); // "電子機器"
  }
  
  // 2回目: fieldCode = "items.name"  
  if ("items.name".includes(".")) { // true
    return createTableFieldStrategy(separator)(record, "items.name"); // "iPhone, MacBook"
  }
})
```

**つまり、`replacePlaceholdersWithStrategy`自体は汎用エンジンで、渡された`strategy`関数内で`fieldCode`の形式に基づいて動的に処理を切り替えています。**

このフローにより、複雑なテーブルフィールドでも安全かつ効率的にプレースホルダー置換が実現されています。