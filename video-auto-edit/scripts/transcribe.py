#!/usr/bin/env python3
"""
faster-whisper を使ったローカル文字起こしスクリプト。
Next.js の API Route から child_process 経由で呼び出す想定。

Usage:
    python3 transcribe.py <audio.wav> <output.json> \
        [--model large-v3] [--language ja] [--initial-prompt "固有名詞1, 固有名詞2"] \
        [--progress-path progress.json]

設計書 §1-1 参照。API費用ゼロ・ローカル完結。
"""
import argparse
import json
import math
import os
import sys
import time


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def write_progress(progress_path, stage, stage_percent, message=None):
    """進捗をJSONファイルに書き込む（Node側の lib/progress.ts と同じ形式）。
    確認画面からポーリングされている間に中途半端なJSONを読ませないよう、
    一時ファイルに書いてからrenameする（atomic write）。
    """
    if not progress_path:
        return
    data = {
        "stage": stage,
        "stagePercent": stage_percent,
        "message": message,
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    tmp_path = progress_path + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f)
    os.replace(tmp_path, progress_path)


def main() -> int:
    parser = argparse.ArgumentParser(description="faster-whisper transcription")
    parser.add_argument("audio_path", help="入力音声ファイル (wav推奨)")
    parser.add_argument("output_json_path", help="書き出し先のJSONパス")
    parser.add_argument("--model", default="large-v3", help="whisperモデルサイズ")
    parser.add_argument("--language", default="ja")
    parser.add_argument("--device", default="cpu", choices=["cpu", "cuda"])
    parser.add_argument("--compute-type", default="int8")
    parser.add_argument(
        "--initial-prompt",
        default="",
        help="固有名詞リスト（ユーザー辞書）。カンマ区切り文字列",
    )
    parser.add_argument(
        "--progress-path",
        default="",
        help="進捗状況を書き込むJSONファイルのパス（省略時は進捗を書き込まない）",
    )
    args = parser.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(
            json.dumps(
                {
                    "error": (
                        "faster-whisper is not installed. "
                        "Run: pip install -r scripts/requirements.txt"
                    )
                }
            ),
            file=sys.stderr,
        )
        return 1

    write_progress(
        args.progress_path,
        "loading_model",
        0,
        f"{args.model}モデルを読み込み中（初回はダウンロードで数分〜数十分かかることがあります）",
    )
    model = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)
    write_progress(args.progress_path, "loading_model", 100)

    segments_iter, info = model.transcribe(
        args.audio_path,
        language=args.language,
        word_timestamps=True,
        initial_prompt=args.initial_prompt or None,
    )

    total_duration = info.duration or 0
    write_progress(args.progress_path, "transcribing", 0)

    segments_out = []
    last_progress_write = 0.0
    for seg in segments_iter:
        # avg_logprob (負の対数尤度) を大まかな 0-1 confidence に変換
        seg_confidence = clamp01(math.exp(seg.avg_logprob)) if seg.avg_logprob is not None else 0.5

        words_out = []
        for w in seg.words or []:
            words_out.append(
                {
                    "word": w.word.strip(),
                    "startSec": w.start,
                    "endSec": w.end,
                    "confidence": clamp01(w.probability) if w.probability is not None else seg_confidence,
                }
            )

        segments_out.append(
            {
                "text": seg.text.strip(),
                "startSec": seg.start,
                "endSec": seg.end,
                "confidence": seg_confidence,
                "words": words_out,
            }
        )

        # 進捗ファイルへの書き込みは1秒に1回程度に間引く
        now = time.time()
        if total_duration > 0 and now - last_progress_write >= 1.0:
            stage_percent = clamp01(seg.end / total_duration) * 100
            write_progress(args.progress_path, "transcribing", stage_percent)
            last_progress_write = now

    write_progress(args.progress_path, "transcribing", 100)

    result = {
        "engine": f"faster-whisper-{args.model}",
        "language": info.language or args.language,
        "segments": segments_out,
    }

    with open(args.output_json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(json.dumps({"ok": True, "segments": len(segments_out)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
