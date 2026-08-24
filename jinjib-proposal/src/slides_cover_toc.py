import design as d
from scene import SceneSlide


def slide_01_cover():
    s = SceneSlide("cover")
    d.base(s)
    split_x = 5.55
    s.rect(0, 0, split_x, d.PAGE_H, fill=d.ORANGE, name="Cover Panel")
    s.line(split_x + 0.02, 0, split_x - 0.55, d.PAGE_H, color=d.ORANGE, width=2.4, name="Seam Accent")

    s.text(0.62, 0.55, 4.4, 0.4, [
        {"runs": [{"text": "STRATEGY PROPOSAL 2026", "size": 12, "bold": True, "color": d.WHITE, "font": d.EN, "spacing": 60}]},
    ], anchor="m")
    s.rect(0.64, 0.98, 0.5, 0.05, fill=d.WHITE, name="Rule")

    d.h1(s, 0.62, 2.15, 4.55, 2.6, ["18歳の選択肢を、", "もっと広く。"], color=d.WHITE, size=42, line_spacing=118)

    s.text(0.64, 4.95, 4.5, 1.0, [
        {"align": "l", "line_spacing": 150, "runs": [
            {"text": "株式会社ジンジブ", "size": 14.5, "bold": True, "color": d.WHITE, "font": d.JP}]},
        {"align": "l", "line_spacing": 150, "runs": [
            {"text": "高卒採用・進路選択マーケティング戦略提案", "size": 12.5, "bold": False, "color": d.WHITE, "font": d.JP}]},
    ], anchor="t")

    # right side: hero photo placeholder, Z-gen web-first feel
    px_, py_, pw_, ph_ = split_x + 0.55, 0.85, d.PAGE_W - split_x - 0.55 - 0.62, 5.6
    d.photo_placeholder(s, px_, py_, pw_, ph_, 1, "通学路・友達と並んで歩く高校生", d.INK)
    d.chip(s, px_ + 0.2, py_ + 0.2, 2.1, 0.4, "18 YEARS OLD", d.INK, size=10.5, spacing=30)

    s.line(0.62, d.FOOTER_Y, d.PAGE_W - 0.62, d.FOOTER_Y, color=d.INK, width=1.0)
    s.text(0.62, d.FOOTER_Y + 0.04, 8, 0.3, [
        {"runs": [{"text": d.BRAND_LABEL, "size": 8.5, "color": d.INK, "font": d.JP, "spacing": 10}]},
    ], anchor="m")
    s.text(d.PAGE_W - 0.62 - 1.4, d.FOOTER_Y + 0.02, 1.4, 0.32, [
        {"runs": [
            {"text": "01", "size": 13, "bold": True, "color": d.ORANGE, "font": d.EN, "spacing": 20},
            {"text": " / 22", "size": 10, "color": d.INK, "font": d.EN},
        ], "align": "r"},
    ], anchor="m")
    return s


TOC_ITEMS = [
    ("01", "TikTok", "認知・感情", d.ORANGE),
    ("02", "Instagram", "共感・自分事化", d.PINK),
    ("03", "YouTube", "理解・深掘り", d.BLUE),
    ("04", "Web / Real", "探索・体験", d.CYAN),
    ("05", "Roadmap", "全体設計", d.YELLOW),
    ("06", "KPI", "計測指標", d.LIME),
    ("07", "Future", "未来像", d.PURPLE),
]


def slide_02_toc():
    s = SceneSlide("toc")
    d.base(s)
    d.header(s, "INDEX", "目次 ／ 提案の全体像", d.ORANGE)
    d.h1(s, d.MARGIN_X, 0.92, 8, 1.0, ["認知から、選択へ。"], size=30)
    d.body(s, d.MARGIN_X, 1.62, 9.5, 0.5,
           "TikTok → Instagram → YouTube → Web / Real の導線で、18歳の心理状態を段階的に動かす設計。",
           size=12)

    x0, y0 = d.MARGIN_X, 2.55
    w = d.CONTENT_W
    n = len(TOC_ITEMS)
    gap = 0.1
    cw = (w - gap * (n - 1)) / n
    ch = 0.95
    for i, (num, en, jp, color) in enumerate(TOC_ITEMS):
        cx = x0 + i * (cw + gap)
        is_last = (i == n - 1)
        s.preset("chevron" if not is_last else "rect", cx, y0, cw, ch, fill=color,
                 adj={"adj1": "50000", "adj2": "35000"} if not is_last else None, name=f"Nav{i}")
        text_x = cx + 0.34
        text_w = cw - 0.34 - 0.1
        s.text(text_x, y0 + 0.1, text_w, 0.32, [
            {"runs": [{"text": num, "size": 17, "bold": True, "color": d.WHITE, "font": d.EN}]},
        ], anchor="t")
        s.text(text_x, y0 + 0.42, text_w, 0.5, [
            {"runs": [{"text": en, "size": 12.5, "bold": True, "color": d.WHITE, "font": d.EN, "spacing": 10}]},
        ], anchor="t")
        s.text(cx, y0 + ch + 0.12, cw, 0.6, [
            {"align": "c", "runs": [{"text": jp, "size": 10.5, "bold": False, "color": d.INK, "font": d.JP}]},
        ], anchor="t")

    s.line(x0, 4.35, x0 + w, 4.35, color=d.HAIRLINE, width=1.0)
    d.body(s, x0, 4.55, w, 0.6,
           "PHASE1〜3（TikTok / Instagram / YouTube）で認知と理解を積み上げ、PHASE4（Web / Real）で行動へつなぐ。全体設計は Roadmap（P.19）、指標は KPI（P.21）に整理。",
           size=11.5, line_spacing=155)

    d.footer(s, 2, d.ORANGE)
    return s
