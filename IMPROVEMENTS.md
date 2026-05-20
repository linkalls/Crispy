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

## 次のステップ

### 📋 第3段階: コンポーネント完全分割 (今後)

```
src/components/
├── AuthScreen.tsx         - ログイン画面
├── Header.tsx            - ヘッダー
├── TabBar.tsx            - タブバー
├── AccountMenu.tsx       - アカウント切り替えメニュー
├── Timeline.tsx          - タイムラインリスト
├── Note.tsx              - ノート単体コンポーネント
├── ReplyComposer.tsx     - 返信作成パネル
└── MfmRenderer.tsx       - ✅ 完了
```

### 🎨 第4段階: UI/UX改善 (X風に近づけ)

- ボトムシート風アカウント切り替え
- より洗練されたメディア表示
- アニメーション追加
- ナビゲーション改善

### 🔌 第5段階: API機能拡張

- [ ] ユーザープロフィール表示
- [ ] フォロー/フォロワー機能
- [ ] 検索機能
- [ ] DM(ダイレクトメッセージ)
- [ ] ブックマーク機能
- [ ] ライクシステム
- [ ] ユーザーページ表示

## テスト方法

```bash
# 開発サーバー起動
npm run android  # Android Virtual Deviceで実行

# または
npm run ios      # iOSシミュレーターで実行
```

## 現在の状態

- ✅ 画像・メディア表示: 完全対応
- ✅ 返信表示: プレビュー対応
- ✅ 文字表示: 切れ防止対応
- ✅ コード構造: 分割完了
- ⚠️ UI/UX: 改善予定
- ⏳ API機能: 拡張予定

## 注意事項

1. **Android Studio エミュレータでのテスト**
   - デバイスでのテスト時は `npm run android` を実行
   - エラーが出た場合は `npm install` で依存関係を再インストール

2. **画像キャッシング**
   - 初回読み込み時は少し時間がかかります
   - React Nativeはネイティブに画像をキャッシュします

3. **パフォーマンス**
   - 大量の画像読み込み時は、スクロールが重くなる可能性があります
   - 将来的に仮想リスト対応予定

## ファイル構成

```
Crispy/
├── App.tsx              # メインアプリコンポーネント (改善)
├── src/
│   ├── components/      # Reactコンポーネント
│   │   └── MfmRenderer.tsx
│   ├── hooks/           # カスタムホック
│   │   └── useMisskey.ts
│   ├── utils/           # ユーティリティ
│   │   ├── types.ts
│   │   ├── colors.ts
│   │   ├── formatting.ts
│   │   └── index.ts
│   └── styles/          # スタイル定義
│       └── styles.ts
├── package.json
├── tsconfig.json
└── app.json
```

## 次のアクション

ユーザーが `あすべきことはないですか？` と聞いたら:

1. **コンポーネント完全分割**: Note.tsx, Timeline.tsx等を作成
2. **X風UI改善**: アカウントメニューの改善、ボトムシート対応
3. **API拡張**: 新しいMisskey APIエンドポイント対応
