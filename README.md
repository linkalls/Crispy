# Crispy

Misskey API に接続する Expo + TypeScript のモバイルクライアントです。

## Setup (Bun)

```bash
bun i
```

## Run

```bash
bun run start
```

必要に応じて:

```bash
bun run android
bun run ios
bun run web
```

## Misskey API 接続

1. アプリ上部で Misskey ホスト（例: `misskey.io`）を入力
2. API トークンを入力（HOME タイムライン/リアクション操作には必須）
3. `Connect` を押してタイムラインを読み込み
