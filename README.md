# サッカー作戦盤アプリケーション

シンプルな JavaScript で作られた、サッカーの戦術を視覚化するためのウェブアプリケーションです。GitHub Pages でホスティングされています。

## アクセス方法

- [サッカー作戦盤](https://yulikepython.github.io/soccer-tactics-app/)

## 主な機能

- 選手、ボール、コーンなどのオブジェクトの配置
- ドリブル、パス、ランニングなどの線の描画
- 作戦の保存とスクリーンショット機能

## プロジェクト構成

- `dist/` - GitHub Pages で公開されるウェブサイトファイル
- `docs/` - ドキュメント・マークダウンソース
- `src/` - アプリケーションのソースコード
  - `components/` - UI コンポーネント
  - `utils/` - ユーティリティ関数
  - `tests/` - テストファイル

## 開発

### テスト

```bash
npm test
```

## デプロイ

このリポジトリは GitHub Actions によって自動的に GitHub Pages にデプロイされます。
`main` ブランチにプッシュすると、`dist` フォルダの内容が GitHub Pages として公開されます。

## 使用ライブラリ

- [Bootstrap](https://getbootstrap.com/)
- [Marked.js](https://github.com/markedjs/marked)

## ライセンス

このプロジェクトは [MIT ライセンス](LICENSE) の下で提供されています。
© 2025 Hiroshi Nishito
