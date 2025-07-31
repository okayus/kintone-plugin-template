# kintone-plugin-template

## 概要
kintoneプラグイン開発のためのテンプレート用リポジトリ。TypeScript,react-jsonschema-formなどを活用してドキュメントとソースコードが集約された開発体験のよくなることを目指している。

#### kintoneプラグイン開発について
- 通常のwebアプリ開発と異なる
  - 開発サーバーが不要
    - 実行環境がkintoneのためローカルサーバーが用意できない
  - ビルド成果物がdesktop.jsとconfig.jsの2ファイル
    - このため、viteの設定ファイルもvite_config.config.tsとvite_desktop.config.tsの2ファイルとなり、`npm run build`でそれぞれ独立してビルドさせる

#### react-jsonschema-formについて
ドキュメントは以下のURLをfetch mcpサーバーを用いて適宜参照して
- "LayoutGridField":https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/LayoutGridField
- "form-props":https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/form-props
- "uiSchema":https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema
- "utility-functions":https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/utility-functions

#### kintone-plugin-templateについて
- json schemaからconfig,desktop共通の型を作っているため、configのjson schemaは`kintone-plugin-template/src/shared/jsonSchema`に作成すること
- json schemaから型ファイルを作成するのにはscript`generate-types`を使うこと