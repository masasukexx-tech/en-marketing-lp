"""HTML/CSS backend for scene commands (QA preview + PDF via headless Chromium)."""
import html as htmlmod

PX_PER_IN = 144  # -> 1920x1080 canvas for a 13.333x7.5in slide
SLIDE_W_IN = 13.333
SLIDE_H_IN = 7.5
SLIDE_W_PX = round(SLIDE_W_IN * PX_PER_IN)
SLIDE_H_PX = round(SLIDE_H_IN * PX_PER_IN)

FONT_MAP = {
    "Noto Sans JP": "'IPAGothic', 'Noto Sans JP', sans-serif",
    "Montserrat": "'DejaVu Sans', 'Liberation Sans', Arial, sans-serif",
    "Poppins": "'DejaVu Sans', 'Liberation Sans', Arial, sans-serif",
    "Barlow Condensed": "'DejaVu Sans Condensed', 'DejaVu Sans', Arial, sans-serif",
}


def _font(name):
    return FONT_MAP.get(name, "'IPAGothic', 'DejaVu Sans', sans-serif")


def px(inches):
    return inches * PX_PER_IN


def _c(hexcolor):
    return f"#{hexcolor}" if hexcolor else "transparent"


ALIGN_CSS = {"l": "left", "left": "left", "c": "center", "center": "center",
             "r": "right", "right": "right", "j": "justify", "justify": "justify"}
ANCHOR_CSS = {"t": "flex-start", "top": "flex-start", "m": "center",
              "middle": "center", "b": "flex-end", "bottom": "flex-end"}


def _shadow_css(shadow):
    return "box-shadow:0 10px 26px rgba(26,26,26,0.14);" if shadow else ""


def op_to_html(kind, kw):
    if kind == "rect":
        x, y, w, h = kw["x"], kw["y"], kw["w"], kw["h"]
        border = f'{kw["line_w"]}pt solid {_c(kw["line"])}' if kw.get("line") else "none"
        style = (
            f'position:absolute;left:{px(x):.2f}px;top:{px(y):.2f}px;'
            f'width:{px(w):.2f}px;height:{px(h):.2f}px;'
            f'background:{_c(kw["fill"])};border:{border};box-sizing:border-box;'
            f'{_shadow_css(kw.get("shadow"))}'
        )
        if kw.get("rot"):
            style += f'transform:rotate({kw["rot"]}deg);'
        return f'<div style="{style}"></div>'

    if kind == "round_rect":
        x, y, w, h = kw["x"], kw["y"], kw["w"], kw["h"]
        border = f'{kw["line_w"]}pt solid {_c(kw["line"])}' if kw.get("line") else "none"
        radius_px = px(min(w, h)) * min(kw.get("radius", 0.08), 0.5)
        style = (
            f'position:absolute;left:{px(x):.2f}px;top:{px(y):.2f}px;'
            f'width:{px(w):.2f}px;height:{px(h):.2f}px;'
            f'background:{_c(kw["fill"])};border:{border};box-sizing:border-box;'
            f'border-radius:{radius_px:.1f}px;'
        )
        return f'<div style="{style}"></div>'

    if kind == "oval":
        x, y, w, h = kw["x"], kw["y"], kw["w"], kw["h"]
        border = f'{kw["line_w"]}pt solid {_c(kw["line"])}' if kw.get("line") else "none"
        style = (
            f'position:absolute;left:{px(x):.2f}px;top:{px(y):.2f}px;'
            f'width:{px(w):.2f}px;height:{px(h):.2f}px;'
            f'background:{_c(kw["fill"])};border:{border};border-radius:50%;box-sizing:border-box;'
        )
        return f'<div style="{style}"></div>'

    if kind == "preset":
        # Approximate arrow/chevron presets as simple boxes; used mainly for roadmap
        x, y, w, h = kw["x"], kw["y"], kw["w"], kw["h"]
        border = f'{kw["line_w"]}pt solid {_c(kw["line"])}' if kw.get("line") else "none"
        clip = ""
        prst = kw.get("prst")
        if prst == "chevron":
            clip = 'clip-path:polygon(0% 0%, 82% 0%, 100% 50%, 82% 100%, 0% 100%, 13% 50%);'
        elif prst == "homePlate":
            clip = 'clip-path:polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%);'
        elif prst == "triangle":
            clip = 'clip-path:polygon(50% 0%, 0% 100%, 100% 100%);'
        style = (
            f'position:absolute;left:{px(x):.2f}px;top:{px(y):.2f}px;'
            f'width:{px(w):.2f}px;height:{px(h):.2f}px;'
            f'background:{_c(kw["fill"])};border:{border};box-sizing:border-box;{clip}'
        )
        return f'<div style="{style}"></div>'

    if kind == "line":
        x1, y1, x2, y2 = kw["x1"], kw["y1"], kw["x2"], kw["y2"]
        pad_in = 0.12
        minx, maxx = min(x1, x2) - pad_in, max(x1, x2) + pad_in
        miny, maxy = min(y1, y2) - pad_in, max(y1, y2) + pad_in
        w = maxx - minx
        h = maxy - miny
        svg_w, svg_h = px(w), px(h)
        lx1, ly1 = px(x1 - minx), px(y1 - miny)
        lx2, ly2 = px(x2 - minx), px(y2 - miny)
        color = _c(kw["color"])
        width_px = kw["width"] * (PX_PER_IN / 72.0)
        dash = ""
        if kw.get("dash") == "dash":
            dash = f'stroke-dasharray="{width_px*3:.1f},{width_px*2.2:.1f}"'
        marker_defs = ""
        marker_attr_end = ""
        marker_attr_start = ""
        if kw.get("arrow_end"):
            marker_defs += (
                f'<marker id="arrEnd{id(kw)}" markerWidth="8" markerHeight="8" '
                f'refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="{color}"/></marker>'
            )
            marker_attr_end = f'marker-end="url(#arrEnd{id(kw)})"'
        if kw.get("arrow_start"):
            marker_defs += (
                f'<marker id="arrStart{id(kw)}" markerWidth="8" markerHeight="8" '
                f'refX="2" refY="3" orient="auto-start-reverse"><path d="M0,0 L6,3 L0,6 Z" fill="{color}"/></marker>'
            )
            marker_attr_start = f'marker-start="url(#arrStart{id(kw)})"'
        style = f'position:absolute;left:{px(minx):.2f}px;top:{px(miny):.2f}px;'
        return (
            f'<svg style="{style}" width="{svg_w:.2f}" height="{svg_h:.2f}">'
            f'<defs>{marker_defs}</defs>'
            f'<line x1="{lx1:.2f}" y1="{ly1:.2f}" x2="{lx2:.2f}" y2="{ly2:.2f}" '
            f'stroke="{color}" stroke-width="{width_px:.2f}" stroke-linecap="round" '
            f'{dash} {marker_attr_end} {marker_attr_start}/></svg>'
        )

    if kind == "table":
        x, y, w, h = kw["x"], kw["y"], kw["w"], kw["h"]
        col_widths = kw["col_widths"]
        rows = kw["rows"]
        n_rows = len(rows)
        row_heights = kw.get("row_heights") or [h / n_rows] * n_rows
        total_w = sum(col_widths)
        border = f'{kw["border_w"]}pt solid {_c(kw["border_color"])}'
        rows_html = []
        for ri, row in enumerate(rows):
            is_header = (ri == 0)
            cells_html = []
            for ci, cell in enumerate(row):
                fill = cell.get("fill", kw["header_fill"] if is_header else kw["body_fill"])
                color = cell.get("color", kw["header_text_color"] if is_header else kw["body_text_color"])
                bold = cell.get("bold", is_header)
                align = ALIGN_CSS.get(cell.get("align", "l"), "left")
                size = cell.get("size", 13)
                cw_pct = col_widths[ci] / total_w * 100
                cells_html.append(
                    f'<td style="width:{cw_pct:.3f}%;border:{border};background:{_c(fill)};'
                    f'color:{_c(color)};font-weight:{700 if bold else 400};text-align:{align};'
                    f'font-family:{_font(kw.get("font","Noto Sans JP"))};font-size:{size}pt;'
                    f'padding:6px 10px;vertical-align:middle;box-sizing:border-box;">'
                    f'{htmlmod.escape(cell.get("text",""))}</td>'
                )
            rh_pct = row_heights[ri] / h * 100
            rows_html.append(f'<tr style="height:{rh_pct:.3f}%;">{"".join(cells_html)}</tr>')
        style = (
            f'position:absolute;left:{px(x):.2f}px;top:{px(y):.2f}px;'
            f'width:{px(w):.2f}px;height:{px(h):.2f}px;border-collapse:collapse;table-layout:fixed;'
        )
        return f'<table style="{style}">{"".join(rows_html)}</table>'

    if kind == "text":
        x, y, w, h = kw["x"], kw["y"], kw["w"], kw["h"]
        justify = ANCHOR_CSS.get(kw.get("anchor", "t"), "flex-start")
        wrap = "normal" if kw.get("wrap", True) else "nowrap"
        paras_html = []
        for p in kw["paragraphs"]:
            align = ALIGN_CSS.get(p.get("align", "l"), "left")
            ls = p.get("line_spacing")
            ls_css = f'line-height:{ls/100:.2f};' if ls else ""
            sb = p.get("space_before")
            sb_css = f'margin-top:{sb}pt;' if sb else "margin-top:0;"
            sa = p.get("space_after")
            sa_css = f'margin-bottom:{sa}pt;' if sa else "margin-bottom:0;"
            runs_html = []
            for r in p.get("runs", []):
                weight = 700 if r.get("bold") else 400
                style_i = "italic" if r.get("italic") else "normal"
                sp = r.get("spacing")
                sp_css = f'letter-spacing:{sp/100:.2f}pt;' if sp else ""
                txt = htmlmod.escape(r.get("text", "")).replace("\n", "<br/>")
                runs_html.append(
                    f'<span style="font-family:{_font(r.get("font","Noto Sans JP"))};'
                    f'font-size:{r.get("size",18)}pt;font-weight:{weight};font-style:{style_i};'
                    f'color:{_c(r.get("color","1A1A1A"))};{sp_css}">{txt}</span>'
                )
            if not runs_html:
                runs_html = ["&nbsp;"]
            paras_html.append(
                f'<div style="text-align:{align};{ls_css}{sb_css}{sa_css}">{"".join(runs_html)}</div>'
            )
        style = (
            f'position:absolute;left:{px(x):.2f}px;top:{px(y):.2f}px;'
            f'width:{px(w):.2f}px;height:{px(h):.2f}px;display:flex;flex-direction:column;'
            f'justify-content:{justify};white-space:{wrap};overflow:hidden;'
        )
        return f'<div style="{style}">{"".join(paras_html)}</div>'

    return ""


def scene_to_html(scene, page_number=None):
    body = "".join(op_to_html(kind, kw) for kind, kw in scene.ops)
    return (
        f'<div class="slide" style="position:relative;width:{SLIDE_W_PX}px;'
        f'height:{SLIDE_H_PX}px;background:#FFFFFF;overflow:hidden;">{body}</div>'
    )


PAGE_CSS = f"""
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:#e9e9e9; }}
.page {{ width:{SLIDE_W_PX}px; height:{SLIDE_H_PX}px; overflow:hidden;
  page-break-after: always; }}
@page {{ size: {SLIDE_W_PX}px {SLIDE_H_PX}px; margin:0; }}
"""


def build_full_html(scenes):
    pages = []
    for sc in scenes:
        pages.append(f'<div class="page">{scene_to_html(sc)}</div>')
    return f"""<!doctype html><html><head><meta charset="utf-8">
<style>{PAGE_CSS}</style></head><body>{''.join(pages)}</body></html>"""


def build_single_html(scene):
    return f"""<!doctype html><html><head><meta charset="utf-8">
<style>{PAGE_CSS}</style></head><body>{scene_to_html(scene)}</body></html>"""
