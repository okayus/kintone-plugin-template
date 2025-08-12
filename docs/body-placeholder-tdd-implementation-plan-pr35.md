# bodyプレースホルダー機能 TDD実装計画 (PR#35)

## 概要

bodyフィールドの`{field_code}`形式のプレースホルダーを使用した動的メッセージ生成機能をTest-Driven Development（TDD）で実装する。

**関連**: Issue #34, Pull Request #35

## TDD実装方針

t-wadaのRed-Green-Refactorサイクルに基づく段階的実装：

1. **Red**: 失敗するテストを書く
2. **Green**: テストを通す最小限の実装
3. **Refactor**: 品質向上のためのリファクタリング

## アーキテクチャ設計

### ストラテジーパターン（クロージャベース）

```typescript
// フィールド値取得ストラテジー
type FieldValueStrategy = (record: Record, fieldCode: string) => string;

// 通常フィールド用ストラテジー
const createSimpleFieldStrategy = (): FieldValueStrategy => 
  (record, fieldCode) => record[fieldCode]?.value || "";

// テーブルフィールド用ストラテジー  
const createTableFieldStrategy = (separator = ", "): FieldValueStrategy =>
  (record, fieldCode) => {
    const [tableField, subField] = fieldCode.split('.');
    const table = record[tableField]?.value;
    if (!Array.isArray(table)) return "";
    return table
      .map(row => row.value[subField]?.value || "")
      .filter(val => val.trim() !== "")
      .join(separator);
  };
```

### カリー化によるメッセージ生成

```typescript
// カリー化された置換関数
const replacePlaceholders = 
  (strategy: FieldValueStrategy) =>
  (record: Record) =>
  (body: string): string => {
    return body.replace(/{([^}]+)}/g, (match, fieldCode) => {
      return strategy(record, fieldCode.trim());
    });
  };
```

## 実装ステップ詳細

### Phase 1: 基本置換機能（extractPlaceholdersをスキップ）

#### Red: テスト作成
```typescript
// src/desktop/service/messageGenerators.test.ts
describe('replacePlaceholders', () => {
  it('単一プレースホルダーを置換する', () => {
    const record = { name: { value: '田中' } };
    expect(replacePlaceholders('{name}', record))
      .toBe('田中');
  });
  
  it('複数プレースホルダーを置換する', () => {
    const record = { 
      name: { value: '田中' }, 
      dept: { value: '開発' }
    };
    expect(replacePlaceholders('こんにちは {name} さん、{dept} 部です', record))
      .toBe('こんにちは 田中 さん、開発 部です');
  });
  
  it('存在しないフィールドは空文字に置換する', () => {
    const record = { name: { value: '田中' } };
    expect(replacePlaceholders('Hello {name}, {unknown}', record))
      .toBe('Hello 田中, ');
  });
  
  it('プレースホルダーがない場合はそのまま返す', () => {
    const record = {};
    expect(replacePlaceholders('Hello world', record))
      .toBe('Hello world');
  });
});
```

#### Green: 最小限実装
```typescript
// src/desktop/service/messageGenerators.ts
import type { Record } from "@kintone/rest-api-client/lib/src/client/types";

export const replacePlaceholders = (body: string, record: Record): string => {
  return body.replace(/{([^}]+)}/g, (match, fieldCode) => {
    const field = record[fieldCode.trim()];
    return field?.value?.toString() || '';
  });
};
```

#### Refactor: 品質向上
- 追加テストケース（空文字列、null値、数値フィールド）
- 型安全性の向上
- エラーハンドリング追加
- パフォーマンス最適化

### Phase 2: 通常フィールド対応

#### Red: テスト作成
```typescript
describe('replaceSimpleFields', () => {
  it('should replace single field', () => {
    const record = { name: { value: '田中' } };
    expect(replaceSimpleFields(record, 'Hello {name}'))
      .toBe('Hello 田中');
  });
});
```

#### Green & Refactor
通常フィールド用ストラテジーの実装とリファクタリング

### Phase 3: テーブルフィールド対応

#### Red: テスト作成
```typescript
describe('replaceTableFields', () => {
  it('should concatenate table field values', () => {
    const record = {
      items: {
        value: [
          { value: { name: { value: 'アイテム1' } } },
          { value: { name: { value: 'アイテム2' } } }
        ]
      }
    };
    expect(replaceTableFields(record, '{items.name}'))
      .toBe('アイテム1, アイテム2');
  });
});
```

#### Green & Refactor
テーブルフィールド用ストラテジーの実装

### Phase 4: 統合とリファクタリング

#### MessageService.ts統合
```typescript
// 既存のgenerateMessage関数を新機能に移行
public generateMessage(recordsWithSettings: SettingRecordPair[]): string {
  return this.generateMessageWithPlaceholders(recordsWithSettings);
}

private generateMessageWithPlaceholders(recordsWithSettings: SettingRecordPair[]): string {
  // 新しいプレースホルダー機能を使用
}
```

## ファイル構成

```
src/desktop/service/
├── MessageService.ts           # 既存（修正）
├── MessageService.test.ts      # 既存（テスト追加）
├── messageGenerators.ts        # 新規作成
└── messageGenerators.test.ts   # 新規作成
```

## テストケース一覧

### 基本機能
- 単一フィールド置換
- 複数フィールド置換
- 存在しないフィールドの処理
- 空文字列・null値の処理

### 通常フィールド
- 文字列フィールド
- 数値フィールド
- 空値の処理

### テーブルフィールド
- 単一行テーブル
- 複数行テーブル
- 空テーブル
- ネストしたフィールド

### エラーハンドリング
- 不正なプレースホルダー構文
- null/undefined値の処理
- 型不一致の処理

## パフォーマンス考慮事項

1. **正規表現の最適化**: 置換処理の効率化
2. **メモ化**: 同じbody文字列の再利用時のキャッシュ
3. **遅延評価**: 必要な時のみフィールド値を取得

## 既存機能との互換性

1. **MessageService.generateMessage**: 既存の動作を維持
2. **テストスイート**: 既存テストは全て通過
3. **設定データ**: targetFieldとbodyの共存

## 実装順序

1. **messageGenerators.ts作成** - 基本関数群
2. **messageGenerators.test.ts作成** - テストケース
3. **TDDサイクル実行** - 段階的実装
4. **MessageService統合** - 既存機能への組み込み
5. **統合テスト** - 全体動作確認

## 完了条件

- [ ] 全テストケースが通過
- [ ] 既存機能の動作維持
- [ ] コードカバレッジ90%以上
- [ ] TypeScriptエラーなし
- [ ] ビルド成功
- [ ] ブラウザ動作確認

---

**作成日**: 2025-01-12  
**更新日**: 2025-01-12 (Phase 1をextractPlaceholdersスキップに修正)  
**担当者**: Claude Code  
**レビュー**: 未実施