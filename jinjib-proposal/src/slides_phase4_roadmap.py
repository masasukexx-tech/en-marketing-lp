import design as d
from scene import SceneSlide
from blocks import subhead, quote_list


def slide_18_phase4():
    s = SceneSlide("phase4")
    d.base(s)
    d.header(s, "PHASE 4", "Web / Real ／ Goal", d.ORANGE)
    d.h1(s, d.MARGIN_X, 0.85, 9, 0.55, ["知る・見るから、選ぶへ。"], size=22)

    cols = [
        dict(tag="WEB", flow="見る → 探す", accent=d.CYAN, items=[
            "18歳の仕事図鑑", "先輩社員から会社を探す", "仕事・進路診断", "動画から企業へ"]),
        dict(tag="REAL", flow="知る → 会う", accent=d.ORANGE, items=[
            "放課後会社見学", "18歳の社会見学", "高校生×若手社員交流会", "1日仕事体験"]),
        dict(tag="GOAL", flow="選択肢 → 選ぶ", accent=d.INK, items=None,
             goal="知らなかった選択肢を、\n自分で選べる選択肢へ。"),
    ]
    y0, h0 = 1.65, 4.9
    cw = (d.CONTENT_W - 0.5 * 2) / 3
    for i, col in enumerate(cols):
        cx = d.MARGIN_X + i * (cw + 0.5)
        s.rect(cx, y0, cw, h0, fill=d.WHITE, line=col["accent"], line_w=d.BORDER_W, name=f"P4Col{i}")
        s.rect(cx, y0, cw, 0.55, fill=col["accent"], name=f"P4Head{i}")
        s.text(cx, y0, cw, 0.55, [
            {"align": "c", "runs": [{"text": col["tag"], "size": 17, "bold": True, "color": d.WHITE, "font": d.EN, "spacing": 40}]},
        ], anchor="m")
        s.text(cx, y0 + 0.65, cw, 0.4, [
            {"align": "c", "runs": [{"text": col["flow"], "size": 13, "bold": True, "color": col["accent"], "font": d.JP}]},
        ], anchor="m")
        if col["items"]:
            iy = y0 + 1.3
            for it in col["items"]:
                s.rect(cx + 0.28, iy + 0.09, 0.09, 0.09, fill=col["accent"], name="Bullet")
                d.body(s, cx + 0.48, iy, cw - 0.7, 0.45, it, size=11.5)
                iy += 0.62
        else:
            s.text(cx + 0.25, y0 + 1.6, cw - 0.5, 2.6, [
                {"align": "c", "line_spacing": 132, "runs": [{"text": col["goal"], "size": 16, "bold": True, "color": d.INK, "font": d.JP}]},
            ], anchor="m")
        if i < 2:
            s.line(cx + cw + 0.06, y0 + h0 / 2, cx + cw + 0.44, y0 + h0 / 2, color=d.ORANGE, width=1.75, arrow_end=True)

    d.footer(s, 18, d.ORANGE, section="Phase 4 ／ Goal")
    return s


ROADMAP = [
    ("TikTok", d.ORANGE, "認知・感情", "なんとなく見る"),
    ("Instagram", d.PINK, "共感・自分事化", "自分も迷っている"),
    ("YouTube", d.BLUE, "理解・深掘り", "こんな仕事があるんだ"),
    ("Web", d.CYAN, "探索・比較", "自分に合うかも"),
    ("Real", d.LIME, "体験・接点", "見てみたい"),
    ("Goal", d.PURPLE, "採用・進路選択", "ここを選びたい"),
]


def slide_19_roadmap():
    s = SceneSlide("roadmap")
    d.base(s)
    d.header(s, "MARKETING ROADMAP", "認知から選択までの全体設計", d.ORANGE)
    d.h1(s, d.MARGIN_X, 0.85, 9, 0.55, ["6つの段階で、心理状態を動かす。"], size=20)

    n = len(ROADMAP)
    gap = 0.16
    cw = (d.CONTENT_W - gap * (n - 1)) / n
    y0 = 1.85
    for i, (name, accent, purpose, _) in enumerate(ROADMAP):
        cx = d.MARGIN_X + i * (cw + gap)
        s.round_rect(cx, y0, cw, 1.15, fill=accent, radius=0.06, name=f"Ch{i}")
        s.text(cx + 0.1, y0 + 0.12, cw - 0.2, 0.4, [
            {"runs": [{"text": name, "size": 13.5, "bold": True, "color": d.WHITE, "font": d.EN, "spacing": 10}]},
        ], anchor="t")
        s.text(cx + 0.1, y0 + 0.5, cw - 0.2, 0.6, [
            {"runs": [{"text": purpose, "size": 10, "bold": True, "color": d.WHITE, "font": d.JP}]},
        ], anchor="t")
        if i < n - 1:
            s.line(cx + cw + 0.02, y0 + 0.575, cx + cw + gap - 0.02, y0 + 0.575, color=d.INK, width=1.5, arrow_end=True)

    s.text(d.MARGIN_X, 3.25, d.CONTENT_W, 0.32, [
        {"runs": [{"text": "PSYCHOLOGICAL SHIFT ／ 心理変化", "size": 11, "bold": True, "color": d.INK, "font": d.EN, "spacing": 30}]},
    ], anchor="m")
    y1 = 3.7
    for i, (name, accent, purpose, mind) in enumerate(ROADMAP):
        cx = d.MARGIN_X + i * (cw + gap)
        s.rect(cx, y1, cw, 0.85, fill=d.WHITE, line=accent, line_w=d.BORDER_W, name=f"Mind{i}")
        s.text(cx + 0.1, y1, cw - 0.2, 0.85, [
            {"align": "c", "line_spacing": 128, "runs": [{"text": mind, "size": 10.5, "bold": True, "color": d.INK, "font": d.JP}]},
        ], anchor="m")
        if i < n - 1:
            s.line(cx + cw + 0.02, y1 + 0.425, cx + cw + gap - 0.02, y1 + 0.425, color=d.INK, width=1.5, arrow_end=True)

    s.line(d.MARGIN_X, 4.85, d.MARGIN_X + d.CONTENT_W, 4.85, color=d.HAIRLINE, width=1.0)
    d.body(s, d.MARGIN_X, 5.05, d.CONTENT_W, 1.4,
           "TikTok・Instagramで感情を動かし、YouTubeで理解を深め、Web／Realで実際の行動へつなぐ。\n"
           "各フェーズの目的は「フォロワー数」ではなく、次の心理状態へ進んだ人の数で測る（詳細はP.21 KPI）。",
           size=12, line_spacing=160)

    d.footer(s, 19, d.ORANGE)
    return s


SCHEDULE = [
    ("1", "2", "TikTok", "準備・制作"),
    ("2", "4", "TikTok", "3方向検証"),
    ("4", "6", "Instagram", "立ち上げ"),
    ("6", "9", "YouTube", "開始"),
    ("9", "12", "Web / Real", "テスト"),
    ("12", "〜", "Focus", "成果施策へ集中"),
]


def slide_20_schedule():
    s = SceneSlide("schedule")
    d.base(s)
    d.header(s, "12 MONTH ROADMAP", "12ヶ月スケジュール", d.ORANGE)
    d.h1(s, d.MARGIN_X, 0.85, 9, 0.55, ["まず TikTok で検証し、段階的に拡張する。"], size=19)

    y0 = 2.0
    n = len(SCHEDULE)
    gap = 0.14
    cw = (d.CONTENT_W - gap * (n - 1)) / n
    s.line(d.MARGIN_X, y0 - 0.35, d.MARGIN_X + d.CONTENT_W, y0 - 0.35, color=d.HAIRLINE, width=1.0)
    for i, (a, b, ch, desc) in enumerate(SCHEDULE):
        cx = d.MARGIN_X + i * (cw + gap)
        accent = d.ORANGE if i < 2 else [d.PINK, d.BLUE, d.CYAN, d.INK][i - 2]
        s.text(cx, y0 - 0.32, cw, 0.3, [
            {"runs": [{"text": f"{a}〜{b}ヶ月" if b != "〜" else f"{a}ヶ月〜", "size": 10.5, "bold": True, "color": accent, "font": d.EN}]},
        ], anchor="m")
        s.rect(cx, y0, cw, 2.7, fill=d.WHITE, line=accent, line_w=d.BORDER_W, name=f"Sched{i}")
        s.rect(cx, y0, cw, 0.09, fill=accent, name=f"SchedTop{i}")
        s.text(cx + 0.14, y0 + 0.3, cw - 0.28, 0.7, [
            {"runs": [{"text": ch, "size": 13.5, "bold": True, "color": d.INK, "font": d.EN, "spacing": 10}]},
        ], anchor="t")
        s.text(cx + 0.14, y0 + 0.95, cw - 0.28, 1.5, [
            {"line_spacing": 140, "runs": [{"text": desc, "size": 11, "bold": False, "color": d.INK, "font": d.JP}]},
        ], anchor="t")
        s.oval(cx + cw / 2 - 0.1, y0 - 0.51, 0.2, 0.2, fill=accent, name=f"Dot{i}")

    s.line(d.MARGIN_X, y0 + 2.95, d.MARGIN_X + d.CONTENT_W, y0 + 2.95, color=d.HAIRLINE, width=1.0)
    d.body(s, d.MARGIN_X, y0 + 3.15, d.CONTENT_W, 0.6,
           "※ Phase1（TikTok）の結果をもとに、Phase2以降は柔軟に変更する。",
           size=11.5, bold=True, color=d.ORANGE)

    steps = [("01", "検証", "TikTokで3方向の反応を比較する"),
             ("02", "拡張", "反応の良い型をIG・YouTubeへ広げる"),
             ("03", "集中", "成果の出た施策にリソースを寄せる")]
    sw = (d.CONTENT_W - 0.3 * 2) / 3
    sy = y0 + 3.75
    for i, (num, jp, desc) in enumerate(steps):
        sx = d.MARGIN_X + i * (sw + 0.3)
        s.rect(sx, sy, sw, 1.1, fill=d.WHITE, line=d.HAIRLINE, line_w=1.0, name=f"StepNote{i}")
        s.text(sx + 0.18, sy + 0.14, sw - 0.36, 0.4, [
            {"runs": [
                {"text": num + "  ", "size": 13, "bold": True, "color": d.ORANGE, "font": d.EN},
                {"text": jp, "size": 13, "bold": True, "color": d.INK, "font": d.JP},
            ]},
        ], anchor="t")
        d.body(s, sx + 0.18, sy + 0.56, sw - 0.36, 0.5, desc, size=9.5, line_spacing=138)

    d.footer(s, 20, d.ORANGE)
    return s


def slide_21_kpi():
    s = SceneSlide("kpi")
    d.base(s)
    d.header(s, "KPI", "計測指標", d.BLUE)
    d.h1(s, d.MARGIN_X, 0.85, 9.5, 0.6, ["フォロワーではなく、次の心理状態へ進んだかを見る。"], size=18)

    groups = [
        ("TikTok", d.ORANGE, "認知・感情", ["再生数", "完視聴率", "平均視聴時間", "シェア", "コメント"]),
        ("Instagram", d.PINK, "共感・自分事化", ["保存", "シェア", "プロフィール遷移", "Stories反応", ""]),
        ("YouTube", d.BLUE, "理解", ["CTR", "視聴維持率", "平均視聴時間", "Web流入", ""]),
        ("Web / Real", d.CYAN, "行動", ["企業ページ閲覧", "診断利用", "会社見学申込", "イベント参加", "応募"]),
    ]
    col_w = d.CONTENT_W / 4
    rows = [[{"text": f"{g[0]}\n{g[2]}", "fill": g[1], "color": d.WHITE, "size": 13, "align": "c"} for g in groups]]
    max_rows = max(len(g[3]) for g in groups)
    for r in range(max_rows):
        row = []
        for g in groups:
            txt = g[3][r] if r < len(g[3]) else ""
            row.append({"text": txt, "fill": "FFFFFF", "color": "1A1A1A", "size": 12, "align": "c"})
        rows.append(row)
    s.table(d.MARGIN_X, 1.85, d.CONTENT_W, 4.8, [col_w] * 4, rows,
            row_heights=[0.85] + [0.79] * max_rows, border_color=d.HAIRLINE, border_w=1.0)

    d.footer(s, 21, d.BLUE)
    return s


FUTURE_ITEMS = ["企業版ショートドラマ", "若手社員ドキュメンタリー", "高卒採用ブランディング",
                "学校向けキャリアコンテンツ", "職場体験", "市場調査", "高卒採用ラボ"]


def slide_22_future():
    s = SceneSlide("future")
    d.base(s)
    s.rect(0, 0, d.PAGE_W, 2.55, fill=d.ORANGE, name="Top Panel")
    d.header(s, "FUTURE VISION", "未来像", d.WHITE, label_color=d.WHITE, tick_color=d.WHITE)
    s.text(d.MARGIN_X, 0.85, d.CONTENT_W, 1.3, [
        {"line_spacing": 118, "runs": [{"text": "高卒求人媒体から、", "size": 30, "bold": True, "color": d.WHITE, "font": d.JP}]},
        {"line_spacing": 118, "runs": [{"text": "18歳の進路メディアへ。", "size": 30, "bold": True, "color": d.WHITE, "font": d.JP}]},
    ], anchor="t")

    y0 = 2.95
    halfw = (d.CONTENT_W - 0.4) / 2
    s.rect(d.MARGIN_X, y0, halfw, 1.55, fill=d.WHITE, line=d.ORANGE, line_w=d.BORDER_W, name="Student")
    s.text(d.MARGIN_X + 0.2, y0 + 0.14, halfw - 0.4, 0.35, [
        {"runs": [{"text": "STUDENT", "size": 13, "bold": True, "color": d.ORANGE, "font": d.EN, "spacing": 30}]},
    ], anchor="m")
    d.body(s, d.MARGIN_X + 0.2, y0 + 0.55, halfw - 0.4, 0.9,
           "進路に迷った時、知らない選択肢に出会える場所。", size=13, line_spacing=150)

    x2 = d.MARGIN_X + halfw + 0.4
    s.rect(x2, y0, halfw, 1.55, fill=d.WHITE, line=d.ORANGE, line_w=d.BORDER_W, name="Company")
    s.text(x2 + 0.2, y0 + 0.14, halfw - 0.4, 0.35, [
        {"runs": [{"text": "COMPANY", "size": 13, "bold": True, "color": d.ORANGE, "font": d.EN, "spacing": 30}]},
    ], anchor="m")
    d.body(s, x2 + 0.2, y0 + 0.55, halfw - 0.4, 0.9,
           "求人を出す場所ではなく、若者から選ばれる会社になる場所。", size=13, line_spacing=150)

    subhead(s, d.MARGIN_X, 4.75, d.CONTENT_W, "NEXT", "将来施策", d.ORANGE)
    fw = (d.CONTENT_W - 0.14 * 6) / 7
    for i, item in enumerate(FUTURE_ITEMS):
        d.outline_chip(s, d.MARGIN_X + i * (fw + 0.14), 5.1, fw, 0.85, item, d.ORANGE, size=9, font=d.JP, spacing=0)

    s.line(d.MARGIN_X, 6.35, d.MARGIN_X + d.CONTENT_W, 6.35, color=d.HAIRLINE, width=1.0)
    s.text(d.MARGIN_X, 6.5, d.CONTENT_W, 0.5, [
        {"align": "c", "runs": [{"text": "高卒採用を広めるのではなく、18歳の選択肢を広げる。", "size": 15, "bold": True, "color": d.ORANGE, "font": d.JP}]},
    ], anchor="m")

    d.footer(s, 22, d.ORANGE)
    return s
