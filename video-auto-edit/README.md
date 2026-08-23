# video-auto-edit

AI動画自動編集システムの初期スキャフォールド（完全無料構成版）。設計の全文は [`../docs/ai-video-auto-edit-design.md`](../docs/ai-video-auto-edit-design.md) を参照してください。

クラウド従量課金ゼロで、素材アップロード → 文字起こし（faster-whisper）→ 無音/フィラー/言い直しの自動カット判定 → 確認画面での復元 → Premiere Pro向けFCPXML/SRT書き出し、までをローカルPC上で完結させます。

## セットアップ

このコード自体はここで生成しましたが、**faster-whisper・fugashi・rapidfuzz・ffmpeg の実行環境が無いと動作確認できていません**。手元のPC（またはEN社内サーバー）で以下を実行してください。

```bash
# 1. Node依存関係
cd video-auto-edit
npm install

# 2. Python依存関係（別途 python3 が必要）
python3 -m venv .venv && source .venv/bin/activate
pip install -r scripts/requirements.txt

# 3. ffmpeg / ffprobe（未インストールの場合）
#   macOS: brew install ffmpeg
#   Ubuntu/Debian: sudo apt install ffmpeg

# 4. 環境変数
cp .env.example .env
# DATABASE_URL はデフォルトのままでOK。Gemini併用判定を使う場合のみ GEMINI_API_KEY を設定。

# 5. DBスキーマ反映（SQLiteファイルが storage/db.sqlite に作られる）
npx prisma migrate dev --name init

# 6. 起動
npm run dev
# http://localhost:3000
```

## テスト

外部依存（ffmpeg/faster-whisper等）を必要としない純粋なロジック（`lib/timeline.ts`, `lib/ffmpeg.ts`のパーサー, `lib/edit-decision.ts`のカット判定, `lib/premiere-export.ts`のFCPXML/SRT生成）はNode組み込みのテストランナーで実行できます。追加のnpmパッケージは不要です（Node 22.6+が必要）。

```bash
npm test
```

`scripts/test-hooks.mjs` / `scripts/test-register.mjs` は拡張子なし相対import（`"./ffmpeg"`）をテスト実行時にのみ解決するためのNode ESM resolve hookで、アプリ本体（Next.js経由の実行）には影響しません。

## ディレクトリ構成

```
video-auto-edit/
├─ app/
│  ├─ page.tsx                          # アップロード＋自動カット実行（?projectIdで既存プロジェクトに追加）
│  ├─ _components/                      # ProgressBar・進捗ポーリングhookなど共通UI部品
│  ├─ projects/page.tsx                 # プロジェクト一覧
│  ├─ projects/[id]/page.tsx            # プロジェクト詳細（カット強度設定・ユーザー辞書管理・動画一覧）
│  ├─ videos/[id]/page.tsx              # 確認画面（動画プレビュー・区間ハイライトバー・復元操作）
│  └─ api/
│     ├─ upload/route.ts                # 素材アップロード・メタデータ取得
│     ├─ process/route.ts               # 文字起こし〜EditDecision/TimelineClip/Caption生成
│     ├─ projects/route.ts              # プロジェクト一覧取得
│     ├─ projects/[id]/route.ts         # プロジェクト詳細取得・カット強度変更(PATCH)
│     ├─ projects/[id]/dictionary/route.ts  # ユーザー辞書の追加(POST)・削除(DELETE)
│     ├─ videos/[id]/route.ts           # 確認画面用データ取得・復元操作(PATCH)
│     ├─ videos/[id]/progress/route.ts  # 処理進捗のポーリング取得（%表示用）
│     ├─ videos/[id]/source/route.ts    # 元動画のRange対応ストリーミング配信（プレビュー再生用）
│     └─ export/route.ts                # FCPXML/SRT生成・ZIPダウンロード
├─ lib/
│  ├─ ffmpeg.ts                   # ffprobe/ffmpeg/silencedetectラッパー
│  ├─ progress.ts                 # 処理進捗(stage/%)の読み書き・全体%への変換
│  ├─ edit-decision.ts            # 無音/フィラー/言い直し判定の統合ロジック
│  ├─ rebuild.ts                  # EditDecision→TimelineClip/Captionの再計算（復元操作でも使用）
│  ├─ timeline.ts                 # TimelineClip組み立て・mapSourceToTimeline()
│  ├─ premiere-export.ts          # FCPXML/SRT生成
│  ├─ db.ts                       # Prismaクライアント
│  └─ storage.ts                  # storage/ 配下のパス管理
├─ scripts/
│  ├─ transcribe.py               # faster-whisper 呼び出し
│  ├─ analyze_text.py             # fugashi(フィラー判定)・rapidfuzz(言い直し判定)
│  └─ requirements.txt
├─ prisma/schema.prisma           # SQLiteスキーマ（設計書 §2）
└─ storage/                       # 動画・音声・DB等の実データ置き場（git管理外）
```

## 実装状況（設計書 §5 ロードマップ対応）

| # | 項目 | 状態 |
|---|---|---|
| 1 | Next.jsプロジェクト作成 | ✅ スキャフォールド済み |
| 2 | Prisma + SQLiteセットアップ | ✅ |
| 3 | アップロードUI・保存処理 | ✅ |
| 4 | ffprobeメタデータ取得 | ✅ |
| 5 | ffmpeg音声抽出 | ✅ |
| 6 | faster-whisperセットアップ・呼び出し | ✅ コード実装済み／要 `pip install` での動作確認 |
| 7 | ユーザー辞書を initial_prompt に反映 | ✅ |
| 8 | silencedetectによる無音解析 | ✅ |
| 9 | fugashiによるフィラー判定 | ✅ コード実装済み／要動作確認 |
| 10 | rapidfuzzによる言い直し検出 | ✅ コード実装済み／要動作確認 |
| 11 | EditDecision生成（keep/cut/candidate） | ✅ |
| 12 | TimelineClip生成 | ✅ |
| 13 | Caption生成・同期 | ✅ |
| 14 | 確認画面（プレビュー・復元機能） | ✅ 動画プレビュー＋区間ハイライトバー（クリックでシーク）・復元操作あり |
| 15 | SRT生成 | ✅ |
| 16 | FCPXML生成 | ✅ 基本構造のみ。実際のPremiere importでの検証は未実施 |
| 17 | ZIP Export | ✅ |
| 18 | build / lint / typecheck | ⚠️ typecheckはスタブ型で検証済み・純粋ロジックは`npm test`で自動テスト済み（16件pass）。`npm install`が組織ポリシーでブロックされ実パッケージでのbuild/lintは未実行 |
| 19 | 実際のEN案件動画でのテスト | ❌ 未実施（ffmpeg/faster-whisperが無い環境のため。本番同等の実行環境が必要） |

## 追加機能（初期スキャフォールド後に実装）

- プロジェクト一覧・詳細画面（`/projects`, `/projects/[id]`）: カット強度(weak/standard/strong)の切り替え、ユーザー辞書（固有名詞リスト）の追加・削除、既存プロジェクトへの動画追加、動画ごとの再実行ボタン
- 確認画面に `<video>` プレビューと区間ハイライトバーを追加（緑=保持 / 黄=候補 / 赤=カット、クリックでシーク）。動画本体は `storage/` が静的配信対象外のため `/api/videos/[id]/source` がHTTP Range対応でストリーミング配信する
- ESLint設定 (`next/core-web-vitals`) を追加
- **処理進捗の%表示**: 音声抽出→モデル読み込み→文字起こし→解析→保存の各ステージを`storage/progress/{videoAssetId}.json`に書き込み、`GET /api/videos/[id]/progress`でポーリングできるようにした。トップページ・プロジェクト詳細ページの両方で進捗バーとして表示される。文字起こし中はfaster-whisperがセグメントを出力するたびに`transcribe.py`が進捗を更新するので、実尺に対してどこまで進んだかが分かる。失敗時は`stage: "error"`として理由が表示される

## 既知の制約

- この開発環境には `ffmpeg`/`ffprobe`、Python の `faster-whisper`/`fugashi`/`rapidfuzz`、`npm install`（組織ポリシーで registry.npmjs.org / apt リポジトリへのアクセスがブロックされる）がいずれも無いため、実際に動画を1本通す統合テストはできていません。`lib/`配下の純粋ロジックはNode組み込みテストランナーで実行・pass確認済みですが（`npm test`）、ffmpeg/faster-whisper呼び出しを含むAPI Route全体の統合動作・Premiere Proでの実際のFCPXML importは未検証です。手元PCでのセットアップ後、必ず実動画でお試しください。
- フィラー辞書・言い直しトリガー語・confidence閾値は設計書のルールをそのまま初期値化した簡易版です。誤判定が多い場合は `lib/edit-decision.ts` の `CUT_CONFIDENCE_THRESHOLD` や `scripts/analyze_text.py` の辞書を調整してください。
