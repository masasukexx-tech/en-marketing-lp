# video-auto-edit

AI動画自動編集システムの初期スキャフォールド（完全無料構成版）。設計の全文は [`../docs/ai-video-auto-edit-design.md`](../docs/ai-video-auto-edit-design.md) を参照してください。

クラウド従量課金ゼロで、素材アップロード → 文字起こし（faster-whisper）→ 無音/フィラー/言い直しの自動カット判定 → 確認画面での復元 → Premiere Pro向けXML/SRT書き出し、までをローカルPC上で完結させます。

> **設計書からの変更点**: 設計書ではPremiere向け書き出し形式として「FCPXML」を想定していましたが、実機のPremiere Pro (26.0.1) で検証した結果、**Premiere ProはモダンなFCPXML(Final Cut Pro X形式)をそもそも読み込めない**（Adobe公式ヘルプでも既知の制限として案内されている、長年未解決の問題）ことが判明しました。そのため、Premiereが実際に読み込める**Final Cut Pro 7形式のXML（拡張子`.xml`、通称XMEML）**を書き出す方式に変更しています。詳しくは「既知の制約」を参照してください。

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

外部依存（ffmpeg/faster-whisper等）を必要としない純粋なロジック（`lib/timeline.ts`, `lib/ffmpeg.ts`のパーサー, `lib/edit-decision.ts`のカット判定, `lib/premiere-export.ts`のPremiere向けXML/SRT生成）はNode組み込みのテストランナーで実行できます。追加のnpmパッケージは不要です（Node 22.6+が必要）。

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
│     └─ export/route.ts                # Premiere向けXML(XMEML)/SRT生成・ZIPダウンロード
├─ lib/
│  ├─ ffmpeg.ts                   # ffprobe/ffmpeg/silencedetectラッパー
│  ├─ progress.ts                 # 処理進捗(stage/%)の読み書き・全体%への変換
│  ├─ edit-decision.ts            # 無音/フィラー/言い直し判定の統合ロジック
│  ├─ rebuild.ts                  # EditDecision→TimelineClip/Captionの再計算（復元操作でも使用）
│  ├─ timeline.ts                 # TimelineClip組み立て・mapSourceToTimeline()
│  ├─ premiere-export.ts          # Final Cut Pro 7形式XML(XMEML)/SRT生成（Premiere Proが実際に読み込める形式）
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
| 16 | Premiere向けXML生成 | ✅ 実際のPremiere Pro 26.0.1で読み込み確認中（`ファイル > 読み込み`から。設計書のFCPXMLはPremiereが読めないため、Final Cut Pro 7形式XMLへ変更）。キャプションはXMLに含めず、SRT単独インポートに一本化（下記参照） |
| 17 | ZIP Export | ✅ |
| 18 | build / lint / typecheck | ⚠️ typecheckはスタブ型で検証済み・純粋ロジックは`npm test`で自動テスト済み（16件pass）。`npm install`が組織ポリシーでブロックされ実パッケージでのbuild/lintは未実行 |
| 19 | 実際のEN案件動画でのテスト | ❌ 未実施（ffmpeg/faster-whisperが無い環境のため。本番同等の実行環境が必要） |

## 追加機能（初期スキャフォールド後に実装）

- プロジェクト一覧・詳細画面（`/projects`, `/projects/[id]`）: カット強度(weak/standard/strong)の切り替え、ユーザー辞書（固有名詞リスト）の追加・削除、既存プロジェクトへの動画追加、動画ごとの再実行ボタン
- 確認画面に `<video>` プレビューと区間ハイライトバーを追加（緑=保持 / 黄=候補 / 赤=カット、クリックでシーク）。動画本体は `storage/` が静的配信対象外のため `/api/videos/[id]/source` がHTTP Range対応でストリーミング配信する
- ESLint設定 (`next/core-web-vitals`) を追加
- **処理進捗の%表示**: 音声抽出→モデル読み込み→文字起こし→解析→保存の各ステージを`storage/progress/{videoAssetId}.json`に書き込み、`GET /api/videos/[id]/progress`でポーリングできるようにした。トップページ・プロジェクト詳細ページの両方で進捗バーとして表示される。文字起こし中はfaster-whisperがセグメントを出力するたびに`transcribe.py`が進捗を更新するので、実尺に対してどこまで進んだかが分かる。失敗時は`stage: "error"`として理由が表示される
- **キャプションを単語単位で組み立て直す**（`lib/captions.ts`）: 当初は文字起こしセグメント(文単位)の開始/終了だけをタイムラインへマッピングしていたが、セグメントの一部の単語だけがフィラー/無音カットで削除されると、キャプションの表示時間が実際に画面に映っている尺とズレる不具合があった。word-levelタイムスタンプを使い、生き残った単語だけを追跡してキャプションを組み立てることで、カット（TimelineClipの切り替わり）をまたぐ箇所は必ずキャプションを分割し、表示時間を常に実際の映像と一致させるようにした
- **手動カット機能**（確認画面）: ルールベースの自動判定では「そもそも不要な冒頭部分」のような主観的な範囲を判断できないため、任意の開始/終了秒を指定して直接カットできるフォームを追加（`lib/manual-cut.ts`, `POST /api/videos/[id]`）。既存のEditDecision行と重なる部分は自動的に分割される

## 既知の制約

- この開発環境には `ffmpeg`/`ffprobe`、Python の `faster-whisper`/`fugashi`/`rapidfuzz`、`npm install`（組織ポリシーで registry.npmjs.org / apt リポジトリへのアクセスがブロックされる）がいずれも無いため、コード自体は実際のユーザーによる動作確認（フルセットアップ済みの手元Mac、Premiere Pro 26.0.1）を経て修正を重ねています。`lib/`配下の純粋ロジックはNode組み込みテストランナーで実行・pass確認済みです（`npm test`）。
- **Premiere ProはモダンなFCPXML(Final Cut Pro X形式)をそもそも読み込めません。** 当初はFCPXML(拡張子`.fcpxml`)を生成していましたが、実機検証で「ファイル > 読み込み」ダイアログ上で`.fcpxml`ファイルがそもそも選択できない（グレーアウトする）ことが判明しました。調べたところ、これは既知のPremiere Pro側の仕様上の制限で、Adobe公式ヘルプでも「PremiereがネイティブでimportできるのはFinal Cut Pro 7形式のXMLのみ」と案内されています（[Adobeヘルプ: Final Cut Proからの移行](https://helpx.adobe.com/premiere/desktop/organize-media/import-files/migrate-from-final-cut-pro-x.html)）。そのため `lib/premiere-export.ts` は最初からFinal Cut Pro 7形式のXML（通称XMEML、拡張子`.xml`）を生成するように変更しました。
- **キャプションはXMLに含めません**。当初は`<title>`要素で字幕を焼き込む実装でしたが、Final Cut Pro/Motion付属テンプレート(.moti)への有効な参照が無いとインポートが拒否される問題もあり、そもそも書き出し形式自体を変更したことも踏まえて撤去しました。字幕は`captions.srt`を**単独で**`ファイル > 読み込み`することで、Premiereのネイティブ字幕トラックとして追加してください（`project.xml`をインポートするのとは別操作です）。
- **`project.xml`は必ずメニューバーの`ファイル > 読み込み`から開いてください**。プロジェクトパネルの「メディアを読み込む」ボタンは動画/音声などのメディアファイル専用で、プロジェクト形式のXMLは選択できてもグレーアウトしたままになります。
- フィラー辞書・言い直しトリガー語・confidence閾値は設計書のルールをそのまま初期値化した簡易版です。誤判定が多い場合は `lib/edit-decision.ts` の `CUT_CONFIDENCE_THRESHOLD` や `scripts/analyze_text.py` の辞書を調整してください。実運用フィードバックを受けて`FILLER_WORDS`は「あ」「え」等の短い間投詞も含めて拡充済みですが、カットが甘いと感じる場合はプロジェクト詳細画面でカット強度を`strong`にすると、confidenceが中途半端で今は"candidate"止まりの区間も自動カット対象になります。
