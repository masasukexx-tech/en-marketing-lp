#!/usr/bin/env python3
"""
文字起こし結果からフィラー候補・言い直し候補を検出するスクリプト。
fugashi(形態素解析) + rapidfuzz(類似度) を使用（設計書 §3-2, §3-3）。
Next.js の lib/edit-decision.ts から child_process 経由で呼び出す想定。

Usage:
    python3 analyze_text.py <transcript.json> <output.json>

入力 transcript.json は transcribe.py の出力形式（segments[].words[]）。
出力は EditDecision 候補（filler / retake のみ。silence は Node側の ffmpeg 解析結果と別途マージする）。
"""
import argparse
import json
import sys

FILLER_WORDS = {
    # 短い間投詞(単独の「あ」「え」等)
    "あ", "あー", "あぁ", "え", "えー", "えぇ", "ん", "んー", "んーと",
    "お", "おー",
    # 「えっと」系
    "えっと", "えーと", "えっとー", "えーっと",
    # 指示詞的フィラー
    "あの", "あのー", "あのう", "その", "そのー", "そのう",
    # 相槌・つなぎ
    "まあ", "まぁ", "まー", "うーん", "うーんと", "うん", "なんか", "なんていうか",
    "そうですね", "そうっすね", "はい",
}

# 直後に実質的な文が続けば指示詞・相槌として保持するため、フィラー削除候補から除外する
FILLER_INTERJECTION_POS = {"感動詞", "フィラー"}

RETAKE_TRIGGER_WORDS = ["じゃなくて", "ではなく", "あ、", "いや、", "すみません"]

RETAKE_WINDOW_SEC = 10.0
RETAKE_SIMILARITY_THRESHOLD = 80.0


def detect_fillers(segments):
    try:
        import fugashi
    except ImportError:
        print(
            json.dumps({"error": "fugashi is not installed. Run: pip install -r scripts/requirements.txt"}),
            file=sys.stderr,
        )
        return []

    tagger = fugashi.Tagger()
    candidates = []

    for seg in segments:
        words = seg.get("words", [])
        for idx, w in enumerate(words):
            surface = w["word"]
            if surface not in FILLER_WORDS:
                continue

            tokens = list(tagger(surface))
            pos = tokens[0].feature.pos1 if tokens and tokens[0].feature.pos1 else None
            is_interjection_pos = pos in FILLER_INTERJECTION_POS

            # 直後に実質的な語(名詞・動詞等)が続く場合は指示詞/接続として保持
            next_word = words[idx + 1] if idx + 1 < len(words) else None
            is_near_end = next_word is None or (idx + 1) >= max(1, len(words) - 1)

            if is_interjection_pos or (surface in FILLER_WORDS and is_near_end):
                confidence = 0.85 if is_interjection_pos else 0.6
                candidates.append(
                    {
                        "sourceStart": w["startSec"],
                        "sourceEnd": w["endSec"],
                        "reason": "filler",
                        "reasonDetail": f"filler word: {surface}",
                        "confidence": confidence,
                    }
                )

    return candidates


def detect_retakes(segments):
    try:
        from rapidfuzz import fuzz
    except ImportError:
        print(
            json.dumps({"error": "rapidfuzz is not installed. Run: pip install -r scripts/requirements.txt"}),
            file=sys.stderr,
        )
        return []

    candidates = []

    for i, seg_a in enumerate(segments):
        for seg_b in segments[i + 1 :]:
            gap = seg_b["startSec"] - seg_a["endSec"]
            if gap > RETAKE_WINDOW_SEC:
                break
            if gap < 0:
                continue

            similarity = fuzz.ratio(seg_a["text"], seg_b["text"])
            if similarity < RETAKE_SIMILARITY_THRESHOLD:
                continue

            confidence = 0.6
            for trigger in RETAKE_TRIGGER_WORDS:
                if trigger in seg_b["text"][:10] or trigger in seg_a["text"][-10:]:
                    confidence = 0.9
                    break

            # 前の発話(言い直し前)をカット候補にする
            candidates.append(
                {
                    "sourceStart": seg_a["startSec"],
                    "sourceEnd": seg_a["endSec"],
                    "reason": "retake",
                    "reasonDetail": f"similarity={similarity:.0f}% with later segment",
                    "confidence": confidence,
                }
            )

    return candidates


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("transcript_json_path")
    parser.add_argument("output_json_path")
    args = parser.parse_args()

    with open(args.transcript_json_path, "r", encoding="utf-8") as f:
        transcript = json.load(f)

    segments = transcript.get("segments", [])

    result = {
        "filler": detect_fillers(segments),
        "retake": detect_retakes(segments),
    }

    with open(args.output_json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(json.dumps({"ok": True, "filler": len(result["filler"]), "retake": len(result["retake"])}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
