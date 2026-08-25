"""Reusable composite content blocks built on top of design.py primitives,
shared across the TikTok / Instagram / YouTube case-study pages so each of
the 22 slides can vary its overall layout while keeping the same visual
grammar (thin borders, one accent per page, consistent type rules)."""
import design as d


def subhead(scene, x, y, w, label_en, label_jp, accent):
    """LEVEL 3 subhead: a short EN tag plus a bold JP label sized well clear
    of body copy (SIZE_SUBHEAD vs SIZE_BODY) so the hierarchy reads at a glance."""
    scene.rect(x, y + 0.03, 0.2, 0.2, fill=accent, name="Subhead Mark")
    scene.text(x + 0.32, y - 0.08, w - 0.32, 0.4, [
        {"runs": [
            {"text": label_en + "   ", "size": 10, "bold": True, "color": accent, "font": d.EN, "spacing": 40},
            {"text": label_jp, "size": d.SIZE_SUBHEAD, "bold": True, "color": d.INK, "font": d.JP},
        ]},
    ], anchor="m")


def value_contrast(scene, x, y, w, h, left_text, right_text, accent, neg_label="NOT", pos_label="BUT"):
    """A ≠ B style contrast bar (e.g. SCHOOL VALUE ≠ LIFE VALUE)."""
    seg = (w - 0.55) / 2
    d.chip(scene, x, y, seg, h, left_text, d.INK, size=12, spacing=20)
    d.chip(scene, x + seg + 0.05, y, 0.45, h, "≠", accent, size=15, spacing=0)
    d.chip(scene, x + seg + 0.55, y, seg, h, right_text, accent, size=12, spacing=20)


def value_arrow(scene, x, y, w, h, from_text, to_text, accent):
    seg = (w - 0.6) / 2
    d.outline_chip(scene, x, y, seg, h, from_text, d.INK, size=11.5, font=d.JP, spacing=0)
    scene.line(x + seg + 0.08, y + h / 2, x + seg + 0.5, y + h / 2, color=accent, width=1.75, arrow_end=True)
    d.chip(scene, x + seg + 0.6, y, seg, h, to_text, accent, size=11.5, font=d.JP, spacing=0)


def photo_row(scene, x, y, w, h, items, accent):
    """items: list of (num, caption). Lays photo placeholders evenly across w."""
    n = len(items)
    gap = 0.18
    pw = (w - gap * (n - 1)) / n
    for i, (num, caption) in enumerate(items):
        d.photo_placeholder(scene, x + i * (pw + gap), y, pw, h, num, caption, accent)


def hero_photos(scene, x, y, w, h, items, accent):
    """事例型: one dominant large photo instead of a row of equal small tiles.
    1 item -> full-bleed single hero. 2 -> side-by-side big pair.
    3 -> one large hero (58%) + two stacked support shots (42%)."""
    n = len(items)
    gap = 0.2
    if n == 1:
        num, cap = items[0]
        d.photo_placeholder(scene, x, y, w, h, num, cap, accent, big=True)
        return
    if n == 2:
        pw = (w - gap) / 2
        for i, (num, cap) in enumerate(items):
            d.photo_placeholder(scene, x + i * (pw + gap), y, pw, h, num, cap, accent, big=True)
        return
    hero_w = w * 0.58 - gap / 2
    side_w = w - gap - hero_w
    num0, cap0 = items[0]
    d.photo_placeholder(scene, x, y, hero_w, h, num0, cap0, accent, big=True)
    side_h = (h - gap) / 2
    for i, (num, cap) in enumerate(items[1:3]):
        d.photo_placeholder(scene, x + hero_w + gap, y + i * (side_h + gap), side_w, side_h, num, cap, accent)


def storyboard_4(scene, x, y, w, phone_h, steps, accent, images_start):
    """4-panel HOOK/CONFLICT/TURN/AFTER storyboard using phone frames.
    phone_h fixes the phone height so callers control total footprint exactly."""
    n = len(steps)
    gap = 0.22
    cw = (w - gap * (n - 1)) / n
    phone_w = phone_h / 2.04
    for i, label in enumerate(steps):
        cx = x + i * (cw + gap)
        d.chip(scene, cx, y, cw, 0.32, f"{i+1:02d}  {label}", accent, size=10, spacing=20)
        d.phone_frame(scene, cx + (cw - phone_w) / 2, y + 0.46, phone_w, phone_h, accent,
                      images_start + i, app_label="TikTok")
    return y + 0.46 + phone_h


def pairing_chips(scene, x, y, w, pairs, accent, row_h=0.42, gap=0.14):
    for i, (a, b) in enumerate(pairs):
        yy = y + i * (row_h + gap)
        seg = (w - 0.5) / 2
        d.outline_chip(scene, x, yy, seg, row_h, a, d.INK, size=11, spacing=0)
        scene.text(x + seg, yy, 0.5, row_h, [
            {"align": "c", "runs": [{"text": "×", "size": 14, "bold": True, "color": accent, "font": d.EN}]},
        ], anchor="m")
        d.chip(scene, x + seg + 0.5, yy, seg, row_h, b, accent, size=11, spacing=0)


def quote_list(scene, x, y, w, quotes, accent, line_h=0.62):
    for i, q in enumerate(quotes):
        yy = y + i * line_h
        scene.rect(x, yy + 0.06, 0.06, line_h - 0.2, fill=accent, name="Quote Mark")
        d.body(scene, x + 0.2, yy, w - 0.2, line_h, q, size=11.5, line_spacing=128)


def process_chevron(scene, x, y, w, h, steps, accent):
    n = len(steps)
    gap = 0.09
    cw = (w - gap * (n - 1)) / n
    for i, label in enumerate(steps):
        cx = x + i * (cw + gap)
        fill = accent if i == n - 1 else d.INK
        scene.preset("chevron", cx, y, cw, h, fill=fill, adj={"adj1": "50000", "adj2": "45000"}, name=f"Step{i}")
        scene.text(cx, y, cw, h, [
            {"runs": [{"text": label, "size": 11, "bold": True, "color": d.WHITE, "font": d.JP}], "align": "c"},
        ], anchor="m")


def section_divider(scene, x, y, w, num_label, title, accent):
    d.chip(scene, x, y, 1.5, 0.42, num_label, accent, size=13, spacing=20)
    scene.text(x + 1.66, y - 0.02, w - 1.7, 0.46, [
        {"runs": [{"text": title, "size": 16, "bold": True, "color": d.INK, "font": d.JP}]},
    ], anchor="m")
