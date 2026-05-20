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

1. 初回起動で Misskey ホスト（例: `misskey.io`）を入力
2. `Misskeyでログイン` を押して OAuth (MiAuth) 認証
3. 認証後に HOME / LOCAL / GLOBAL タイムラインを利用

## 追加機能

- 初回起動オンボーディング + OAuth ログイン
- 複数アカウントの追加 / 切り替え / 削除
- 設定の `devモード` で API 詳細情報を表示

## CI (GitHub Actions)

- `Android APK Build` workflowでAPKをビルド
- `crispy-android-apk` artifactとして `app-release.apk` をアップロード（本番配布向け）

## Android で `Unable to load script` が出る場合

このエラーは **debugビルド** をMetro未接続で起動した時に発生します。

- 本番配布は `app-release.apk` を使用してください（JS bundle同梱）
- 開発中に debug を使う場合は Metro を起動し、必要に応じて以下を実行:

```bash
adb reverse tcp:8081 tcp:8081
```
