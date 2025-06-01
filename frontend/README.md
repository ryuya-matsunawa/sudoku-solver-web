# 数独自動解答ツール（フロントエンド）

このプロジェクトは、ユーザーがブラウザ上で数独（ナンプレ）を入力・解答できるNext.js製のフロントエンドアプリケーションです。

## 🚀 起動方法（ローカル開発）

```bash
yarn install
yarn dev
```

デフォルトでは、アプリケーションは [http://localhost:3000](http://localhost:3000) で起動します。

## 💻 技術スタック

- **フレームワーク**: [Next.js](https://nextjs.org/) (v15.1.8)
- **言語**: [TypeScript](https://www.typescriptlang.org/) (v5)
- **スタイリング**: [TailwindCSS](https://tailwindcss.com/) (v3.4.1)
- **テスト**: [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## 📁 プロジェクト構成

```
frontend/
├── src/
│   ├── app/              # App Routerのエントリーポイント
│   │   ├── layout.tsx    # 全ページ共通のレイアウト
│   │   ├── page.tsx      # ホームページ
│   │   └── globals.css   # グローバルスタイル
│   │
│   └── components/       # 再利用可能なコンポーネント
│       └── SudokuGrid.tsx # 数独グリッドコンポーネント
│
├── public/              # 静的ファイル
├── __tests__/           # テストファイル
└── ...設定ファイル
```

## 🧪 テスト

テストを実行するには：

```bash
yarn test
```

## 📦 ビルド

本番用ビルドを作成するには：

```bash
yarn build
yarn start
```

## 🛠️ 環境変数

| 変数名 | 説明 | デフォルト値 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | バックエンドAPIのURL | `http://localhost:8000` |

## 📄 ライセンス

このプロジェクトは [MITライセンス](../LICENSE) の下で公開されています。
