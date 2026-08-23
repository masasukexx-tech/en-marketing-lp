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

## ディレクトリ構成

```
video-auto-edit/
├─ app/
│  ├─ page.tsx                          # アップロード＋自動カット実行（?projectIdで既存プロジェクトに追加）
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
│     ├─ videos/[id]/source/route.ts    # 元動画のRange対応ストリーミング配信（プレビュー再生用）
│     └─ export/route.ts                # FCPXML/SRT生成・ZIPダウンロード
├─ lib/
│  ├─ ffmpeg.ts                   # ffprobe/ffmpeg/silencedetectラッパー
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
| 18 | build / lint / typecheck | ⚠️ typecheckは実行済み。実行環境にffmpeg/faster-whisperが無いため統合動作は未検証 |
| 19 | 実際のEN案件動画でのテスト | ❌ 未実施（本番同等の実行環境が必要） |

## 追加機能（初期スキャフォールド後に実装）

- プロジェクト一覧・詳細画面（`/projects`, `/projects/[id]`）: カット強度(weak/standard/strong)の切り替え、ユーザー辞書（固有名詞リスト）の追加・削除、既存プロジェクトへの動画追加、動画ごとの再実行ボタン
- 確認画面に `<video>` プレビューと区間ハイライトバーを追加（緑=保持 / 黄=候補 / 赤=カット、クリックでシーク）。動画本体は `storage/` が静的配信対象外のため `/api/videos/[id]/source` がHTTP Range対応でストリーミング配信する
- ESLint設定 (`next/core-web-vitals`) を追加

## 既知の制約

- この開発環境には `ffmpeg`/`ffprobe` と Python の `faster-whisper`/`fugashi`/`rapidfuzz` がインストールされていないため、コードの型チェック・ビルドは通していますが、実際に動画を1本通す統合テストはできていません。手元PCでのセットアップ後、必ず実動画でお試しください。
- フィラー辞書・言い直しトリガー語・confidence閾値は設計書のルールをそのまま初期値化した簡易版です。誤判定が多い場合は `lib/edit-decision.ts` の `CUT_CONFIDENCE_THRESHOLD` や `scripts/analyze_text.py` の辞書を調整してください。
- 確認画面には動画プレビューやハイライト表示（ロードマップ#14の完全版）は含まれていません。次のステップとして追加が必要です。
