# EN LinkedIn営業支援ツール

株式会社ENのLinkedIn営業を半自動化する、**ローカルで動作する**営業支援Webアプリです。
LinkedIn上の人物情報を手動で登録すると、Anthropic API（Claude）が株式会社ENとの相性を判定し、
つながり申請文・初回DMの下書きを生成します。**送信・自動操作は一切行いません。**

## 安全設計（必読）

- LinkedInのスクレイピング、Playwright/Puppeteer/Selenium等によるLinkedIn操作、Chrome拡張は実装していません。
- LinkedInのログインID・パスワード・Cookie・セッション情報は取得・保存しません。
- LinkedInの情報は**すべて人間が手動でコピー＆ペースト**して登録します。
- 「つながる」ボタンの自動クリックやメッセージの自動送信は実装していません。
- 送信系の機能は `src/lib/linkedin-adapter.ts` の `LinkedInAdapter` インターフェースに分離されており、
  現在は `ManualLinkedInAdapter`（プロフィールを新しいタブで開く／文章をクリップボードにコピーする、の2つのみ）を実装しています。
  将来、正式に承認されたLinkedIn APIが利用可能になった場合は、このインターフェースを実装した別アダプターに差し替える想定です。
- 実際にLinkedIn上で「つながる」「送信する」を押すのは、常に人間です。

## 作成した機能

1. **ダッシュボード** (`/`) — 登録候補数・審査済み数・つながり申請済み数・接続済み数・初回DM送信済み数・返信数・商談数、および接続率・返信率・商談化率を表示。次回対応が近い候補者リストも表示。
2. **候補者登録** (`/leads/new`) — 個別登録フォーム、およびCSV一括登録（テンプレートダウンロード・貼り付け/ファイル選択・プレビュー・エラー表示に対応）。
3. **相性判定** — Claudeが総合スコア／顧客候補スコア／協業候補スコア／優先度(A/B/C)／相性理由／相手の課題／ENの提供価値／話題候補／見送り理由を判定。情報不足時は「不足情報」「追加すべき項目」「汎用文面への警告」を返す設計。
4. **つながり申請文の生成** — 180文字目安、丁寧/親しみ/協業可能性の3パターン。
5. **初回DMの生成** — 350文字目安、承認への御礼→事業/経歴への言及→連絡理由→ENの紹介→質問→提案の構成で、関係構築型/協業提案型/課題仮説型の3パターン。
6. **文面チェック** — 売り込み感・定型文・固有性・敬語・捏造・文字数・質問の有無の7項目を自動判定し、問題があれば自動修正版を生成（`checkResult`として保存、UI上で編集・再チェックも可能）。
7. **営業管理** — 候補〜見送りまで11ステータスの管理、履歴（ステータス変更・相性判定・メッセージ生成・コピー・返信・メモ・次回対応日設定）を`Activity`として全保存。
8. **操作ボタン** — LinkedInを別タブで開く／各種メッセージのコピー／申請済み・接続済み・DM送信済み・商談化・見送りへの変更／返信内容の記録。
9. **候補者一覧** — ステータス・優先度・スコア・顧客候補/協業候補・業界・役職・登録日・次回対応日で絞り込み、相性スコア順/登録日順/次回対応日順/未対応優先で並び替え。
10. **データモデル** — `Lead` / `Company` / `ProfileAnalysis` / `MessageDraft` / `Activity` / `FollowUp` / `AppSetting`（Prisma / SQLite）。

## 技術構成

Next.js (App Router) / TypeScript / Tailwind CSS / shadcn/ui相当の自作コンポーネント / Prisma + SQLite / Anthropic API / Zod / Vitest

## 起動方法

```bash
cd sales-assistant
cp .env.example .env
# .env に ANTHROPIC_API_KEY を設定してください

npm install          # postinstallでprisma generateが自動実行されます
npm run prisma:push  # SQLiteにスキーマを反映（初回のみ / dev.dbを作成）
npm run prisma:seed  # デモ用のモックデータを投入（任意）

npm run dev           # http://localhost:3000
```

その他のコマンド:

```bash
npm run typecheck   # tsc --noEmit
npm run test         # vitest run
npm run lint          # next lint
npm run build         # 本番ビルド
npm run prisma:studio # DBをGUIで確認
```

## 必要な環境変数（`.env`）

```
ANTHROPIC_API_KEY=      # 必須。相性判定・文面生成・文面チェックに使用
ANTHROPIC_MODEL=claude-sonnet-5   # 任意。既定値のままで可
DATABASE_URL="file:./dev.db"       # 任意。既定値のままで可（SQLite）
```

`ANTHROPIC_API_KEY` が未設定の場合、AI関連のAPIは503エラーで分かりやすく失敗します（登録・一覧・管理系の機能はAPIキーなしでも動作します）。

## テスト結果

このセッションの実行環境は npm レジストリ（registry.npmjs.org）への外部アクセスがネットワークポリシーにより遮断されており、
`npm install` ・ `next build` ・ `vitest run` をこの場で直接実行することができませんでした（403 host_not_allowed）。

そのため、代わりに以下の検証を行っています。

- 外部パッケージに依存しない純粋ロジック（`lib/csv.ts` の CSV パーサー、`lib/status.ts` のステータス/率計算、
  `lib/stats.ts` のダッシュボード指標計算、`lib/leads.ts` の一覧ソートロジック）について、このマシンにグローバルインストールされている
  `ts-node` を使い、`tests/*.test.ts` と同内容のアサーションを実データで実行し、**全項目パス**を確認済みです。
- `zod` / `@prisma/client` / React コンポーネント等、外部パッケージに依存するコードは型・構文をコードレビューで確認していますが、
  実際の `tsc --noEmit` ・ `vitest run` ・ `next build` の実行はできていません。

**お手元の環境（npmレジストリにアクセス可能な環境）で以下を実行し、最終確認をお願いします。**

```bash
npm install
npm run typecheck
npm run test
npm run build
```

## 現時点での制限

- 上記の理由により、`npm install` 以降のビルド・型チェック・テストの実行確認はお手元の環境で行う必要があります。
- 対応期日(FollowUp)は「完了/未完了」のトグルUIを未実装です（次回対応日の設定・履歴記録までは可能）。
- 候補者の削除機能は未実装です（登録ミスの取り消しが必要な場合はDBを直接操作するか、追加実装が必要です）。
- メッセージ生成のたびに Claude を複数回（生成1回＋3パターンぶんの文面チェック3回 = 最大4回）呼び出すため、API利用料・応答時間がやや大きくなります。
- 複数ユーザーでの同時利用や権限管理（ログイン機能）は想定していません。ローカル・単一ユーザー利用が前提です。
- LinkedInの正式APIとの連携は未実装です（`LinkedInAdapter` インターフェースとして分離済みなので、将来の差し替えは容易です）。

## 次に追加すべき機能（提案）

1. `npm install` 〜 `next build` の実行確認と、実行時に見つかったバグの修正。
2. 対応期日(FollowUp)の完了管理UI、候補者削除・アーカイブ機能。
3. Claude呼び出し回数を減らすオプション（文面チェックをスキップして生成のみ行うトグル等）。
4. `AppSetting` を使った、EN事業内容・ターゲットペルソナのUIからの編集機能（現在はコード内に固定）。
5. 複数担当者での利用を想定した認証・担当者別の絞り込み。
6. 正式なLinkedIn APIが利用可能になった場合の `LinkedInAdapter` 実装差し替え。
