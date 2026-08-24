import design as d
from scene import SceneSlide
from blocks import subhead, value_contrast, value_arrow, photo_row, storyboard_4, pairing_chips, quote_list, process_chevron

CASES = [
    dict(
        num=1, page_start=3, accent=d.PINK, category="逆張り・逆転型",
        title=["学校では評価されなかった", "僕ら。"],
        account_design=(
            "主役は優等生だけじゃない。成績が悪い、じっとしていられない、\n"
            "先生から期待されていない ― そんな学生たち。\n"
            "学校で弱点に見えた部分は、環境が変われば強みになる。"
        ),
        reframes=[("落ち着きがない", "行動が早い"), ("よくしゃべる", "距離を縮めるのが上手い"),
                  ("勉強が苦手", "やりながら覚えるのが得意"), ("反抗的", "自分の意見を持っている")],
        concept="学校の評価と、人生の評価は同じではない。高卒就職の成功も、大学進学の否定も目的ではない。"
                "「自分には何もない」と感じている学生に、まだ違う場所を知らないだけかもしれない、という視点を届ける。",
        value=dict(type="contrast", left="高卒でも成功できる", right="今いる場所だけで\n価値を決めなくていい"),
        world="舞台は教室・廊下・通学路・進路指導室・放課後・家。「こういう子いる」と思える日常に、"
              "逆転・意外性・立場の変化という強い感情を重ねる。非現実的な成功物語にはしない。",
        scenes=[(1, "教室 / 授業中"), (2, "進路指導室 / 面談"), (3, "放課後 / 帰り道")],
        page_c=dict(
            kind="storyboard",
            flow=["弱点", "周囲の評価", "劣等感", "違う環境", "評価の変化", "余韻"],
            examples=[
                "学年最下位の僕が、会社では一番最初に名前を覚えられた。",
                "先生に向いてないと言われた仕事で、初めて褒められた。",
                "学校では問題児。職場では「行動が早い新人」だった。",
            ],
            images_start=3,
        ),
    ),
    dict(
        num=2, page_start=6, accent=d.CYAN, category="青春・可能性型",
        title=["違う道を選ぶのが、", "一番怖かった。"],
        account_design=(
            "進路は大学・専門・就職だけじゃない。親友、恋人、家族、先生、部活 ―\n"
            "それまで一緒だった人たちと、初めて違う道へ進む時期を描く。\n"
            "進学か就職かではなく、周りと違う選択をする「怖さ」が主題。"
        ),
        reframes=[("親友は大学、自分は就職", "後ろめたさ"), ("彼女に進路を聞かれる", "気まずさ"),
                  ("卒業式で進路を話す", "勇気"), ("みんな進学、自分だけ違う", "孤独感")],
        concept="違う道を選ぶことは、負けではない。周囲との比較ではなく、"
                "自分の選択に向き合う瞬間を丁寧に描く。",
        value=dict(type="arrow", left="これ自分も思ってる。", right="周りと同じじゃなくてもいい。"),
        world="昼休み・帰り道・進路希望調査・卒業式・親との夕食・友達とのLINE。"
              "そこに友達との進路の違い、親の期待、恋人との距離、卒業後の不安を重ねる。",
        scenes=[(4, "帰り道 / 友達と"), (5, "進路希望調査 / 教室"), (6, "卒業式 / みんなで")],
        page_c=dict(
            kind="pairing",
            pairs=[("人間関係", "進路"), ("恋愛", "進学と就職"), ("友情", "違う進路"),
                   ("家族", "親の期待"), ("部活", "卒業後")],
            examples=[
                "親友は大学。僕は就職。",
                "彼女に「大学行かないの？」と聞かれた。",
                "みんな進学。自分だけ就職するって言えなかった。",
                "卒業式の日、初めて自分の進路を友達に話した。",
            ],
        ),
    ),
    dict(
        num=3, page_start=9, accent=d.PURPLE, category="現実・葛藤型",
        title=["やりたいことなんて、", "まだない。"],
        account_design=(
            "夢がある学生だけを主役にしない。大学へ行きたいわけでも、\n"
            "働きたいわけでもない。なりたい職業もない。\n"
            "なんとなく周りと同じ進路を選ぼうとしている学生が主人公。"
        ),
        reframes=[("やりたいことがない", "遅れていない"), ("進路面談で答えられない", "自然なこと"),
                  ("周りは決まって見える", "実は同じ", ), ("小さな発見", "十分な変化")],
        concept="決まっていないことは、遅れていることではない。"
                "大成功ではなく、小さな感情の変化を主役にする。",
        value=dict(type="arrow", left="自分だけじゃない。", right="知らない選択肢を知ることはできる。"),
        world="進路面談で「大学どうするの？」と聞かれ、友達は志望校の話。自分だけ答えられない ―"
              "大事件ではないが本人には重い時間。最後も「少し面白そうな仕事を知った」程度でいい。",
        scenes=[(7, "進路面談 / 家庭"), (8, "教室 / 友達の会話"), (9, "通学路 / ひとり")],
        page_c=dict(
            kind="chevron",
            flow=["焦り", "共感", "発見", "小さな変化"],
            examples=[
                "夢がないって言ったら、先生に困った顔をされた。",
                "大学に行く理由を聞かれて、答えられなかった。",
                "やりたいことがない僕が、初めて「ちょっと面白そう」と思った仕事。",
                "みんな将来が決まってるように見えた。",
            ],
        ),
    ),
]


def page_a(case):
    s = SceneSlide(f"tiktok{case['num']}-a")
    d.base(s)
    d.header(s, f"TIKTOK CASE {case['num']:02d}", f"{case['category']} ／ アカウント設計・全体コンセプト", case["accent"])
    d.h1(s, d.MARGIN_X, 0.9, 6.5, 1.3, case["title"], size=28, line_spacing=120)

    lx, lw = d.MARGIN_X, 6.35
    subhead(s, lx, 2.35, lw, "ACCOUNT DESIGN", "アカウント設計", case["accent"])
    d.body(s, lx, 2.68, lw, 1.0, case["account_design"], size=11, line_spacing=145)

    gy = 3.85
    gw = (lw - 0.2) / 2
    for i, pair in enumerate(case["reframes"]):
        cx = lx + (i % 2) * (gw + 0.2)
        cy = gy + (i // 2) * 0.62
        a, b = pair[0], pair[1]
        d.outline_chip(s, cx, cy, gw * 0.46, 0.4, a, d.INK, size=9, font=d.JP, spacing=0)
        s.text(cx + gw * 0.46, cy, gw * 0.08, 0.4, [
            {"align": "c", "runs": [{"text": "→", "size": 12, "bold": True, "color": case["accent"], "font": d.EN}]}
        ], anchor="m")
        d.chip(s, cx + gw * 0.54, cy, gw * 0.46, 0.4, b, case["accent"], size=9, font=d.JP, spacing=0)

    subhead(s, lx, 5.5, lw, "CONCEPT", "全体コンセプト", case["accent"])
    d.body(s, lx, 5.82, lw, 1.0, case["concept"], size=11, line_spacing=145)

    rx, ry, rw = 7.35, 0.95, d.PAGE_W - d.MARGIN_X - 7.35
    ph = 4.35
    pw = ph / 2.06
    gx = rx + (rw - (pw * 2 + 0.3)) / 2
    d.phone_frame(s, gx, ry, pw, ph, case["accent"], case["num"] * 10 + 1, app_label="TikTok", caption="Before")
    d.phone_frame(s, gx + pw + 0.3, ry, pw, ph, case["accent"], case["num"] * 10 + 2, app_label="TikTok", caption="After")

    vy = ry + ph + 0.68
    if case["value"]["type"] == "contrast":
        value_contrast(s, rx, vy, rw, 0.42, case["value"]["left"], case["value"]["right"], case["accent"])
    else:
        value_arrow(s, rx, vy, rw, 0.42, case["value"]["left"], case["value"]["right"], case["accent"])

    d.footer(s, case["page_start"], case["accent"], section=f"TikTok 案{case['num']} {case['category']}")
    return s


def page_b(case):
    s = SceneSlide(f"tiktok{case['num']}-b")
    d.base(s)
    d.header(s, f"TIKTOK CASE {case['num']:02d}", f"{case['category']} ／ 世界観・価値訴求ポイント", case["accent"])

    subhead(s, d.MARGIN_X, 0.98, d.CONTENT_W, "WORLDVIEW", "世界観", case["accent"])
    d.body(s, d.MARGIN_X, 1.3, d.CONTENT_W, 0.85, case["world"], size=11.5, line_spacing=148)

    photo_row(s, d.MARGIN_X, 2.35, d.CONTENT_W, 2.55, case["scenes"], case["accent"])

    subhead(s, d.MARGIN_X, 5.28, d.CONTENT_W, "VALUE POINT", "価値訴求ポイント", case["accent"])
    vy = 5.62
    if case["value"]["type"] == "contrast":
        value_contrast(s, d.MARGIN_X, vy, d.CONTENT_W * 0.62, 0.46, case["value"]["left"], case["value"]["right"], case["accent"])
    else:
        value_arrow(s, d.MARGIN_X, vy, d.CONTENT_W * 0.62, 0.46, case["value"]["left"], case["value"]["right"], case["accent"])
    d.body(s, d.MARGIN_X + d.CONTENT_W * 0.68, vy - 0.03, d.CONTENT_W * 0.32, 0.6,
           "届けたいのは「高卒でも成功できる」ではなく、\n選択肢そのものへの見方を変えること。" if case["num"] == 1 else
           "広告的な成功談ではなく、等身大の感情の動きを届ける。",
           size=10, line_spacing=140)

    d.footer(s, case["page_start"] + 1, case["accent"], section=f"TikTok 案{case['num']} {case['category']}")
    return s


def page_c(case):
    s = SceneSlide(f"tiktok{case['num']}-c")
    d.base(s)
    d.header(s, f"TIKTOK CASE {case['num']:02d}", f"{case['category']} ／ 勝つためのコンテンツ定義", case["accent"])
    d.h1(s, d.MARGIN_X, 0.9, 9, 0.5, ["勝つためのコンテンツ定義"], size=22)

    pc = case["page_c"]
    if pc["kind"] == "storyboard":
        subhead(s, d.MARGIN_X, 1.7, d.CONTENT_W, "STRUCTURE", "基本構造", case["accent"])
        flow_txt = "  →  ".join(pc["flow"])
        s.text(d.MARGIN_X, 1.98, d.CONTENT_W, 0.32, [
            {"runs": [{"text": flow_txt, "size": 11.5, "bold": True, "color": d.INK, "font": d.JP}]},
        ], anchor="m")
        bottom = storyboard_4(s, d.MARGIN_X, 2.5, d.CONTENT_W, 2.7, ["HOOK", "CONFLICT", "TURN", "AFTER"],
                              case["accent"], pc["images_start"])
        subhead(s, d.MARGIN_X, bottom + 0.3, d.CONTENT_W, "EXAMPLES", "企画例", case["accent"])
        ex_y = bottom + 0.62
        col_w = d.CONTENT_W / len(pc["examples"])
        for i, ex in enumerate(pc["examples"]):
            d.body(s, d.MARGIN_X + i * col_w, ex_y, col_w - 0.15, 0.6, ex, size=9.5, line_spacing=132)

    elif pc["kind"] == "pairing":
        lx, lw = d.MARGIN_X, 5.6
        subhead(s, lx, 1.75, lw, "MUST INCLUDE", "必ず含む掛け合わせ", case["accent"])
        pairing_chips(s, lx, 2.15, lw, pc["pairs"], case["accent"], row_h=0.56, gap=0.24)
        s.rect(lx, 6.1, lw, 0.62, fill=None, line=case["accent"], line_w=d.BORDER_W, name="NoteBox")
        d.body(s, lx + 0.2, 6.1, lw - 0.4, 0.62,
               "5つの掛け合わせのうち、必ずどれか1つを軸にする。", size=11, bold=True, anchor="m")
        rx, rw = 6.55, d.PAGE_W - d.MARGIN_X - 6.55
        subhead(s, rx, 1.75, rw, "EXAMPLES", "企画例", case["accent"])
        quote_list(s, rx, 2.15, rw, pc["examples"], case["accent"], line_h=1.05)

    elif pc["kind"] == "chevron":
        subhead(s, d.MARGIN_X, 1.75, d.CONTENT_W, "STRUCTURE", "構造", case["accent"])
        process_chevron(s, d.MARGIN_X, 2.15, d.CONTENT_W, 0.62, pc["flow"], case["accent"])
        s.text(d.MARGIN_X, 2.87, d.CONTENT_W, 0.4, [
            {"runs": [{"text": "大成功を作りすぎない。主役は小さな感情の変化。", "size": 10.5, "color": d.INK, "font": d.JP}]},
        ], anchor="m")
        subhead(s, d.MARGIN_X, 3.55, d.CONTENT_W, "EXAMPLES", "企画例", case["accent"])
        quote_list(s, d.MARGIN_X, 3.9, d.CONTENT_W * 0.62, pc["examples"], case["accent"], line_h=0.72)
        rx = d.MARGIN_X + d.CONTENT_W * 0.68
        rw = d.CONTENT_W * 0.32
        d.photo_placeholder(s, rx, 3.9, rw, 2.9, 7, "進路面談 / 家庭", case["accent"])

    d.footer(s, case["page_start"] + 2, case["accent"], section=f"TikTok 案{case['num']} {case['category']}")
    return s


def build_tiktok_slides():
    out = []
    for case in CASES:
        out.append(page_a(case))
        out.append(page_b(case))
        out.append(page_c(case))
    return out
