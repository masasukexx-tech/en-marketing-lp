# AI動画自動編集システム 技術設計書（完全無料構成版）

対象: 素材アップロード → 高精度文字起こし → 自動カット → Premiere Pro連携編集データ書き出し

**方針: クラウド従量課金ゼロ。すべてローカルPC上で完結させる構成。**

実装の初期スキャフォールドは `video-auto-edit/` 配下に置いています。セットアップ手順・実装状況は `video-auto-edit/README.md` を参照してください。

---

## 0. 全体方針：なぜ「ローカル実行ファースト」なのか

前回の設計（Deepgram + クラウドワーカー + Supabase）は精度・スケーラビリティ最優先でしたが、継続的に費用が発生する構成でした。今回は逆に、

> **「文字起こしエンジンも、動画処理ワーカーも、DBも、ストレージも、すべて自分のPC（またはEN社内サーバー）上で動かす」**

ことで、API従量課金とクラウドインフラ費用を構造的にゼロにします。トレードオフとして「処理速度（CPU推論なので遅い）」「同時に処理できる動画の本数」「社外からのアクセス性」を犠牲にしますが、まず動くものを完全無料で作るという目的には最適です。

| 項目 | 前回案（有料） | 今回案（完全無料） |
|---|---|---|
| 文字起こし | Deepgram API（従量課金） | **faster-whisper（OSS・ローカル実行）** |
| 動画処理ワーカー | Railway/Fly.io（月額課金） | **自分のPC上のNode/Pythonプロセス** |
| DB | Supabase（無料枠超過で課金） | **SQLite（ローカルファイル、無制限・無料）** |
| ストレージ | Supabase Storage / R2 | **ローカルディスク（自分のPCのファイルシステム）** |
| Web UI ホスティング | Vercel | **`npm run dev` でローカル起動（localhost）** |
| フィラー/言い直しの文脈判定 | Gemini API呼び出し | **ルールベース判定を基本＋任意でGemini無料枠を併用** |

---

## 1. 技術スタック（完全無料構成）

### 1-1. 文字起こしエンジン: faster-whisper（自己ホスト・完全無料）

- OSS（CTranslate2ベースのWhisper高速実装）。API費用ゼロ、回数制限なし。
- `word_timestamps=True` により、単語レベルのタイムスタンプを追加のAPI無しで取得可能（同期精度要件に対応）。
- モデルサイズは `large-v3` を推奨（日本語精度重視）。GPUがなくてもCPUで動作するが、処理時間は動画の実尺の1〜3倍程度かかる想定（GPUがあれば大幅短縮）。
- ユーザー辞書は `initial_prompt` パラメータに固有名詞リストを渡すことで部分的に精度向上（Deepgramのkeyword_boostほど強力ではないが無料で実装可能）。

```python
from faster_whisper import WhisperModel
model = WhisperModel("large-v3", device="cpu", compute_type="int8")  # CPUでもメモリ節約
segments, info = model.transcribe(
    "audio.wav",
    language="ja",
    word_timestamps=True,
    initial_prompt="株式会社EN, TikTok, Instagram, YouTube, Meta, ピンク社長, 白内障ラボ"
)
```

> 補足: WhisperXのforced-alignment（wav2vec2ベース）は日本語向けの高品質なアライメントモデルが少ないため、日本語ではfaster-whisperの`word_timestamps`をそのまま使う方が安定します。

### 1-2. フィラー・無音・言い直し判定: ルールベース中心（LLM呼び出しは任意・無料枠内）

- **無音判定**: `ffmpeg`の`silencedetect`フィルタ or `librosa`のRMSエネルギー解析で無音区間を検出。完全無料・ローカル完結。
- **フィラー判定**: 「えー/えっと/あの/その/まあ/うーん」等の辞書と品詞情報（`fugashi`+`unidic-lite`などの無料日本語形態素解析ライブラリ）を組み合わせ、「あの会社」のように直後に名詞が続く場合は指示詞として保持、単独で末尾に近い場合はフィラーとして削除候補、というルールで一次判定。
- **言い直し判定**: 短時間窓内でのテキスト類似度（`difflib`や`rapidfuzz`、いずれも無料ライブラリ）＋「じゃなくて/ではなく/あ、」等の接続語トリガーで検出。
- **任意の高度化**: Gemini APIには無料枠（分間リクエスト数に上限はあるが個人利用のバッチ処理には十分な範囲）があるため、「ルールベースで confidence が中途半端な区間だけ」Geminiに文脈判定を投げる、というハイブリッドにすると精度と無料枠のバランスが取れます（1日の処理本数が少ない前提なら無料枠内に収まりやすい）。ただし本設計の既定値は「Gemini呼び出しなしでも完結する」ことを前提にします。

### 1-3. 動画処理: FFmpeg（無料・OSS、追加コストなし）

- 音声抽出、メタデータ取得（`ffprobe`）、非破壊カット（`-c copy`でストリームコピーし再エンコードを避け画質劣化を防止）。
- カット後プレビュー用の書き出しのみ必要最小限で再エンコード。

### 1-4. データ保存: SQLite + ローカルファイルシステム

- DBはSupabase等のクラウドではなく、**SQLite（1ファイルのDB、Prismaで操作）** をプロジェクトフォルダ内に保存。容量制限なし、課金なし。
- 動画ファイル・音声ファイル・書き出し成果物もすべてローカルディスクの `storage/` フォルダで管理。

```
storage/
└─ projects/
   └─ {project_id}/
      ├─ original/元動画.mp4
      ├─ audio/extracted.wav
      ├─ edited/カット済み動画.mp4
      ├─ captions/captions.srt
      ├─ transcript/transcript.json
      ├─ timeline/timeline.json
      └─ premiere/project.fcpxml
```

### 1-5. Web UI: Next.js をローカルで起動（Vercelデプロイ不要）

- `npm run dev` でlocalhost上にUIを立てる。将来的に社内サーバーで常時稼働させたくなった場合のみ、Vercel Hobby（無料枠）やEN社内のサーバーへのデプロイを検討すれば良く、今の段階では不要。
- Next.js の API Routes 内から直接 `child_process` で FFmpeg / faster-whisper（Pythonスクリプト）を呼び出すシンプル構成にすることで、別途ワーカー基盤（Railway等）を用意する必要をなくす。

```
video-auto-edit/
├─ app/                     # Next.js UI + API Routes
│  ├─ api/
│  │  ├─ upload/route.ts
│  │  ├─ process/route.ts   # ffmpeg/whisper呼び出しをキック
│  │  └─ export/route.ts    # FCPXML/ZIP生成
│  └─ (pages)/
├─ scripts/
│  └─ transcribe.py         # faster-whisper実行スクリプト（Node側からchild_processで呼ぶ）
├─ lib/
│  ├─ ffmpeg.ts
│  ├─ edit-decision.ts      # フィラー/無音/言い直し判定ロジック
│  ├─ timeline.ts           # EDL（TimelineClip）計算
│  └─ premiere-export.ts    # FCPXML/SRT生成
├─ prisma/
│  └─ schema.prisma         # SQLite
└─ storage/                 # 上記の実データ置き場
```

---

## 2. データモデル（SQLite / Prisma）

前回設計とほぼ同一のスキーマですが、Supabase固有機能（RLS等）を使わないシンプルなPrismaスキーマにします。

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  cutStrength String   @default("standard") // weak / standard / strong
  settings    String   // JSON文字列（自動カットON/OFF等のフラグ）
  createdAt   DateTime @default(now())
  videoAssets VideoAsset[]
  dictionary  DictionaryTerm[]
}
model VideoAsset {
  id           String   @id @default(cuid())
  projectId    String
  storagePath  String
  filename     String
  durationSec  Float
  width        Int
  height       Int
  fps          Float
  fileSizeBytes BigInt
  uploadedAt   DateTime @default(now())
  transcript   Transcript?
  editDecisions EditDecision[]
  timelineClips TimelineClip[]
  captions     Caption[]
}
model Transcript {
  id           String   @id @default(cuid())
  videoAssetId String   @unique
  engine       String   @default("faster-whisper-large-v3")
  language     String   @default("ja")
  segments     TranscriptSegment[]
}
model TranscriptSegment {
  id           String   @id @default(cuid())
  transcriptId String
  speaker      String?
  text         String
  startSec     Float
  endSec       Float
  confidence   Float
  words        WordTimestamp[]
}
model WordTimestamp {
  id         String  @id @default(cuid())
  segmentId  String
  word       String
  startSec   Float
  endSec     Float
  confidence Float
}
model EditDecision {
  id           String   @id @default(cuid())
  videoAssetId String
  sourceStart  Float
  sourceEnd    Float
  decision     String   // keep / cut / candidate
  reason       String   // filler / silence / retake / manual
  reasonDetail String?
  confidence   Float
  restored     Boolean  @default(false)
}
model TimelineClip {
  id            String @id @default(cuid())
  videoAssetId  String
  sourceStart   Float
  sourceEnd     Float
  timelineStart Float
  timelineEnd   Float
  orderIndex    Int
}
model Caption {
  id            String @id @default(cuid())
  videoAssetId  String
  timelineStart Float
  timelineEnd   Float
  text          String
}
model DictionaryTerm {
  id        String @id @default(cuid())
  projectId String
  term      String
  reading   String?
  category  String?
}
```

「カット後タイムコード再計算」の考え方は前回設計と同じで、`TimelineClip`を唯一の真実源とし、`WordTimestamp`・`Caption`のソース側タイムコードから表示用タイムコードへ変換する共通関数 `mapSourceToTimeline()` を用意します。

---

## 3. カット判定ロジック（無料構成での実装方針）

### 3-1. 無音・間の判定

```bash
ffmpeg -i audio.wav -af silencedetect=noise=-30dB:d=0.3 -f null -
```

このコマンドで無音区間の開始・終了を無料で検出できます。検出結果を長さに応じて3階層に分類（前回設計と同じ思想）:

- 0.3秒未満: keep
- 0.3〜1.5秒: 前後の発話内容のテキスト長・句読点位置などのルールでcandidate判定（文末なら「間」として保持寄り、文中の唐突な無音ならcut候補寄り）
- 1.5秒以上: cut候補（ただし直前が「えっと」「そうですね」等の思考を示す語なら候補止まりにするなど、辞書ベースで調整）

### 3-2. フィラー判定

形態素解析（`fugashi` + `unidic-lite`、いずれも無料）で品詞を取得し、感動詞・フィラー相当語のうち、直後に実質的な文が続かない（＝間投詞的用法）場合のみ削除候補にする、というルールベース判定を基本とします。

### 3-3. 言い直し判定

`rapidfuzz`によるテキスト類似度計算で、10秒以内に類似度80%以上の発話ペアがあれば言い直し候補として検出。「じゃなくて」「ではなく」等の接続語が近傍にあればconfidenceを引き上げます。

### 3-4. 誤削除防止（32節要件）

すべての判定で confidence が閾値未満のものは `cut` ではなく `candidate` にとどめ、UIで理由付きで表示し、ユーザーの目視確認・復元操作を経由させる方針は前回設計から変更ありません。

---

## 4. Premiere Pro連携（前回設計を踏襲・変更なし）

- **FCPXML** をメイン出力形式として採用（Premiere公式import対応、映像/音声/キャプショントラックを1ファイルで表現可能）。
- 生成処理自体はただのXML組み立てなので無料。
- 最低限のSRTも同時生成。

出力構成:

```
storage/projects/{id}/premiere/project.fcpxml
storage/projects/{id}/captions/captions.srt
```

ZIP化してダウンロードできるようにする点も前回同様です。

---

## 5. 実装順序（完全無料構成版ロードマップ）

1. Next.jsプロジェクト作成（ローカル起動のみ、Vercel設定は後回し）
2. Prisma + SQLiteセットアップ（第2章のスキーマ）
3. ローカルストレージへのアップロードUI・保存処理
4. `ffprobe`によるメタデータ取得
5. `ffmpeg`による音声抽出（非破壊・ストリームコピー優先）
6. `faster-whisper`セットアップ（Pythonスクリプト、`pip install faster-whisper`）とNode側からの呼び出し
7. ユーザー辞書を`initial_prompt`に反映
8. `silencedetect`による無音解析
9. `fugashi`によるフィラー判定
10. `rapidfuzz`による言い直し検出
11. EditDecision生成（confidence閾値によるkeep/cut/candidate振り分け）
12. TimelineClip生成（カット後タイムライン計算）
13. Caption生成・分割（word-levelタイムスタンプで同期）
14. 確認画面（プレビュー・ハイライト・復元機能）
15. SRT生成
16. FCPXML生成
17. ZIP Export
18. build / lint / typecheck
19. 実際のEN案件動画でのテスト

---

## 6. 必要な環境変数（完全無料構成では最小限）

```
# 外部APIキーは基本的に不要（すべてローカル処理）
DATABASE_URL="file:./storage/db.sqlite"
# 任意（Geminiをハイブリッド判定に使う場合のみ、無料枠内での利用）
GEMINI_API_KEY=
```

---

## 7. この構成のトレードオフ（正直な制約）

- **処理速度**: `large-v3`モデルをCPUで動かすと、動画の実尺に対して1〜3倍程度の処理時間がかかることがあります（30分の動画なら30分〜1.5時間程度）。GPU搭載PCがあれば大幅に高速化できます。速度を優先するなら`medium`モデルに落とす選択肢もありますが、精度とのトレードオフになります。
- **同時処理数**: ローカルPC1台で処理する前提のため、複数動画を並列処理すると重くなります。基本的には1本ずつの逐次処理を想定してください。
- **社外アクセス**: `localhost`起動が前提なので、外部から（例: 出先や別スタッフのPCから）アクセスするには別途VPN等が必要です。チームで共有したい場合は、将来的にEN社内のサーバー1台に常駐させる、または無料枠の範囲でVercel/Supabaseに移行する、という拡張パスを取れます（前回設計がそのまま移行先になります）。
- **フィラー/言い直し判定の精度**: ルールベースはLLM併用時より精度が落ちる可能性があります。実際にテスト動画で試してみて、誤判定が多いようであれば「confidenceが中途半端な区間だけGemini無料枠に投げる」ハイブリッド運用に切り替えるのが現実的な改善パスです。

---

## 8. まとめ

この構成であれば、**API利用料・クラウドインフラ費用ともに発生させずに**、素材アップロードからPremiere Pro向けFCPXML書き出しまでの一連のパイプラインを個人のPC上でまず動かすところまで到達できます。実際に運用してみて「処理速度が遅すぎる」「精度が足りない」といった課題が出てきた段階で、前回作成した有料構成版（Deepgram＋クラウドワーカー）の該当箇所だけを部分的に採用する、という段階的な移行が可能な設計にしています。
