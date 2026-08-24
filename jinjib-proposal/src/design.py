"""Design tokens shared by every slide: colors, fonts, grid, and the common
frame/label rules the brief requires to be identical across all 22 pages."""

WHITE = "FFFFFF"
INK = "1A1A1A"
PAPER = "FFF7EF"          # warm off-white, never gray
ORANGE = "FF6A00"
ORANGE_DEEP = "CC5200"
CYAN = "00C2D1"
BLUE = "2A5CFF"
YELLOW = "FFC700"
PINK = "FF3D8A"
LIME = "9ADB2A"
PURPLE = "8A2BE2"
HAIRLINE = "EADFD2"       # warm hairline, used ONLY as a quiet divider, never as a border rule

JP = "Noto Sans JP"
EN = "Montserrat"
EN_COND = "Barlow Condensed"

PAGE_W = 13.333
PAGE_H = 7.5
MARGIN_X = 0.64
CONTENT_W = PAGE_W - 2 * MARGIN_X
TOP_Y = 0.5
FOOTER_Y = 7.06

BORDER_W = 1.25  # pt — the ONE border weight used everywhere

TOTAL_PAGES = 22
BRAND_LABEL = "JINJIB ― 高卒採用・進路選択マーケティング戦略提案"


def header(scene, kicker_en, kicker_jp, accent, title=None, label_color=None, tick_color=None):
    """Top eyebrow used on all interior content pages (03-21): a short accent
    tick + EN kicker + JP label, flush to the common top margin."""
    label_color = label_color or INK
    tick_color = tick_color or accent
    scene.rect(MARGIN_X, TOP_Y, 0.32, 0.07, fill=tick_color, name="Kicker Tick")
    scene.text(MARGIN_X + 0.42, TOP_Y - 0.1, 8.0, 0.34, [
        {"runs": [
            {"text": kicker_en + "  ", "size": 12.5, "bold": True, "color": accent, "font": EN, "spacing": 60},
            {"text": kicker_jp, "size": 11, "bold": True, "color": label_color, "font": JP, "spacing": 20},
        ]},
    ], anchor="m")


def footer(scene, page_no, accent, section=""):
    y = FOOTER_Y
    scene.line(MARGIN_X, y, PAGE_W - MARGIN_X, y, color=accent, width=1.0)
    scene.text(MARGIN_X, y + 0.04, 8.0, 0.3, [
        {"runs": [
            {"text": BRAND_LABEL + ("   /   " + section if section else ""),
             "size": 8.5, "bold": False, "color": INK, "font": JP, "spacing": 10},
        ]},
    ], anchor="m")
    scene.text(PAGE_W - MARGIN_X - 1.4, y + 0.02, 1.4, 0.32, [
        {"runs": [
            {"text": f"{page_no:02d}", "size": 13, "bold": True, "color": accent, "font": EN, "spacing": 20},
            {"text": f" / {TOTAL_PAGES:02d}", "size": 10, "bold": False, "color": INK, "font": EN},
        ], "align": "r"},
    ], anchor="m")


def base(scene):
    scene.rect(0, 0, PAGE_W, PAGE_H, fill=WHITE, name="BG")


def chip(scene, x, y, w, h, text, fill, text_color=WHITE, size=10.5, font=EN, bold=True, spacing=30):
    scene.round_rect(x, y, w, h, fill=fill, radius=0.5, name="Chip")
    scene.text(x, y, w, h, [
        {"runs": [{"text": text, "size": size, "bold": bold, "color": text_color, "font": font, "spacing": spacing}],
         "align": "c"},
    ], anchor="m")


def outline_chip(scene, x, y, w, h, text, accent, size=10.5, font=EN, spacing=30):
    scene.round_rect(x, y, w, h, fill=WHITE, line=accent, line_w=BORDER_W, radius=0.5, name="Chip")
    scene.text(x, y, w, h, [
        {"runs": [{"text": text, "size": size, "bold": True, "color": accent, "font": font, "spacing": spacing}],
         "align": "c"},
    ], anchor="m")


def photo_placeholder(scene, x, y, w, h, num, caption, accent):
    scene.rect(x, y, w, h, fill=WHITE, line=accent, line_w=BORDER_W, name=f"Photo Frame {num}")
    scene.line(x + 0.14, y + h - 0.44, x + w - 0.14, y + h - 0.44, color=accent, width=0.75)
    scene.text(x + 0.14, y + h * 0.30, w - 0.28, h * 0.36, [
        {"runs": [{"text": f"PHOTO {num:02d}", "size": min(20, h * 9), "bold": True, "color": accent, "font": EN, "spacing": 40}], "align": "c"},
    ], anchor="b")
    scene.text(x + 0.14, y + h - 0.40, w - 0.28, 0.32, [
        {"runs": [{"text": caption, "size": 9.5, "bold": False, "color": INK, "font": JP}], "align": "c"},
    ], anchor="m")


def phone_frame(scene, x, y, w, h, accent, num, app_label="TikTok", caption=""):
    scene.round_rect(x, y, w, h, fill=INK, line=accent, line_w=BORDER_W, radius=0.11, name=f"Phone {num}")
    bez = 0.075
    sx, sy, sw, sh = x + bez, y + bez * 1.7, w - bez * 2, h - bez * 3.0
    scene.rect(sx, sy, sw, sh, fill=WHITE, name="Screen")
    scene.round_rect(x + w / 2 - 0.17, y + bez * 0.55, 0.34, 0.045, fill=INK, radius=0.5, name="Notch")
    scene.round_rect(x + w / 2 - 0.16, y + h - bez * 1.1, 0.32, 0.03, fill=INK, radius=0.5, name="Home Indicator")
    scene.rect(sx, sy, sw, 0.16, fill=accent, name="App Bar")
    scene.text(sx, sy, sw, 0.16, [
        {"runs": [{"text": app_label.upper(), "size": 7.5, "bold": True, "color": WHITE, "font": EN, "spacing": 30}], "align": "c"},
    ], anchor="m")
    scene.text(sx + 0.06, sy + 0.16, sw - 0.12, sh - 0.16, [
        {"runs": [{"text": f"IMAGE {num:02d}", "size": min(16, sw * 8), "bold": True, "color": accent, "font": EN, "spacing": 20}]},
    ], align="c", anchor="m")
    if caption:
        scene.text(x, y + h + 0.05, w, 0.26, [
            {"runs": [{"text": caption, "size": 8.5, "bold": False, "color": INK, "font": JP}], "align": "c"},
        ], anchor="t")


def pc_frame(scene, x, y, w, h, accent, num, youtube=False, caption=""):
    scene.round_rect(x, y, w, h, fill=INK, line=accent, line_w=BORDER_W, radius=0.05, name=f"PC {num}")
    bez = 0.09
    sx, sy, sw, sh = x + bez, y + bez, w - bez * 2, h - bez * 2
    scene.rect(sx, sy, sw, sh, fill=WHITE, name="Screen")
    neck_w, neck_h = w * 0.16, 0.16
    scene.rect(x + w / 2 - neck_w / 2, y + h, neck_w, neck_h, fill=INK, name="Stand Neck")
    base_w = w * 0.46
    scene.round_rect(x + w / 2 - base_w / 2, y + h + neck_h, base_w, 0.06, fill=INK, radius=0.5, name="Stand Base")
    scene.text(sx + 0.08, sy + 0.06, sw - 0.16, sh - 0.16, [
        {"runs": [{"text": f"IMAGE {num:02d}", "size": min(18, sw * 3.2), "bold": True, "color": accent, "font": EN, "spacing": 20}]},
    ], align="c", anchor="m" if not youtube else "t")
    if youtube:
        pw, ph = 0.62, 0.42
        px_, py_ = sx + sw / 2 - pw / 2, sy + sh / 2 - ph / 2
        scene.round_rect(px_, py_, pw, ph, fill=accent, radius=0.28, name="Play Button")
        scene.preset("triangle", px_ + pw * 0.36, py_ + ph * 0.28, pw * 0.32, ph * 0.44,
                     fill=WHITE, rot=90, name="Play Triangle")
    if caption:
        scene.text(x, y + h + neck_h + 0.14, w, 0.26, [
            {"runs": [{"text": caption, "size": 8.5, "bold": False, "color": INK, "font": JP}], "align": "c"},
        ], anchor="t")


def browser_frame(scene, x, y, w, h, accent, num, url="jinjib.co.jp/18-mirai", caption=""):
    scene.round_rect(x, y, w, h, fill=WHITE, line=accent, line_w=BORDER_W, radius=0.035, name=f"Browser {num}")
    bar_h = 0.30
    scene.rect(x, y, w, bar_h, fill=INK, name="Browser Bar")
    for i in range(3):
        scene.oval(x + 0.12 + i * 0.16, y + bar_h / 2 - 0.035, 0.07, 0.07,
                   fill=[accent, WHITE, WHITE][i], name=f"Dot{i}")
    scene.round_rect(x + 0.62, y + 0.06, w - 0.8, bar_h - 0.12, fill=WHITE, radius=0.5, name="URL Bar")
    scene.text(x + 0.7, y + 0.06, w - 1.0, bar_h - 0.12, [
        {"runs": [{"text": url, "size": 8, "bold": False, "color": INK, "font": EN}]},
    ], anchor="m")
    sx, sy, sw, sh = x + 0.06, y + bar_h + 0.06, w - 0.12, h - bar_h - 0.12
    scene.rect(sx, sy, sw, sh, fill=PAPER, name="Content")
    scene.text(sx, sy, sw, sh, [
        {"runs": [{"text": f"IMAGE {num:02d}", "size": min(20, sw * 2.6), "bold": True, "color": accent, "font": EN, "spacing": 20}]},
    ], align="c", anchor="m")
    if caption:
        scene.text(x, y + h + 0.08, w, 0.26, [
            {"runs": [{"text": caption, "size": 8.5, "bold": False, "color": INK, "font": JP}], "align": "c"},
        ], anchor="t")


def h1(scene, x, y, w, h, lines, color=INK, size=40, align="l", anchor="t", line_spacing=112):
    paras = [{"align": align, "line_spacing": line_spacing,
              "runs": [{"text": ln, "size": size, "bold": True, "color": color, "font": JP}]} for ln in lines]
    scene.text(x, y, w, h, paras, anchor=anchor)


def body(scene, x, y, w, h, text, size=12.5, color=INK, align="l", anchor="t", line_spacing=150, bold=False):
    lines = text.split("\n")
    paras = [{"align": align, "line_spacing": line_spacing,
              "runs": [{"text": ln, "size": size, "bold": bold, "color": color, "font": JP}]} for ln in lines]
    scene.text(x, y, w, h, paras, anchor=anchor)


def rule(scene, x, y, w, accent, width=BORDER_W):
    scene.line(x, y, x + w, y, color=accent, width=width)
