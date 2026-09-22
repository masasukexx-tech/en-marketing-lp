# EN LinkedIn営業支援ツール

株式会社ENのLinkedIn営業を半自動化する営業支援Webアプリです。
LinkedIn上の人物情報を手動で登録すると、Anthropic API（Claude）が株式会社ENとの相性を判定し、
つながり申請文・初回DMの下書きを生成します。**送信・自動操作は一切行いません。**

社内専用ツールのため、**ログインしないと一切の画面・APIが利用できません**（単一アカウントでのログイン制）。

## 安全設計（必読）

- LinkedInのスクレイピング、Playwright/Puppeteer/Selenium等によるLinkedIn操作、Chrome拡張は実装していません。
- LinkedInのログインID・パスワード・Cookie・セッション情報は取得・保存しません。
- LinkedInの情報は**すべて人間が手動でコピー＆ペースト**して登録します。
- 「つながる」ボタンの自動クリックやメッセージの自動送信は実装していません。
- 送信系の機能は `src/lib/linkedin-adapter.ts` の `LinkedInAdapter` インターフェースに分離されており、
  現在は `ManualLinkedInAdapter`（プロフィールを新しいタブで開く／文章をクリップボードにコピーする、の2つのみ）を実装しています。
  将来、正式に承認されたLinkedIn APIが利用可能になった場合は、このインターフェースを実装した別アダプターに差し替える想定です。
- 実際にLinkedIn上で「つながる」「送信する」を押すのは、常に人間です。
- アプリ自体へのアクセスも、環境変数で設定した単一アカウントによるログインなしでは一切できません（後述）。

## 作成した機能

1. **ログイン** (`/login`) — 単一アカウント制。未ログイン時は全ページ・全APIへのアクセスを拒否します。
2. **ダッシュボード** (`/`) — 登録候補数・審査済み数・つながり申請済み数・接続済み数・初回DM送信済み数・返信数・商談数、および接続率・返信率・商談化率を表示。次回対応が近い候補者リストも表示。
3. **候補者登録** (`/leads/new`) — 個別登録フォーム、およびCSV一括登録（テンプレートダウンロード・貼り付け/ファイル選択・プレビュー・エラー表示に対応）。
4. **相性判定** — Claudeが総合スコア／顧客候補スコア／協業候補スコア／優先度(A/B/C)／相性理由／相手の課題／ENの提供価値／話題候補／見送り理由を判定。情報不足時は「不足情報」「追加すべき項目」「汎用文面への警告」を返す設計。
5. **つながり申請文の生成** — 180文字目安、丁寧/親しみ/協業可能性の3パターン。
6. **初回DMの生成** — 350文字目安、承認への御礼→事業/経歴への言及→連絡理由→ENの紹介→質問→提案の構成で、関係構築型/協業提案型/課題仮説型の3パターン。
7. **文面チェック** — 売り込み感・定型文・固有性・敬語・捏造・文字数・質問の有無の7項目を自動判定し、問題があれば自動修正版を生成（`checkResult`として保存、UI上で編集・再チェックも可能）。
8. **営業管理** — 候補〜見送りまで11ステータスの管理、履歴（ステータス変更・相性判定・メッセージ生成・コピー・返信・メモ・次回対応日設定）を`Activity`として全保存。
9. **操作ボタン** — LinkedInを別タブで開く／各種メッセージのコピー／申請済み・接続済み・DM送信済み・商談化・見送りへの変更／返信内容の記録。
10. **候補者一覧** — ステータス・優先度・スコア・顧客候補/協業候補・業界・役職・登録日・次回対応日で絞り込み、相性スコア順/登録日順/次回対応日順/未対応優先で並び替え。
11. **データモデル** — `Lead` / `Company` / `ProfileAnalysis` / `MessageDraft` / `Activity` / `FollowUp` / `AppSetting`（Prisma / PostgreSQL）。

## 技術構成

Next.js (App Router) / TypeScript / Tailwind CSS / shadcn/ui相当の自作コンポーネント / Prisma + PostgreSQL / Anthropic API / bcryptjs（パスワードハッシュ） / Zod / Vitest

## ローカルでの起動方法

このアプリは**PostgreSQL専用**です（Vercelなどのサーバーレス環境ではSQLiteのファイル永続化ができないため）。
ローカル開発でも、以下のいずれかでPostgreSQLを用意してください。

- **お勧め: Neon または Supabase の無料枠**（インストール不要。本番と同じ構成で開発できます）
- または、Dockerでローカルに起動: `docker run --name en-sales-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`
  （その場合 `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/en_sales_dev"`）

```bash
cd sales-assistant
cp .env.example .env
# .env に DATABASE_URL / AUTH_SECRET / APP_LOGIN_EMAIL / APP_PASSWORD_HASH を設定してください
# （ANTHROPIC_API_KEY は任意。設定しなくてもモックモードで動作します）

npm install                 # postinstallでprisma generateが自動実行されます
npm run prisma:migrate:deploy   # マイグレーションを適用してテーブルを作成
npm run prisma:seed             # デモ用のモックデータを投入（任意）

npm run dev                  # http://localhost:3000 （まず /login でログイン）
```

その他のコマンド:

```bash
npm run typecheck            # tsc --noEmit
npm run test                  # vitest run
npm run lint                   # next lint
npm run build                  # 本番ビルド（next build）
npm run prisma:studio          # DBをGUIで確認
npm run prisma:migrate         # スキーマ変更時に新しいマイグレーションを作成（開発用）
npm run auth:hash-password -- "パスワード"   # APP_PASSWORD_HASH用のbcryptハッシュを生成
```

## 必要な環境変数（`.env` / Vercelの環境変数）

```
# ==== 必須 ====
DATABASE_URL=            # PostgreSQL接続文字列（Neon / Supabase 等）
AUTH_SECRET=              # セッション署名用のランダムな秘密文字列（openssl rand -base64 32 等で生成）
APP_LOGIN_EMAIL=          # 社内ログイン用の単一アカウントのメールアドレス
APP_PASSWORD_HASH=        # 上記アカウントのパスワードのbcryptハッシュ値（平文は保存しない）

# ==== 任意 ====
ANTHROPIC_API_KEY=        # 未設定の場合は相性判定・文面生成がモックモードで動作
ANTHROPIC_MODEL=claude-sonnet-5
```

`APP_PASSWORD_HASH` は平文パスワードではなく、必ずbcryptハッシュ値を設定してください。
`npm run auth:hash-password -- "設定したいパスワード"` を実行すると、`.env` にそのまま貼り付けられるハッシュ値が出力されます
（出力されるのはハッシュ値のみで、パスワード自体は画面やログに表示されません）。

### モックモード（Anthropic APIキー）

`ANTHROPIC_API_KEY` が未設定の場合でも、Claudeを呼び出す代わりに軽量なテンプレートで結果を生成する
**モックモード**で自動的に動作します。相性判定・つながり申請文/初回DM生成・文面チェックを含む
一連の画面操作をAPIキーなしで確認できます（画面上部と各結果に「モック生成」であることを明示するバナー/バッジを表示します）。

### ログイン認証

単一アカウント制のシンプルな認証です。`/login` 以外の全ページ・`/api/auth/*` 以外の全APIルートは、
有効なセッションCookieがない限り閲覧・実行できません（ページは`/login`へリダイレクト、APIは401を返します）。

- セッションはHMAC-SHA256で署名したトークンをHttpOnly・SameSite=Lax・（本番では）Secure属性のCookieに保存し、
  12時間で自動的に失効します。
- パスワードはbcryptでハッシュ化した値のみを環境変数として保持し、コードやGitHubには一切保存しません。
- ナビゲーションバーの「ログアウト」ボタンでいつでもセッションを破棄できます。

## Vercelへのテスト公開手順（初心者向け）

**⚠️ まだ実行しないでください。** 以下は「これから何をするか」の案内です。外部サービスのアカウント作成や
環境変数の入力が必要になった時点で、実際の値の入力はあなた自身が行ってください（このアシスタントは
外部サービスに登録したり、実際のパスワード・APIキーを扱ったりすることはできません）。

1. **PostgreSQLデータベースを用意する**（NeonまたはSupabase、どちらも無料枠があります）
   - [Neon](https://neon.tech) の場合: アカウント作成 → 「New Project」→ 作成後に表示される接続文字列（`postgresql://...`から始まる文字列）をコピー。これが `DATABASE_URL` です。
   - [Supabase](https://supabase.com) の場合: アカウント作成 → 「New Project」→ Project Settings → Database → Connection string（"URI"タブ）をコピー。
2. **ログイン用の値を決める**
   - 使いたいメールアドレスを決める（これが `APP_LOGIN_EMAIL`）。
   - ターミナルで `npm run auth:hash-password -- "使いたいパスワード"` を実行し、出力された文字列をコピー（これが `APP_PASSWORD_HASH`）。
   - ターミナルで `openssl rand -base64 32` を実行し、出力された文字列をコピー（これが `AUTH_SECRET`）。
3. **Vercelでプロジェクトを作成する**
   - [Vercel](https://vercel.com) にGitHubアカウントでログイン。
   - 「Add New...」→「Project」→ このGitHubリポジトリ（`en-marketing-lp`）を選択してImport。
   - 「Root Directory」の設定で `sales-assistant` を指定してください（重要: これを忘れるとビルドに失敗します）。
   - Frameworkは自動的に「Next.js」と認識されるはずです。
4. **環境変数を設定する**（Vercelの「Environment Variables」欄に1行ずつ追加）
   - `DATABASE_URL`（手順1でコピーした接続文字列）
   - `AUTH_SECRET`（手順2で生成した文字列）
   - `APP_LOGIN_EMAIL`（手順2で決めたメールアドレス）
   - `APP_PASSWORD_HASH`（手順2で生成したハッシュ値）
   - `ANTHROPIC_API_KEY`（任意。実際のAI機能を使いたい場合のみ設定。未設定でもモックモードで画面確認できます）
5. **Deployを実行する**
   - 上記を設定したら「Deploy」ボタンを押してください。
   - ビルド時に `prisma migrate deploy` が自動実行され、手順1で作ったデータベースにテーブルが作成されます（既存データを壊す操作は行われません）。
6. **公開されたURLにアクセスし、`/login` でログインする**
   - 手順2で決めたメールアドレス・パスワードでログインしてください。

このリポジトリのPull Request #2には、上記の準備（PostgreSQL対応・ログイン機能・`vercel-build`スクリプト等）が
すべて含まれています。手順3で連携する際は、このPRがマージされたあと（またはこのブランチを対象に）Vercel側で
プレビューデプロイを作成する形でも確認できます。

## テスト結果

この変更を作業した実行環境は npm レジストリへの外部アクセスがネットワークポリシーにより遮断されており、
`npm install` 等をこの場で直接実行できません。そのため、GitHub Actions（`.github/workflows/sales-assistant-ci.yml`）で
実際に `npm ci` → `prisma generate` → `prisma migrate deploy`（PostgreSQLのservice containerに対して）→
`lint` → `typecheck` → `test` → `build` を実行して検証しています。また、外部パッケージに依存しない
セッション署名/検証ロジック（`lib/auth/session.ts`）は、このマシンの `ts-node` で実データを使って動作確認済みです。

## 現時点での制限

- 対応期日(FollowUp)は「完了/未完了」のトグルUIを未実装です（次回対応日の設定・履歴記録までは可能）。
- 候補者の削除機能は未実装です（登録ミスの取り消しが必要な場合はDBを直接操作するか、追加実装が必要です）。
- メッセージ生成のたびに Claude を複数回（生成1回＋3パターンぶんの文面チェック3回 = 最大4回）呼び出すため、API利用料・応答時間がやや大きくなります。
- 複数ユーザーでの同時利用・権限管理は想定していません（単一アカウントのみ）。ログイン試行回数の制限（レート制限）も未実装です。
- LinkedInの正式APIとの連携は未実装です（`LinkedInAdapter` インターフェースとして分離済みなので、将来の差し替えは容易です）。

## 次に追加すべき機能（提案）

1. 対応期日(FollowUp)の完了管理UI、候補者削除・アーカイブ機能。
2. Claude呼び出し回数を減らすオプション（文面チェックをスキップして生成のみ行うトグル等）。
3. `AppSetting` を使った、EN事業内容・ターゲットペルソナのUIからの編集機能（現在はコード内に固定）。
4. ログイン試行回数のレート制限、複数担当者での利用を想定した認証・担当者別の絞り込み。
5. 正式なLinkedIn APIが利用可能になった場合の `LinkedInAdapter` 実装差し替え。
6. 実際のVercel本番公開と、公開後の動作確認・スクリーンショット取得。
