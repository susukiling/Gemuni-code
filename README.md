# Gemini Code

コード生成に特化したAIチャットアプリ。React + Firebase(Authentication / Firestore / Hosting / **Firebase AI Logic**)。
サーバー(Cloud Functions)は使わず、アプリからFirebase AI Logic経由でGeminiを呼び出します。Gemini APIキーをアプリにもGitにも置く必要はありません。

- ログイン: Googleアカウント / メールアドレス+パスワード
- 設定画面: **アプリアイコン・プロフィールアイコンの編集**、表示名、temperature、文脈の長さ、優先言語、カスタム指示、テーマ、アクセントカラー、文字サイズ、チャット書き出し/全削除、ログアウト
- ホーム画面に追加(PWA)対応。アイコンは設定画面で変更可能

> ⚠️ アプリ名「Gemini Code」はGoogleの製品名と紛らわしいため、公開する場合は `src/config.ts` の `APP_NAME` と `index.html` / `public/manifest.webmanifest` のタイトルを変更してください。

> 📱 パソコンが無い場合は、GitHubのActionsでビルド・公開できます(後述「iPad/スマホだけで公開する」)。

## 1. Firebaseの準備
1. [Firebaseコンソール](https://console.firebase.google.com/)でプロジェクトを作成
2. **Authentication** → ログイン方法 → 「Google」「メール/パスワード」を有効化
3. **Firestore Database** を作成(ロケーション: `asia-northeast1` 推奨)
4. **AI Logic**(Build → AI Logic)→ 始める → **Gemini Developer API** を選んで有効化(画面の案内に従う)
5. プロジェクトの設定 → 「マイアプリ」でWebアプリを追加し、設定値を控える

## 2. ローカルで動かす
```bash
npm install
cp .env.example .env.local        # Firebaseの設定値を入力
npm run dev
```

## 3. デプロイ
```bash
npm i -g firebase-tools
firebase login
firebase use --add                 # プロジェクトを選択
npm run build
firebase deploy                    # Hosting と Firestoreルールを公開
```
Googleログインが失敗する場合は、Authentication → 設定 → 承認済みドメインにHostingのドメインがあるか確認してください。

### GitHub Actionsで自動デプロイ(mainへのpush)
GitHubの Settings → Secrets and variables → Actions に登録:
- `FIREBASE_SERVICE_ACCOUNT` … Firebaseコンソール → プロジェクトの設定 → サービスアカウント → 新しい秘密鍵(JSON)の中身
- `VITE_FIREBASE_API_KEY` / `VITE_FIREBASE_AUTH_DOMAIN` / `VITE_FIREBASE_PROJECT_ID` / `VITE_FIREBASE_STORAGE_BUCKET` / `VITE_FIREBASE_MESSAGING_SENDER_ID` / `VITE_FIREBASE_APP_ID`
- (App Check用)`VITE_RECAPTCHA_SITE_KEY`

## 4. 公開前の安全対策(重要)
APIキーが無い代わりに、**誰がAIを呼べるか**はFirebase側の設定で守ります。
1. **App Check** を有効化: コンソール → App Check → Webアプリを登録(reCAPTCHA)→ サイトキーを `VITE_RECAPTCHA_SITE_KEY` に設定 → AI Logicを「適用」にする
2. **ユーザーごとのレート制限**: コンソールの AI Logic 設定で、1ユーザーあたりの1分間リクエスト数を下げる
3. Google Cloudの**予算アラート**を設定
4. 「コード専用」の指示文はアプリ内(`src/lib/api.ts`)に入っているため、悪意のある利用者はそれを迂回できます。厳密に縛りたい場合はCloud Functions経由に戻す構成が必要です。

## 5. ホーム画面に追加
- **iPhone / iPad**: Safariで開く → 共有 → 「ホーム画面に追加」
- **Android**: Chromeで開く → メニュー → 「アプリをインストール」
- アイコンを変えたいときは 設定 → アプリアイコン → 編集。**追加済みのアイコンは自動では変わらない**ので、一度削除して追加し直してください。

## 6. 運用メモ
- 使うモデル名は `src/config.ts` の `MODEL_NAME`(または環境変数 `VITE_GEMINI_MODEL`)。名前は変わりやすいので [公式のモデル一覧](https://firebase.google.com/docs/ai-logic/models) で確認してください。
- システムプロンプトは `src/lib/api.ts` の `BASE_INSTRUCTION`。
- Firestoreルールは `firestore.rules`(自分のデータのみ読み書き可)。
