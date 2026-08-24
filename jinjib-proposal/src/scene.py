"""
Shared "scene" layer: every slide is authored ONCE as a list of drawing
commands (rect / round_rect / oval / line / text / preset). Two backends
consume the exact same command list:

  - render_pptx.py  -> replays commands into pptx_builder to produce the
                        real, fully editable .pptx (native shapes/text).
  - render_html.py  -> converts commands into absolutely-positioned HTML/CSS
                        for headless-Chromium screenshots (PNG) and PDF
                        printing, used purely for QA preview / final PDF.

This guarantees the PDF/PNG QA preview is pixel-faithful to the editable
pptx content, since both are generated from one source of truth.
"""


class SceneSlide:
    def __init__(self, name=""):
        self.name = name
        self.ops = []

    def rect(self, x, y, w, h, fill=None, line=None, line_w=1.0, name="Rect",
             rot=0, dash=None, shadow=False):
        self.ops.append(("rect", dict(x=x, y=y, w=w, h=h, fill=fill, line=line,
                                       line_w=line_w, name=name, rot=rot,
                                       dash=dash, shadow=shadow)))

    def round_rect(self, x, y, w, h, fill=None, line=None, line_w=1.0,
                    radius=0.08, name="RoundRect", rot=0):
        self.ops.append(("round_rect", dict(x=x, y=y, w=w, h=h, fill=fill,
                                             line=line, line_w=line_w,
                                             radius=radius, name=name, rot=rot)))

    def oval(self, x, y, w, h, fill=None, line=None, line_w=1.0, name="Oval"):
        self.ops.append(("oval", dict(x=x, y=y, w=w, h=h, fill=fill, line=line,
                                       line_w=line_w, name=name)))

    def preset(self, prst, x, y, w, h, fill=None, line=None, line_w=1.0,
               name="Shape", adj=None, rot=0, flipH=False):
        self.ops.append(("preset", dict(prst=prst, x=x, y=y, w=w, h=h, fill=fill,
                                         line=line, line_w=line_w, name=name,
                                         adj=adj, rot=rot, flipH=flipH)))

    def line(self, x1, y1, x2, y2, color="FF6A00", width=1.25, dash=None,
             arrow_end=False, arrow_start=False, name="Line"):
        self.ops.append(("line", dict(x1=x1, y1=y1, x2=x2, y2=y2, color=color,
                                       width=width, dash=dash,
                                       arrow_end=arrow_end, arrow_start=arrow_start,
                                       name=name)))

    def table(self, x, y, w, h, col_widths, rows, row_heights=None,
              border_color="FF6A00", border_w=1.0, header_fill="1A1A1A",
              header_text_color="FFFFFF", body_fill="FFFFFF",
              body_text_color="1A1A1A", font="Noto Sans JP", name="Table"):
        self.ops.append(("table", dict(x=x, y=y, w=w, h=h, col_widths=col_widths,
                                        rows=[[dict(c) for c in row] for row in rows],
                                        row_heights=row_heights, border_color=border_color,
                                        border_w=border_w, header_fill=header_fill,
                                        header_text_color=header_text_color, body_fill=body_fill,
                                        body_text_color=body_text_color, font=font, name=name)))

    def text(self, x, y, w, h, paragraphs, align="l", anchor="t", wrap=True,
             name="TextBox", auto_shrink=False, rot=0):
        # deep-ish copy so callers can mutate/reuse dicts safely
        paras = [dict(p) for p in paragraphs]
        for p in paras:
            p["runs"] = [dict(r) for r in p.get("runs", [])]
        self.ops.append(("text", dict(x=x, y=y, w=w, h=h, paragraphs=paras,
                                       align=align, anchor=anchor, wrap=wrap,
                                       name=name, auto_shrink=auto_shrink, rot=rot)))


def replay_to_pptx(scene: SceneSlide, sb):
    for kind, kw in scene.ops:
        getattr(sb, kind)(**kw)
