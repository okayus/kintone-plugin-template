# Serena MCP Server セットアップガイド

このドキュメントは、kintone-plugin-templateプロジェクトでSerena MCP Serverを使用するためのセットアップ手順を説明します。

## 前提条件

- WSL2またはLinux環境
- mise（ツールバージョン管理）がインストール済み
- Git環境

## セットアップ手順

### 1. mise環境の確認と設定

#### 1.1 mise doctorで現在の状態を確認
```bash
mise doctor
```

出力例で以下を確認：
- `activated: no` → miseが有効化されていない
- `shims_on_path: no` → shimsがPATHに追加されていない
- ツールセット: `uv@0.8.4` がインストール済み

#### 1.2 miseの有効化
bashrcにmise activateを追加：
```bash
echo 'eval "$(mise activate bash)"' >> ~/.bashrc
source ~/.bashrc
```

#### 1.3 有効化の確認
```bash
uvx --version
```
`uvx 0.8.4` が表示されれば成功

### 2. Serena MCP Serverのインストールと起動

#### 2.1 Serena MCP Serverの実行
```bash
uvx --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project /home/okayu/dev/kintone-plugin/kintone-plugin-template
```

#### 2.2 初回起動時の処理
以下が自動的に実行されます：
- 依存関係のダウンロード（pydantic-core, pyright, tiktoken等）
- Serenaパッケージのビルドとインストール
- 設定ファイルの自動生成（`~/.serena/serena_config.yml`）
- プロジェクト設定の自動生成
- TypeScript Language Serverのインストールと起動

#### 2.3 起動成功の確認
以下のログが表示されれば成功：
```
INFO  [MainThread] serena.agent:__init__:204 - Starting Serena server (version=0.1.4-xxxx, process id=xxxx, parent process id=xxxx)
INFO  [MainThread] serena.mcp:server_lifespan:347 - MCP server lifetime setup complete
```

### 3. Claude Codeとの接続

#### 3.1 Claude Code設定ファイル
Claude Codeの設定ファイル（`~/.claude.json`）に以下の設定が含まれている必要があります：
```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/oraios/serena", "serena-mcp-server", "--context", "ide-assistant", "--project", "/home/okayu/dev/kintone-plugin/kintone-plugin-template"]
    }
  }
}
```

#### 3.2 接続確認
Claude Code起動時に自動的にSerena MCP Serverに接続されます。接続成功時は以下の機能が利用可能になります：
- コードシンボル解析
- ファイル検索・操作
- メモリ機能
- プロジェクト管理

### 4. 利用可能な機能

Serena MCP Serverが提供する主要なツール（20個）：
- `list_dir` - ディレクトリ一覧
- `find_file` - ファイル検索
- `search_for_pattern` - パターン検索
- `get_symbols_overview` - シンボル概要取得
- `find_symbol` - シンボル検索
- `find_referencing_symbols` - 参照元検索
- `replace_symbol_body` - シンボル本体置換
- `insert_after_symbol` - シンボル後に挿入
- `insert_before_symbol` - シンボル前に挿入
- `write_memory` - メモリ書き込み
- `read_memory` - メモリ読み取り
- その他管理機能

### 5. Webダッシュボード

Serena起動時にWebダッシュボードも利用可能：
```
http://127.0.0.1:24282/dashboard/index.html
```

### 6. トラブルシューティング

#### 6.1 `uvx: command not found` エラー
```bash
# miseが有効化されているか確認
eval "$(mise activate bash)" && uvx --version
```

#### 6.2 接続失敗時
1. miseの有効化状態を確認
2. Serena MCP Serverが正常に起動しているか確認
3. Claude Code設定ファイルのパスが正しいか確認

#### 6.3 Language Server関連エラー
TypeScript Language Serverは初回起動時に自動インストールされます。
インストールに失敗した場合は、以下のディレクトリを削除して再実行：
```bash
rm -rf ~/.serena/language_servers/
```

## ログファイル

Serenaのログは以下に保存されます：
```
~/.serena/logs/YYYY-MM-DD/mcp_YYYYMMDD-HHMMSS.txt
```

問題が発生した場合は、このログファイルで詳細を確認できます。