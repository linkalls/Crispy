# Crispy - Misskey Mobile Client 改善プロジェクト

## 完了した改善事項

### ✅ 第1段階: メディア・コンテンツ表示

- [x] 画像表示機能を実装
- [x] メディアコンテナのレスポンシブ対応 (複数ファイル表示)
- [x] 返信プレビュー表示機能
- [x] テキスト表示の改善 (flexShrink追加で文字切れ修正)
- [x] ファイル表示UI (ダウンロード可能)

### ✅ 第2段階: コード分割・保守性向上

- [x] App.txsを複数ファイルに分割:
  - `src/utils/types.ts` - 型定義
  - `src/utils/colors.ts` - テーマカラー
  - `src/utils/formatting.ts` - ユーティリティ関数
  - `src/hooks/useMisskey.ts` - API呼び出しホック
  - `src/components/MfmRenderer.tsx` - MFM表示コンポーネント
  - `src/styles/styles.ts` - スタイル定義
  - `src/index.ts` - エクスポートファイル

### ✅ 第3段階: アプリ機能の拡張

- [x] ユーザープロフィール表示
- [x] フォロー / フォロワー表示
- [x] フォロー / ブロック操作
- [x] ノート検索
- [x] 通知一覧
- [x] ノート詳細 / 返信一覧
- [x] 投稿 / 画像添付 / 返信 / リノート / 引用リノート / リアクション
- [x] 画像ビューア
- [x] devモード / API Explorer / ログ表示

### ✅ 第4段階: Bun運用への統一

- [x] `packageManager` は `bun@1.1.0`
- [x] `generate:misskey-presets` を `bun scripts/generate-misskey-explorer.mts` に変更
- [x] `test` を `bun test tests/**/*.test.mts` に変更

## 次のステップ

### 🎨 UI/UX改善: X風の軽いタイムラインUI

- [ ] ライトテーマを白背景 + 黒本文 + 薄い罫線 + 青アクセントに寄せる
- [ ] ダークテーマを黒背景 + 薄いグレー本文 + 青アクセントに寄せる
- [ ] ノートカードを角丸カード型から、境界線で区切るタイムラインセル型へ変更
- [ ] 返信 / リノート / リアクション / 共有ボタンのタップ範囲を広げる
- [ ] ノート内ボタンのタップで詳細画面へ誤遷移しないようにする
- [ ] 投稿モーダルを全画面コンポーザー風にし、文字数・公開範囲・CW・画像添付を見やすくする
- [ ] Home / Explore / Notifications / Profile のヘッダー密度を統一
- [ ] Profile の自分自身に対するフォロー / ブロックボタンを非表示にする
- [ ] 通知画面にタイトルヘッダーと空状態の説明を追加

### 🔌 API機能拡張

- [ ] ブックマーク機能
- [ ] ミュート / ブロック一覧
- [ ] DM(ダイレクトメッセージ)
- [ ] アンテナ / チャンネル対応
- [ ] 下書き保存

## テスト方法

```bash
# 依存関係
bun i

# 開発サーバー起動
bun run android
bun run ios
bun run web

# テスト
bun test
```

## 現在の状態

- ✅ 画像・メディア表示: 対応済み
- ✅ 返信表示: プレビュー対応
- ✅ 文字表示: 切れ防止対応
- ✅ コード構造: 分割済み
- ✅ 主要Misskey操作: 投稿・返信・リノート・引用・リアクション対応
- ✅ Bun運用: package script更新済み
- ⚠️ UI/UX: ソース側の大きい差分適用は別PRで実施予定

## 注意事項

1. **Android Studio エミュレータでのテスト**
   - デバイスでのテスト時は `bun run android` を実行
   - エラーが出た場合は `bun i` で依存関係を再インストール

2. **画像キャッシング**
   - 初回読み込み時は少し時間がかかります
   - React Nativeはネイティブに画像をキャッシュします

3. **パフォーマンス**
   - 大量の画像読み込み時は、スクロールが重くなる可能性があります
   - `FlatList` の仮想化設定は入っているので、次は画像プリロードとメディア軽量化を検討

## ファイル構成

```text
Crispy/
├── app/                   # Expo Router screens
│   ├── (tabs)/            # Home / Explore / Notifications / Profile
│   ├── note/[id].tsx      # ノート詳細
│   ├── user/[id].tsx      # ユーザー詳細
│   ├── settings.tsx       # 設定
│   └── api-explorer.tsx   # API Explorer
├── src/
│   ├── components/        # React Native components
│   ├── context/           # GlobalState / InteractionState
│   ├── hooks/             # useMisskey / stream hooks
│   ├── styles/            # shared styles
│   └── utils/             # types / formatting / API helpers
├── package.json
└── app.json
```
