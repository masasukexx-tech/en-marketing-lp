"""
Minimal, dependency-free OOXML .pptx builder.

Built from scratch with only the Python standard library because this
environment has no network access to npm/pip registries (PptxGenJS /
python-pptx cannot be installed). Produces a fully valid, fully editable
PowerPoint file: every text box, rectangle, line, and connector below is a
native DrawingML shape object (not a flattened image), so everything stays
editable after import into Canva or PowerPoint.
"""
import re
import zipfile
from xml.sax.saxutils import escape as xml_escape

EMU_PER_INCH = 914400


def IN(v):
    return int(round(v * EMU_PER_INCH))


def PT(v):
    return int(round(v * 100))


def esc(s):
    return xml_escape(str(s), {'"': "&quot;", "'": "&apos;"})


SLIDE_W_IN = 13.333
SLIDE_H_IN = 7.5


class Shape:
    """Base wrapper that just holds pre-built XML for a single shape tree."""

    def __init__(self, xml):
        self.xml = xml


def _xfrm(x, y, w, h, rot=0, flipH=False, flipV=False):
    attrs = ""
    if rot:
        attrs += f' rot="{int(round(rot * 60000))}"'
    if flipH:
        attrs += ' flipH="1"'
    if flipV:
        attrs += ' flipV="1"'
    return (
        f'<a:xfrm{attrs}>'
        f'<a:off x="{IN(x)}" y="{IN(y)}"/>'
        f'<a:ext cx="{IN(w)}" cy="{IN(h)}"/>'
        f'</a:xfrm>'
    )


def _solid(color):
    if color is None:
        return "<a:noFill/>"
    return f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'


def _line(color, width_pt, dash=None, cap="flat"):
    if color is None:
        return "<a:ln><a:noFill/></a:ln>"
    dash_xml = f'<a:prstDash val="{dash}"/>' if dash else ""
    return (
        f'<a:ln w="{int(round(width_pt * 12700))}" cap="{cap}">'
        f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>{dash_xml}'
        f'<a:round/></a:ln>'
    )


def _run_props(size=18, bold=False, italic=False, color="1A1A1A",
                font="Noto Sans JP", spacing=None):
    b = ' b="1"' if bold else ""
    i = ' i="1"' if italic else ""
    sp = f' spc="{int(spacing)}"' if spacing is not None else ""
    return (
        f'<a:rPr lang="ja-JP" sz="{int(round(size * 100))}"{b}{i}{sp} dirty="0">'
        f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
        f'<a:latin typeface="{esc(font)}"/><a:ea typeface="{esc(font)}"/>'
        f'<a:cs typeface="{esc(font)}"/>'
        f'</a:rPr>'
    )


ALIGN_MAP = {"l": "l", "left": "l", "c": "ctr", "center": "ctr",
             "r": "r", "right": "r", "j": "just", "justify": "just"}
ANCHOR_MAP = {"t": "t", "top": "t", "m": "ctr", "middle": "ctr",
              "b": "b", "bottom": "b"}


def text_body(paragraphs, wrap=True, anchor="t", auto_shrink=False,
              lIns=0.05, rIns=0.05, tIns=0.03, bIns=0.03):
    """paragraphs: list of dicts:
      {align, line_spacing(pct,optional), space_before(pt,optional),
       runs:[{text,size,bold,italic,color,font,spacing}]}
    """
    body_pr_extra = '<a:normAutofit/>' if auto_shrink else ''
    p_xml = []
    for p in paragraphs:
        align = ALIGN_MAP.get(p.get("align", "l"), "l")
        ppr_bits = [f'algn="{align}"']
        ppr_children = ""
        if p.get("line_spacing"):
            ppr_children += (f'<a:lnSpc><a:spcPct val="{int(p["line_spacing"] * 1000)}"/>'
                              f'</a:lnSpc>')
        if p.get("space_before") is not None:
            ppr_children += (f'<a:spcBef><a:spcPts val="{int(p["space_before"] * 100)}"/>'
                              f'</a:spcBef>')
        if p.get("space_after") is not None:
            ppr_children += (f'<a:spcAft><a:spcPts val="{int(p["space_after"] * 100)}"/>'
                              f'</a:spcAft>')
        runs_xml = ""
        for r in p.get("runs", []):
            t = esc(r.get("text", ""))
            rpr = _run_props(
                size=r.get("size", 18), bold=r.get("bold", False),
                italic=r.get("italic", False), color=r.get("color", "1A1A1A"),
                font=r.get("font", "Noto Sans JP"), spacing=r.get("spacing"),
            )
            runs_xml += f'<a:r>{rpr}<a:t>{t}</a:t></a:r>'
        if not runs_xml:
            runs_xml = f'<a:endParaRPr lang="ja-JP" sz="1800"/>'
        p_xml.append(f'<a:pPr {" ".join(ppr_bits)}>{ppr_children}</a:pPr>{runs_xml}')
    body = "".join(f"<a:p>{p}</a:p>" for p in p_xml)
    wrap_attr = "square" if wrap else "none"
    anchor_v = ANCHOR_MAP.get(anchor, "t")
    return (
        f'<a:bodyPr wrap="{wrap_attr}" anchor="{anchor_v}" '
        f'lIns="{IN(lIns)}" rIns="{IN(rIns)}" tIns="{IN(tIns)}" bIns="{IN(bIns)}">'
        f'{body_pr_extra}</a:bodyPr><a:lstStyle/>{body}'
    )


class SlideBuilder:
    def __init__(self, index):
        self.index = index
        self._id = 1
        self.shapes_xml = []
        self.rels = []  # (rId, type, target) reserved for future (hyperlinks/images)

    def _next_id(self):
        self._id += 1
        return self._id

    # ---------- primitives ----------

    def rect(self, x, y, w, h, fill=None, line=None, line_w=1.0, name="Rect",
             rot=0, dash=None, shadow=False):
        sid = self._next_id()
        geom = '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
        eff = '<a:effectLst><a:outerShdw blurRad="90000" dist="30000" dir="5400000" rotWithShape="0"><a:srgbClr val="1A1A1A"><a:alpha val="14000"/></a:srgbClr></a:outerShdw></a:effectLst>' if shadow else ''
        xml = (
            f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="{esc(name)}"/>'
            f'<p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
            f'<p:spPr>{_xfrm(x, y, w, h, rot=rot)}{geom}{_solid(fill)}'
            f'{_line(line, line_w, dash=dash)}{eff}</p:spPr>'
            f'<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>'
        )
        self.shapes_xml.append(xml)

    def round_rect(self, x, y, w, h, fill=None, line=None, line_w=1.0,
                    radius=0.08, name="RoundRect", rot=0):
        sid = self._next_id()
        adj = max(0, min(50000, int(radius * 100000)))
        geom = f'<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val {adj}"/></a:avLst></a:prstGeom>'
        xml = (
            f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="{esc(name)}"/>'
            f'<p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
            f'<p:spPr>{_xfrm(x, y, w, h, rot=rot)}{geom}{_solid(fill)}'
            f'{_line(line, line_w)}</p:spPr>'
            f'<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>'
        )
        self.shapes_xml.append(xml)

    def oval(self, x, y, w, h, fill=None, line=None, line_w=1.0, name="Oval"):
        sid = self._next_id()
        geom = '<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom>'
        xml = (
            f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="{esc(name)}"/>'
            f'<p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
            f'<p:spPr>{_xfrm(x, y, w, h)}{geom}{_solid(fill)}{_line(line, line_w)}</p:spPr>'
            f'<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>'
        )
        self.shapes_xml.append(xml)

    def preset(self, prst, x, y, w, h, fill=None, line=None, line_w=1.0,
               name="Shape", adj=None, rot=0, flipH=False):
        sid = self._next_id()
        avlst = ""
        if adj:
            avlst = "".join(f'<a:gd name="{k}" fmla="val {v}"/>' for k, v in adj.items())
        geom = f'<a:prstGeom prst="{prst}"><a:avLst>{avlst}</a:avLst></a:prstGeom>'
        xml = (
            f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="{esc(name)}"/>'
            f'<p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
            f'<p:spPr>{_xfrm(x, y, w, h, rot=rot, flipH=flipH)}{geom}{_solid(fill)}'
            f'{_line(line, line_w)}</p:spPr>'
            f'<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>'
        )
        self.shapes_xml.append(xml)

    def line(self, x1, y1, x2, y2, color="FF6A00", width=1.25, dash=None,
              arrow_end=False, arrow_start=False, name="Line"):
        sid = self._next_id()
        x = min(x1, x2)
        y = min(y1, y2)
        w = abs(x2 - x1)
        h = abs(y2 - y1)
        flipH = (x2 < x1)
        flipV = (y2 < y1)
        head = '<a:headEnd type="none"/>'
        tail = '<a:tailEnd type="none"/>'
        if arrow_end:
            tail = '<a:tailEnd type="triangle" w="med" len="med"/>'
        if arrow_start:
            head = '<a:headEnd type="triangle" w="med" len="med"/>'
        dash_xml = f'<a:prstDash val="{dash}"/>' if dash else ""
        ln = (
            f'<a:ln w="{int(round(width * 12700))}" cap="rnd">'
            f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>{dash_xml}'
            f'{head}{tail}</a:ln>'
        )
        xml = (
            f'<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="{sid}" name="{esc(name)}"/>'
            f'<p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr>'
            f'<p:spPr>{_xfrm(x, y, max(w, 0.001), max(h, 0.001), flipH=flipH, flipV=flipV)}'
            f'<a:prstGeom prst="line"><a:avLst/></a:prstGeom>{ln}</p:spPr></p:cxnSp>'
        )
        self.shapes_xml.append(xml)

    def text(self, x, y, w, h, paragraphs, align="l", anchor="t", wrap=True,
              name="TextBox", auto_shrink=False, rot=0):
        sid = self._next_id()
        for p in paragraphs:
            p.setdefault("align", align)
        body = text_body(paragraphs, wrap=wrap, anchor=anchor, auto_shrink=auto_shrink)
        xml = (
            f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="{esc(name)}"/>'
            f'<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
            f'<p:spPr>{_xfrm(x, y, w, h, rot=rot)}'
            f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/>'
            f'<a:ln><a:noFill/></a:ln></p:spPr>'
            f'<p:txBody>{body}</p:txBody></p:sp>'
        )
        self.shapes_xml.append(xml)

    def raw(self, xml):
        self.shapes_xml.append(xml)

    def table(self, x, y, w, h, col_widths, rows, row_heights=None,
              border_color="FF6A00", border_w=1.0, header_fill="1A1A1A",
              header_text_color="FFFFFF", body_fill="FFFFFF",
              body_text_color="1A1A1A", font="Noto Sans JP", name="Table"):
        """rows: list[list[dict(text, size, bold, align, color, fill)]]"""
        sid = self._next_id()
        n_rows = len(rows)
        if row_heights is None:
            row_heights = [h / n_rows] * n_rows
        grid = "".join(f'<a:gridCol w="{IN(cw)}"/>' for cw in col_widths)
        ln = (f'<a:ln w="{int(round(border_w * 12700))}" cap="flat">'
              f'<a:solidFill><a:srgbClr val="{border_color}"/></a:solidFill></a:ln>')
        tr_xml = []
        for ri, row in enumerate(rows):
            is_header = (ri == 0)
            tc_xml = []
            for cell in row:
                text = cell.get("text", "")
                size = cell.get("size", 13)
                bold = cell.get("bold", is_header)
                align = cell.get("align", "l")
                color = cell.get("color", header_text_color if is_header else body_text_color)
                fill = cell.get("fill", header_fill if is_header else body_fill)
                anchor = cell.get("anchor", "ctr")
                para = {"align": align, "runs": [{"text": text, "size": size, "bold": bold,
                                                    "color": color, "font": font}]}
                body = text_body([para], anchor="middle" if anchor == "ctr" else anchor,
                                  lIns=0.08, rIns=0.08, tIns=0.04, bIns=0.04)
                tcPr = (f'<a:tcPr marL="0" marR="0" marT="0" marB="0" anchor="{anchor}">'
                        f'<a:lnL>{ln}</a:lnL><a:lnR>{ln}</a:lnR><a:lnT>{ln}</a:lnT><a:lnB>{ln}</a:lnB>'
                        f'<a:solidFill><a:srgbClr val="{fill}"/></a:solidFill></a:tcPr>')
                tc_xml.append(f'<a:tc><a:txBody>{body}</a:txBody>{tcPr}</a:tc>')
            tr_xml.append(f'<a:tr h="{IN(row_heights[ri])}">{"".join(tc_xml)}</a:tr>')
        xml = (
            f'<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="{sid}" name="{esc(name)}"/>'
            f'<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr>'
            f'<p:nvPr/></p:nvGraphicFramePr>'
            f'<p:xfrm><a:off x="{IN(x)}" y="{IN(y)}"/><a:ext cx="{IN(w)}" cy="{IN(h)}"/></p:xfrm>'
            f'<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">'
            f'<a:tbl><a:tblPr firstRow="0" bandRow="0"/>'
            f'<a:tblGrid>{grid}</a:tblGrid>{"".join(tr_xml)}</a:tbl>'
            f'</a:graphicData></a:graphic></p:graphicFrame>'
        )
        self.shapes_xml.append(xml)

    def to_xml(self):
        shapes = "".join(self.shapes_xml)
        return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvGrpSpPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>
<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
{shapes}
</p:spTree></p:cSld>
<p:clrMapOvr><a:overrideClrMapping bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr>
</p:sld>'''


CONTENT_TYPES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
<Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>
<Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>
<Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
{slide_overrides}
</Types>'''

ROOT_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>'''

CORE_XML = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>ジンジブ 高卒採用・進路選択マーケティング戦略提案</dc:title>
<dc:creator>Strategy Team</dc:creator>
<cp:lastModifiedBy>Strategy Team</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">2026-08-24T00:00:00Z</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">2026-08-24T00:00:00Z</dcterms:modified>
</cp:coreProperties>'''

APP_XML = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
<Application>Custom OOXML Builder</Application>
<PresentationFormat>Widescreen</PresentationFormat>
<Slides>{n}</Slides>
<Company>Strategy Team</Company>
</Properties>'''

PRES_PROPS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:presentationPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>'

VIEW_PROPS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:viewPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:slideViewPr><p:cSldViewPr><p:cViewPr><p:scale><a:sx n="1" d="1"/><a:sy n="1" d="1"/></p:scale><p:origin x="0" y="0"/></p:cViewPr></p:cSldViewPr></p:slideViewPr></p:viewPr>'

TABLE_STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>'

THEME_XML = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Jinjib Z-Gen">
<a:themeElements>
<a:clrScheme name="Jinjib">
<a:dk1><a:srgbClr val="1A1A1A"/></a:dk1>
<a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
<a:dk2><a:srgbClr val="1A1A1A"/></a:dk2>
<a:lt2><a:srgbClr val="FFF7F0"/></a:lt2>
<a:accent1><a:srgbClr val="FF6A00"/></a:accent1>
<a:accent2><a:srgbClr val="00C2D1"/></a:accent2>
<a:accent3><a:srgbClr val="FFCD00"/></a:accent3>
<a:accent4><a:srgbClr val="FF3D8A"/></a:accent4>
<a:accent5><a:srgbClr val="8A2BE2"/></a:accent5>
<a:accent6><a:srgbClr val="9CD32A"/></a:accent6>
<a:hlink><a:srgbClr val="FF6A00"/></a:hlink>
<a:folHlink><a:srgbClr val="8A2BE2"/></a:folHlink>
</a:clrScheme>
<a:fontScheme name="Jinjib">
<a:majorFont><a:latin typeface="Montserrat"/><a:ea typeface="Noto Sans JP"/><a:cs typeface="Noto Sans JP"/></a:majorFont>
<a:minorFont><a:latin typeface="Noto Sans JP"/><a:ea typeface="Noto Sans JP"/><a:cs typeface="Noto Sans JP"/></a:minorFont>
</a:fontScheme>
<a:fmtScheme name="Jinjib">
<a:fillStyleLst>
<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
</a:fillStyleLst>
<a:lnStyleLst>
<a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
<a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
<a:ln w="25400"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
</a:lnStyleLst>
<a:effectStyleLst>
<a:effectStyle><a:effectLst/></a:effectStyle>
<a:effectStyle><a:effectLst/></a:effectStyle>
<a:effectStyle><a:effectLst/></a:effectStyle>
</a:effectStyleLst>
<a:bgFillStyleLst>
<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
</a:bgFillStyleLst>
</a:fmtScheme>
</a:themeElements>
</a:theme>'''

SLIDE_MASTER = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvGrpSpPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree></p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>'''

SLIDE_MASTER_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>'''

SLIDE_LAYOUT = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
<p:cSld name="Blank">
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvGrpSpPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree></p:cSld>
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>'''

SLIDE_LAYOUT_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>'''


class Presentation:
    def __init__(self):
        self.slides = []  # SlideBuilder list

    def new_slide(self):
        sb = SlideBuilder(len(self.slides) + 1)
        self.slides.append(sb)
        return sb

    def save(self, path):
        n = len(self.slides)
        slide_overrides = "".join(
            f'<Override PartName="/ppt/slides/slide{i+1}.xml" '
            f'ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
            for i in range(n)
        )
        content_types = CONTENT_TYPES.format(slide_overrides=slide_overrides)

        sld_id_lst = "".join(
            f'<p:sldId id="{256 + i}" r:id="rId{i + 3}"/>' for i in range(n)
        )
        presentation_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
<p:sldIdLst>{sld_id_lst}</p:sldIdLst>
<p:sldSz cx="{IN(SLIDE_W_IN)}" cy="{IN(SLIDE_H_IN)}" type="screen16x9"/>
<p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>'''

        pres_rels_items = [
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>',
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>',
        ]
        for i in range(n):
            pres_rels_items.append(
                f'<Relationship Id="rId{i + 3}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i+1}.xml"/>'
            )
        extra_id = n + 3
        pres_rels_items.append(
            f'<Relationship Id="rId{extra_id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/>'
        )
        pres_rels_items.append(
            f'<Relationship Id="rId{extra_id+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/>'
        )
        pres_rels_items.append(
            f'<Relationship Id="rId{extra_id+2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/>'
        )
        pres_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
                     '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                     + "".join(pres_rels_items) + '</Relationships>')

        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("[Content_Types].xml", content_types)
            z.writestr("_rels/.rels", ROOT_RELS)
            z.writestr("docProps/core.xml", CORE_XML)
            z.writestr("docProps/app.xml", APP_XML.format(n=n))
            z.writestr("ppt/presentation.xml", presentation_xml)
            z.writestr("ppt/_rels/presentation.xml.rels", pres_rels)
            z.writestr("ppt/presProps.xml", PRES_PROPS)
            z.writestr("ppt/viewProps.xml", VIEW_PROPS)
            z.writestr("ppt/tableStyles.xml", TABLE_STYLES)
            z.writestr("ppt/theme/theme1.xml", THEME_XML)
            z.writestr("ppt/slideMasters/slideMaster1.xml", SLIDE_MASTER)
            z.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", SLIDE_MASTER_RELS)
            z.writestr("ppt/slideLayouts/slideLayout1.xml", SLIDE_LAYOUT)
            z.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", SLIDE_LAYOUT_RELS)
            slide_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
                          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
                          '</Relationships>')
            for i, sb in enumerate(self.slides):
                z.writestr(f"ppt/slides/slide{i+1}.xml", sb.to_xml())
                z.writestr(f"ppt/slides/_rels/slide{i+1}.xml.rels", slide_rels)
