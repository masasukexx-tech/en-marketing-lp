import design as d
from scene import SceneSlide
from blocks import subhead, value_contrast, photo_row, quote_list, pairing_chips

IG = d.PINK
YT = d.BLUE


def slide_12_ig_account():
    s = SceneSlide("ig-12")
    d.base(s)
    d.header(s, "INSTAGRAM", "アカウント設計・全体コンセプト", IG)
    d.h1(s, d.MARGIN_X, 0.9, 7, 1.0, ["18歳の、その後。"], size=30)

    lx, lw = d.MARGIN_X, 6.3
    value_contrast(s, lx, 1.95, lw, 0.46, "TikTok ／ フィクション", "Instagram ／ リアル", IG)

    subhead(s, lx, 2.75, lw, "CAST", "主役にする5人", IG)
    roles = ["高校生", "高卒1年目", "高卒3年目", "大学生", "専門学生"]
    rw = (lw - 0.1 * 4) / 5
    for i, r in enumerate(roles):
        d.outline_chip(s, lx + i * (rw + 0.1), 3.08, rw, 0.42, r, IG, size=9.5, font=d.JP, spacing=0)

    subhead(s, lx, 3.85, lw, "CONCEPT", "全体コンセプト", IG)
    d.body(s, lx, 4.18, lw, 1.0,
           "TikTokで描いた「こんな人生もあるかもしれない」を、実在する若者へ接続する。\n"
           "進路を、選んだ瞬間ではなく「その後」から見る。",
           size=12, line_spacing=155)

    s.rect(lx, 5.35, lw, 1.15, fill=None, line=IG, line_w=d.BORDER_W, name="NoteBox")
    s.rect(lx, 5.35, 0.08, 1.15, fill=IG, name="NoteAccent")
    d.body(s, lx + 0.28, 5.35, lw - 0.5, 1.15,
           "TikTokで生まれた「まだ違う場所を知らないだけかもしれない」という違和感を、"
           "Instagramでは実在する先輩の日常として深掘りする。",
           size=11.5, line_spacing=155, anchor="m")

    rx, ry, rw = 7.3, 0.95, d.PAGE_W - d.MARGIN_X - 7.3
    d.phone_frame(s, rx + rw / 2 - 0.85, ry, 1.7, 3.5, IG, 15, app_label="Instagram", caption="プロフィール")
    py = ry + 3.5 + 0.5
    photo_row(s, rx, py, rw, 1.55, [(10, "高卒1年目 / 職場"), (11, "休日 / 友達と")], IG)

    d.footer(s, 12, IG, section="Instagram ／ 共感・自分事化")
    return s


def slide_13_ig_world():
    s = SceneSlide("ig-13")
    d.base(s)
    d.header(s, "INSTAGRAM", "世界観・価値訴求ポイント", IG)

    subhead(s, d.MARGIN_X, 0.98, d.CONTENT_W, "WORLDVIEW", "世界観 ― 広告的な成功談は禁止", IG)
    d.body(s, d.MARGIN_X, 1.3, d.CONTENT_W, 0.6,
           "仕事・休日・給与・友達・人間関係・後悔・成長。等身大のリアルだけを見せる。",
           size=11.5)

    photo_row(s, d.MARGIN_X, 2.0, d.CONTENT_W * 0.56, 3.3,
              [(12, "初任給 / 家族と食事"), (13, "職場 / 先輩と休憩")], IG)

    qx = d.MARGIN_X + d.CONTENT_W * 0.56 + 0.3
    qw = d.CONTENT_W * 0.44 - 0.3
    subhead(s, qx, 1.98, qw, "VOICE", "リアルな声", IG)
    quote_list(s, qx, 2.35, qw, [
        "大学に行った友達が羨ましかった。",
        "最初の半年は辞めたかった。",
        "初任給で親にご飯を奢った。",
        "高校生に戻っても同じ進路を選ぶ。",
    ], IG, line_h=0.78)

    subhead(s, d.MARGIN_X, 5.55, d.CONTENT_W, "VALUE POINT", "価値訴求ポイント", IG)
    s.rect(d.MARGIN_X, 5.9, d.CONTENT_W, 0.85, fill=None, line=IG, line_w=d.BORDER_W, name="ValueBox")
    s.rect(d.MARGIN_X, 5.9, 0.08, 0.85, fill=IG, name="ValueAccent")
    d.body(s, d.MARGIN_X + 0.3, 5.9, d.CONTENT_W - 0.6, 0.85,
           "制度の説明ではなく、「自分と数歳しか違わない人が、どう生きているか」を見せる。",
           size=14, bold=True, anchor="m")

    d.footer(s, 13, IG, section="Instagram ／ 共感・自分事化")
    return s


def slide_14_ig_content():
    s = SceneSlide("ig-14")
    d.base(s)
    d.header(s, "INSTAGRAM", "勝つためのコンテンツ定義", IG)
    d.h1(s, d.MARGIN_X, 0.9, 9, 0.5, ["Reels / Feed / Stories の使い分け"], size=20)

    cols = [
        ("REELS", "人物との出会い", "新しい人物・仕事との\n出会いを届ける入口"),
        ("FEED", "プロフィール", "当時の悩み・選択・\n現在を1投稿で見せる"),
        ("STORIES", "視聴者参加", "質問・投票で\n視聴者を巻き込む"),
    ]
    cw = (d.CONTENT_W - 0.3 * 2) / 3
    cy = 1.75
    for i, (en, jp, desc) in enumerate(cols):
        cx = d.MARGIN_X + i * (cw + 0.3)
        s.rect(cx, cy, cw, 1.55, fill=d.WHITE, line=IG, line_w=d.BORDER_W, name=f"Col{i}")
        s.rect(cx, cy, cw, 0.42, fill=IG, name=f"ColHead{i}")
        s.text(cx, cy, cw, 0.42, [
            {"align": "c", "runs": [{"text": en, "size": 13, "bold": True, "color": d.WHITE, "font": d.EN, "spacing": 30}]},
        ], anchor="m")
        s.text(cx + 0.14, cy + 0.5, cw - 0.28, 0.3, [
            {"runs": [{"text": jp, "size": 12, "bold": True, "color": d.INK, "font": d.JP}]},
        ], anchor="m")
        d.body(s, cx + 0.14, cy + 0.82, cw - 0.28, 0.7, desc, size=9.5, line_spacing=138)

    subhead(s, d.MARGIN_X, 3.6, d.CONTENT_W, "SERIES", "シリーズ企画", IG)
    series = ["18歳、その後。", "18歳の本音。", "高校生の自分に言いたいこと。", "進学した友達／就職した自分。"]
    sw = (d.CONTENT_W - 0.15 * 3) / 4
    for i, txt in enumerate(series):
        d.outline_chip(s, d.MARGIN_X + i * (sw + 0.15), 3.93, sw, 0.46, txt, IG, size=9.5, font=d.JP, spacing=0)

    py = 4.75
    ph = 1.9
    pw = ph / 2.06
    gap = 0.5
    total_w = pw * 3 + gap * 2
    x0 = d.MARGIN_X + (d.CONTENT_W - total_w) / 2
    for i in range(3):
        d.phone_frame(s, x0 + i * (pw + gap), py, pw, ph, IG, 15 + i, app_label="Instagram")

    d.footer(s, 14, IG, section="Instagram ／ 共感・自分事化")
    return s


def build_ig_slides():
    return [slide_12_ig_account(), slide_13_ig_world(), slide_14_ig_content()]


# ---------------------------------------------------------------- YouTube --

def slide_15_yt_account():
    s = SceneSlide("yt-15")
    d.base(s)
    d.header(s, "YOUTUBE", "アカウント設計・全体コンセプト", YT)
    d.h1(s, d.MARGIN_X, 0.9, 6.6, 1.5, ["18歳から始まる、", "仕事のリアル。"], size=27, line_spacing=122)

    lx, lw = d.MARGIN_X, 6.3
    subhead(s, lx, 2.55, lw, "ACCOUNT DESIGN", "アカウント設計", YT)
    d.body(s, lx, 2.88, lw, 1.1,
           "高校生が普段見られない「仕事・会社・働く人」を見せる。\n"
           "主役は採用担当者ではなく、若手社員と高校生、現場の人。",
           size=12, line_spacing=150)

    subhead(s, lx, 4.15, lw, "CONCEPT", "全体コンセプト", YT)
    d.body(s, lx, 4.48, lw, 0.6, "会社を知る前に、そこで働く人を知る。", size=15, bold=True)

    subhead(s, lx, 5.35, lw, "WHY YOUTUBE", "TikTok / Instagramとの違い", YT)
    d.body(s, lx, 5.68, lw, 1.1,
           "短尺で興味を引いたTikTok、実在の先輩に共感したInstagramの先に、\n"
           "「10分間、じっくり見て理解する」場所を置く。採用担当者目線ではなく、\n"
           "同じ目線の若手社員が案内するドキュメンタリー形式で見せる。",
           size=11, line_spacing=150)

    rx, ry, rw = 7.35, 0.95, d.PAGE_W - d.MARGIN_X - 7.35
    d.pc_frame(s, rx, ry, rw, rw * 0.58, YT, 21, youtube=True, caption="若手社員ドキュメンタリー")
    py = ry + rw * 0.58 + 0.55
    d.photo_placeholder(s, rx, py, rw, 1.55, 14, "現場 / 若手社員と先輩", YT)

    d.footer(s, 15, YT, section="YouTube ／ 理解・深掘り")
    return s


def slide_16_yt_world():
    s = SceneSlide("yt-16")
    d.base(s)
    d.header(s, "YOUTUBE", "世界観・価値訴求ポイント", YT)

    subhead(s, d.MARGIN_X, 0.98, d.CONTENT_W, "WORLDVIEW", "世界観 ― ドキュメンタリー", YT)
    steps = ["出勤", "仕事", "先輩との会話", "昼休み", "失敗", "疲れ", "帰宅"]
    n = len(steps)
    gap = 0.1
    cw = (d.CONTENT_W - gap * (n - 1)) / n
    for i, st in enumerate(steps):
        cx = d.MARGIN_X + i * (cw + gap)
        s.round_rect(cx, 1.4, cw, 0.5, fill=d.INK if i not in (0, n - 1) else YT, radius=0.5, name=f"Step{i}")
        s.text(cx, 1.4, cw, 0.5, [
            {"align": "c", "runs": [{"text": st, "size": 9, "bold": True, "color": d.WHITE, "font": d.JP}]},
        ], anchor="m")
        if i < n - 1:
            s.line(cx + cw + 0.01, 1.65, cx + cw + gap - 0.01, 1.65, color=YT, width=1.25, arrow_end=True)

    subhead(s, d.MARGIN_X, 2.35, d.CONTENT_W * 0.55, "QUESTIONS", "聞きたい質問", YT)
    quote_list(s, d.MARGIN_X, 2.68, d.CONTENT_W * 0.55, [
        "高卒と大卒って扱い違う？",
        "一番若い社員は何歳？",
        "初任給、何に使った？",
        "辞めたいと思ったことある？",
        "この仕事で一番きついことは？",
    ], YT, line_h=0.56)

    px = d.MARGIN_X + d.CONTENT_W * 0.55 + 0.35
    pw = d.CONTENT_W * 0.45 - 0.35
    photo_row(s, px, 2.68, pw, 2.6, [(15, "先輩との会話 / 昼休み")], YT)

    subhead(s, d.MARGIN_X, 5.85, d.CONTENT_W, "VALUE POINT", "価値訴求ポイント", YT)
    d.body(s, d.MARGIN_X, 6.16, d.CONTENT_W, 0.5,
           "「高卒就職」ではなく、「この仕事なら自分にもできるかもしれない」へ。",
           size=13, bold=True)

    d.footer(s, 16, YT, section="YouTube ／ 理解・深掘り")
    return s


def slide_17_yt_content():
    s = SceneSlide("yt-17")
    d.base(s)
    d.header(s, "YOUTUBE", "勝つためのコンテンツ定義", YT)
    d.h1(s, d.MARGIN_X, 0.9, 9, 0.5, ["企業PRではなく、仕事発見コンテンツ。"], size=19)

    pillars = [
        ("01", "18歳から働く人に密着"),
        ("02", "高校生が会社に行ってみた"),
        ("03", "知らなかった仕事"),
    ]
    cw = (d.CONTENT_W - 0.25 * 2) / 3
    for i, (num, title) in enumerate(pillars):
        cx = d.MARGIN_X + i * (cw + 0.25)
        s.rect(cx, 1.65, cw, 0.85, fill=d.WHITE, line=YT, line_w=d.BORDER_W, name=f"Pillar{i}")
        s.text(cx + 0.16, 1.65, 0.9, 0.85, [
            {"runs": [{"text": num, "size": 22, "bold": True, "color": YT, "font": d.EN}]},
        ], anchor="m")
        s.text(cx + 0.95, 1.65, cw - 1.05, 0.85, [
            {"runs": [{"text": title, "size": 11.5, "bold": True, "color": d.INK, "font": d.JP}]},
        ], anchor="m")

    subhead(s, d.MARGIN_X, 2.85, d.CONTENT_W, "JOBS", "職種例", YT)
    jobs = ["施工管理", "営業", "物流", "製造", "IT", "ホテル", "インフラ"]
    jw = (d.CONTENT_W - 0.12 * 6) / 7
    for i, j in enumerate(jobs):
        d.chip(s, d.MARGIN_X + i * (jw + 0.12), 3.18, jw, 0.42, j, d.INK, size=9.5, font=d.JP, spacing=0)

    ry = 3.85
    d.pc_frame(s, d.MARGIN_X, ry, 3.0, 1.7, YT, 18, youtube=True, caption="密着ドキュメンタリー")
    d.phone_frame(s, d.MARGIN_X + 3.75, ry, 1.21, 2.5, YT, 19, app_label="YouTube", caption="ショート版")
    d.phone_frame(s, d.MARGIN_X + 5.35, ry, 1.21, 2.5, YT, 20, app_label="YouTube", caption="オフショット")
    d.photo_placeholder(s, d.MARGIN_X + 6.95, ry, d.CONTENT_W - 6.95, 3.0, 16, "会社見学 / 高校生と社員", YT)

    d.footer(s, 17, YT, section="YouTube ／ 理解・深掘り")
    return s


def build_yt_slides():
    return [slide_15_yt_account(), slide_16_yt_world(), slide_17_yt_content()]
