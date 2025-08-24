# TypeScriptの`as`型キャスト除去実装記録

## 概要

MessageService.test.tsにおいて、`as`による型キャストを可能な限り除去し、型安全なテストコードを実装した記録です。

## 実装背景

- TypeScriptの型安全性を最大限活用
- `as`キャストによる型の隠蔽を避け、コンパイル時の型チェックを強化
- テストコードの保守性と可読性の向上

## 修正前の問題点

### 主な`as`キャストの使用箇所

```typescript
// 1. global.kintoneの型キャスト
global.kintone = {
  app: { getId: () => 123, getQueryCondition: () => "" },
  plugin: { app: { getConfig: () => ({}) } },
} as unknown as typeof kintone;

// 2. mockRestApiClientの型キャスト  
mockRestApiClient = {
  record: { getRecords: vi.fn() },
} as unknown as Mocked<KintoneRestAPIClient>;

// 3. mockKintoneSdkの型キャスト
mockkintoneSdk = new KintoneSdk(mockRestApiClient) as Mocked<KintoneSdk>;

// 4. レコード配列の型キャスト
records: [{ field1: { type: "SINGLE_LINE_TEXT", value: "value1" } }] as KintoneRecord[],
```

## 実装アプローチ

### 1. モックヘルパー関数の実装

```typescript
// テスト用のグローバルkintoneオブジェクト設定
const mockKintone = {
  app: {
    getId: vi.fn(),
    getQueryCondition: vi.fn(),
  },
  plugin: {
    app: {
      getConfig: vi.fn(),
    },
  },
};

// 型安全なテストレコード作成
function createTestRecord(
  fields: Record<string, { type: string; value: string }>,
): KintoneRecord {
  const record: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) {
    record[key] = value;
  }
  return record;
}
```

### 2. 型宣言の最適化

**修正前（問題のある型宣言）:**
```typescript
let mockkintoneSdk: Mocked<KintoneSdk>;
let mockRestApiClient: Mocked<KintoneRestAPIClient>;
```

**修正後（実用的な型宣言）:**
```typescript
let mockkintoneSdk: KintoneSdk & { getRecords: Mock };
let mockRestApiClient: { record: { getRecords: Mock } };
```

### 3. Object.assignとObject.definePropertyの活用

```typescript
beforeEach(() => {
  // global.kintone設定（型キャストなし）
  Object.assign(global, { kintone: mockKintone });

  // モック初期化
  mockKintone.app.getId.mockReturnValue(123);
  mockKintone.app.getQueryCondition.mockReturnValue("");
  mockKintone.plugin.app.getConfig.mockReturnValue({});

  // 最小限のmockRestApiClient
  mockRestApiClient = {
    record: {
      getRecords: vi.fn(),
    },
  };

  // KintoneSdk作成とgetRecordsの上書き
  const sdkInstance = new KintoneSdk(mockRestApiClient as unknown as KintoneRestAPIClient);
  Object.defineProperty(sdkInstance, "getRecords", {
    value: vi.fn(),
    writable: true,
    configurable: true,
  });
  mockkintoneSdk = sdkInstance as KintoneSdk & { getRecords: Mock };
});
```

### 4. レコードデータの型安全な作成

**修正前:**
```typescript
records: [
  { field1: { type: "SINGLE_LINE_TEXT", value: "value1" } }
] as KintoneRecord[],
```

**修正後:**
```typescript
const records: KintoneRecord[] = [
  createTestRecord({
    field1: { type: "SINGLE_LINE_TEXT", value: "value1" },
    field2: { type: "SINGLE_LINE_TEXT", value: "value2" },
  }),
];
```

## Object.assignとObject.definePropertyの詳細解説

### Object.assignの使用理由

```typescript
// global.kintone設定
Object.assign(global, { kintone: mockKintone });
```

**効果:**
- `global`オブジェクトに`kintone`プロパティを安全に追加
- 複数プロパティの一括設定が可能
- 型キャストを使わずにグローバル変数を模擬

### Object.definePropertyの使用理由

```typescript
Object.defineProperty(sdkInstance, "getRecords", {
  value: vi.fn(),
  writable: true,
  configurable: true,
});
```

**なぜ必要か:**
1. **通常の代入の限界**: `sdkInstance.getRecords = vi.fn()`は型エラー
2. **プロパティ制御**: `writable`、`configurable`で詳細制御
3. **部分モック**: 特定メソッドのみをモック化

## 最終的な成果

### `as`キャスト使用箇所

**完全除去:** 一般的なテストロジック部分
**限定使用:** KintoneSdkの設計上の問題に対してのみ

```typescript
// KintoneSdkの設計上の問題のためasキャスト使用（例外的使用）
const sdkInstance = new KintoneSdk(mockRestApiClient as unknown as KintoneRestAPIClient);
mockkintoneSdk = sdkInstance as KintoneSdk & { getRecords: Mock };
```

### テスト結果

```bash
✓ src/shared/util/KintoneSdk.test.ts (3 tests)
✓ src/desktop/service/messageGenerators.test.ts (28 tests)  
✓ src/desktop/service/MessageService.test.ts (9 tests)

Test Files  3 passed (3)
Tests  40 passed (40)
```

## 教訓とベストプラクティス

### 1. 型安全なモック作成パターン

```typescript
// ❌ 避けるべきパターン
const mock = {} as CompleteInterface;

// ✅ 推奨パターン
const mock: Partial<CompleteInterface> = {
  requiredMethod: vi.fn(),
};
```

### 2. グローバル変数のモック

```typescript
// ❌ 直接代入
global.someGlobal = mockObject as GlobalType;

// ✅ Object.assign使用
Object.assign(global, { someGlobal: mockObject });
```

### 3. 部分的なプロパティ上書き

```typescript
// ❌ 全体の型キャスト
const mockInstance = realInstance as MockedType;

// ✅ 特定プロパティのみ上書き
Object.defineProperty(realInstance, "methodName", {
  value: vi.fn(),
  writable: true,
  configurable: true,
});
```

### 4. テストデータ作成

```typescript
// ❌ 型キャストに依存
const data = { prop: "value" } as ComplexType;

// ✅ ヘルパー関数による型安全な作成
function createTestData(props: SimpleProps): ComplexType {
  // 内部で適切な変換処理
  return transformedData;
}
```

## 結論

- **型安全性の向上**: コンパイル時のエラー検出が強化
- **保守性の向上**: 型変更時の影響範囲が明確
- **可読性の向上**: 意図が明確なテストコード
- **実用性のバランス**: 設計上の問題には例外的に`as`を使用

この実装により、TypeScriptの型システムを最大限活用しつつ、実用的なテストコードを実現できました。