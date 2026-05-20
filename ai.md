# AI 引き継ぎメモ (for other AI)

目的

- このプロジェクト（Crispy）の現在の状態、修正済み点、残タスク、動作確認手順、次に行うべき実装詳細を他のAIに短時間で渡すためのハンドオフファイル。

重要なファイル

- `App.tsx` - エントリ／状態管理。まだ一部にインラインレンダリングが残るため、コンポーネント化の最終調整が必要。
- `src/components/` - UI コンポーネント群（`MfmRenderer.tsx`, `Timeline.tsx`, `Note.tsx`, `Header.tsx`, `TabBar.tsx`, `AccountMenu.tsx`, `AuthScreen.tsx`, `ReplyComposer.tsx` など）。
- `src/hooks/useMisskey.ts` - Misskey API 用の共通ラッパー（`misskeyRequest` を提供）。
- `src/utils/formatting.ts` - `normalizeHost`, `mapNote`, `toRelativeTime` 等のユーティリティ。
- `src/utils/types.ts` - 型定義。
- `src/styles/styles.ts` - スタイル定義。
- `package.json`, `tsconfig.json` - ビルド／依存設定。

直近で行った変更（要点）

- 画像・メディア表示を改善（`note.files` をマップして `thumbnailUrl` を使用）。
- `MfmRenderer` をコンポーネント化し、テキスト欠け（flexShrink）に配慮したレンダリングを実装。
- Misskey API 呼び出しを `useMisskey` に分離。
- `App.tsx` のレンダリング部を `AuthScreen`, `Header`, `TabBar`, `AccountMenu`, `Timeline` などのコンポーネント呼び出しへ段階的に置換（ただし一部インライン実装が残る可能性あり）。
- `mapNote` の `thumbnailUrl` を `?? undefined` にして TypeScript 型エラーを解消。

現状の注意点 / 既知の問題

- 実行時に `ReferenceError: Property 'MfmRenderer' doesn't exist` が出ることがあったが、現在は `App.tsx` に `MfmRenderer` などのコンポーネントをインポートして修正済み。
- `App.tsx` は大きく、まだ分割／ファイルごと200行以下にするタスクが残っている（要件: 1ファイルあたり ~200行）。
- 一部 UI がまだインラインに残っている（例: `notes.map(...)` 内の完全なレンダリング）。`Timeline` コンポーネントへの完全移行が必要。
- テストは未実施（エミュレータでの実機動作確認が推奨）。

優先してやるべき作業（順序）

1. `App.tsx` の残りのインラインレンダリングを `src/components/Timeline.tsx` と `Note.tsx` に完全移行する。
   - `Timeline` は `notes`, `loading`, `refreshing`, `error` を受け取り、個々の `Note` に必要なハンドラ（reply, renote, share, reaction）を prop として渡す。
   - `Note` は `MfmRenderer` を内部で使用し、メディア表示は `files` 配列を参照する。
2. 各ファイルを 200 行程度に分割して読みやすくする（スタイルは `src/styles/styles.ts` に集約済）。
3. 型チェックとビルド検証：`npx tsc --noEmit` を実行して型エラーがないか確認。
4. 実機での動作確認（Android エミュレータ、Expo）：ログイン → タイムライン取得 → 返信送信 → リノート → リアクション → メディア表示 を検証。

必要な props とハンドラ（参考）

- App 側が持つ状態／関数（主要なもの）
  - `notes: TimelineNote[]`
  - `loadingTimeline: boolean`
  - `refreshing: boolean`
  - `timelineError: string | null`
  - `replyingNoteId: string | null`
  - `replyText: string`
  - `sendingReply: boolean`
  - `activeAccount: StoredAccount | null`
  - `accounts: StoredAccount[]`
  - `themeMode`, `devMode`
  - ハンドラ: `loadTimeline(isRefresh)`, `startMiAuthLogin()`, `finishMiAuthLogin(session, host)`, `handleReactionToggle(noteId, reactionIndex)`, `handleRenote(note)`, `handleShare(note)`, `handleReplySubmit(note)`, `removeAccount(id)`, `setActiveAccountId(id)`

テスト手順（コピーして使えるコマンドと手順）

1. 依存インストール

```bash
npm install
# またはプロジェクトが bun を使うなら
# bun install
```

2. TypeScript 型チェック

```bash
npx tsc --noEmit
```

3. Expo で起動（開発用）

```bash
npx expo start --tunnel
# または
npx expo start --android
```

4. 動作確認の流れ

- 初回: サーバー(例: `misskey.io`) を入力して MiAuth でログイン。
- タイムラインが表示されるか確認。
- ノートの返信ボタンで返信が送れるか確認。
- リノート（renote）とリアクションが機能するか確認。
- 画像/動画がサムネイルで表示され、フルビューへ遷移する場合は外部ビューアで開けるか確認。

デバッグヒント

- ストレージの状態は AsyncStorage のキー `crispy:state:v2` に保存される。
- Misskey API のリクエスト／レスポンスは `useMisskey` 内でラップされているので、そこにログを仕込むと効率的。
- 以前のトランスクリプト（この会話の履歴）は次にあります: `c:\Users\nao03\AppData\Roaming\Code\User\workspaceStorage\88c6ca6279927128e54c3893fc4d1fec\GitHub.copilot-chat\transcripts\15888171-217d-44c2-95df-72ae74341556.jsonl`

開発者向けメモ（設計判断、制約）

- 目的は段階的リファクタ: まず動作安定化（画像、返信、リノート、反応）、次に UI/UX 改善（X風のアカウントメニュー）、最後に細かい最適化。
- 既存スタイルは `src/styles/styles.ts` に集約しているため、新しいコンポーネントはできるだけそこを利用する。
- 1ファイルを 200 行以下に抑えるという要望があるため、`Note`、`Timeline`、`Header`、`AccountMenu`、`AuthScreen` のような単一責任コンポーネントへ分割すること。

残タスク（短いチェックリスト）

- [ ] `App.tsx` の残りのインラインレンダリングを `Timeline` / `Note` に移行
- [ ] 各ファイルを 200 行以下に分割
# AI 引き継ぎメモ (for other AI)

目的

- このプロジェクト（Crispy）の現在の状態、修正済み点、残タスク、動作確認手順、次に行うべき実装詳細を他のAIに短時間で渡すためのハンドオフファイル。

重要なファイル

- `App.tsx` - エントリ／状態管理。まだ一部にインラインレンダリングが残るため、コンポーネント化の最終調整が必要。
- `src/components/` - UI コンポーネント群（`MfmRenderer.tsx`, `Timeline.tsx`, `Note.tsx`, `Header.tsx`, `TabBar.tsx`, `AccountMenu.tsx`, `AuthScreen.tsx`, `ReplyComposer.tsx` など）。
- `src/hooks/useMisskey.ts` - Misskey API 用の共通ラッパー（`misskeyRequest` を提供）。
- `src/utils/formatting.ts` - `normalizeHost`, `mapNote`, `toRelativeTime` 等のユーティリティ。
- `src/utils/types.ts` - 型定義。
- `src/styles/styles.ts` - スタイル定義。
- `package.json`, `tsconfig.json` - ビルド／依存設定。

直近で行った変更（要点）

- 画像・メディア表示を改善（`note.files` をマップして `thumbnailUrl` を使用）。
- `MfmRenderer` をコンポーネント化し、テキスト欠け（flexShrink）に配慮したレンダリングを実装。
- Misskey API 呼び出しを `useMisskey` に分離。
- `App.tsx` のレンダリング部を `AuthScreen`, `Header`, `TabBar`, `AccountMenu`, `Timeline` などのコンポーネント呼び出しへ段階的に置換（ただし一部インライン実装が残る可能性あり）。
- `mapNote` の `thumbnailUrl` を `?? undefined` にして TypeScript 型エラーを解消。

現状の注意点 / 既知の問題

- 実行時に `ReferenceError: Property 'MfmRenderer' doesn't exist` が出ることがあったが、現在は `App.tsx` に `MfmRenderer` などのコンポーネントをインポートして修正済み。
- `App.tsx` は大きく、まだ分割／ファイルごと200行以下にするタスクが残っている（要件: 1ファイルあたり ~200行）。
- 一部 UI がまだインラインに残っている（例: `notes.map(...)` 内の完全なレンダリング）。`Timeline` コンポーネントへの完全移行が必要。
- テストは未実施（エミュレータでの実機動作確認が推奨）。

優先してやるべき作業（順序）

1. `App.tsx` の残りのインラインレンダリングを `src/components/Timeline.tsx` と `Note.tsx` に完全移行する。
   - `Timeline` は `notes`, `loading`, `refreshing`, `error` を受け取り、個々の `Note` に必要なハンドラ（reply, renote, share, reaction）を prop として渡す。
   - `Note` は `MfmRenderer` を内部で使用し、メディア表示は `files` 配列を参照する。
2. 各ファイルを 200 行程度に分割して読みやすくする（スタイルは `src/styles/styles.ts` に集約済）。
3. 型チェックとビルド検証：`npx tsc --noEmit` を実行して型エラーがないか確認。
4. 実機での動作確認（Android エミュレータ、Expo）：ログイン → タイムライン取得 → 返信送信 → リノート → リアクション → メディア表示 を検証。

必要な props とハンドラ（参考）

- App 側が持つ状態／関数（主要なもの）
  - `notes: TimelineNote[]`
  - `loadingTimeline: boolean`
  - `refreshing: boolean`
  - `timelineError: string | null`
  - `replyingNoteId: string | null`
  - `replyText: string`
  - `sendingReply: boolean`
  - `activeAccount: StoredAccount | null`
  - `accounts: StoredAccount[]`
  - `themeMode`, `devMode`
  - ハンドラ: `loadTimeline(isRefresh)`, `startMiAuthLogin()`, `finishMiAuthLogin(session, host)`, `handleReactionToggle(noteId, reactionIndex)`, `handleRenote(note)`, `handleShare(note)`, `handleReplySubmit(note)`, `removeAccount(id)`, `setActiveAccountId(id)`

テスト手順（コピーして使えるコマンドと手順）

1. 依存インストール

```bash
npm install
# またはプロジェクトが bun を使うなら
# bun install
```

2. TypeScript 型チェック

```bash
npx tsc --noEmit
```

3. Expo で起動（開発用）

```bash
npx expo start --tunnel
# または
npx expo start --android
```

4. 動作確認の流れ

- 初回: サーバー(例: `misskey.io`) を入力して MiAuth でログイン。
- タイムラインが表示されるか確認。
- ノートの返信ボタンで返信が送れるか確認。
- リノート（renote）とリアクションが機能するか確認。
- 画像/動画がサムネイルで表示され、フルビューへ遷移する場合は外部ビューアで開けるか確認。

デバッグヒント

- ストレージの状態は AsyncStorage のキー `crispy:state:v2` に保存される。
- Misskey API のリクエスト／レスポンスは `useMisskey` 内でラップされているので、そこにログを仕込むと効率的。
- 以前のトランスクリプト（この会話の履歴）は次にあります: `c:\Users\nao03\AppData\Roaming\Code\User\workspaceStorage\88c6ca6279927128e54c3893fc4d1fec\GitHub.copilot-chat\transcripts\15888171-217d-44c2-95df-72ae74341556.jsonl`

開発者向けメモ（設計判断、制約）

- 目的は段階的リファクタ: まず動作安定化（画像、返信、リノート、反応）、次に UI/UX 改善（X風のアカウントメニュー）、最後に細かい最適化。
- 既存スタイルは `src/styles/styles.ts` に集約しているため、新しいコンポーネントはできるだけそこを利用する。
- 1ファイルを 200 行以下に抑えるという要望があるため、`Note`、`Timeline`、`Header`、`AccountMenu`、`AuthScreen` のような単一責任コンポーネントへ分割すること。

残タスク（短いチェックリスト）

- [ ] `App.tsx` の残りのインラインレンダリングを `Timeline` / `Note` に移行
- [ ] 各ファイルを 200 行以下に分割
- [ ] 型チェック（`npx tsc --noEmit`）をパスさせる
- [ ] Expo での実機検証
- [ ] UX 改善: アカウント切替 UI を X風にする（ボトムシート等）

質問や決める必要があること

- アカウント切替はボトムシート UI で統一して良いか？（推奨だが仕様確認が必要）
- 画像プレビューはアプリ内モーダルか、外部ブラウザで開くか（現状は `Image` でサムネイルのみ）。

## UI設計思想（世界観の保護）

- **OS標準のネイティブUI（Alertダイアログなど）は一切使用しない**こと。
- アクション選択（リポスト/引用など）、リアクション選択、ログアウト確認、各種通知（トースト）はすべて独自デザインのカスタムコンポーネント（ボトムシート等）を使用し、アプリ全体で統一されたプレミアムな世界観を守る。
- X (旧Twitter) のような洗練された余白、タイポグラフィ、ボトムシート体験を目指す。

以上。必要ならこの `ai.md` を拡張してコードスニペット、関数シグネチャ、具体的な差分パッチ等を追加します。