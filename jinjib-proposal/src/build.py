import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from render_html import build_full_html, build_single_html
from render_pptx import build_presentation
from chrome_render import render_png, render_pdf

OUT = "/home/user/en-marketing-lp/jinjib-proposal/output"
PREVIEW = os.path.join(OUT, "preview")


def get_all_slides():
    from slides_cover_toc import slide_01_cover, slide_02_toc
    from slides_tiktok import build_tiktok_slides
    from slides_ig_yt import build_ig_slides, build_yt_slides
    from slides_phase4_roadmap import (slide_18_phase4, slide_19_roadmap, slide_20_schedule,
                                        slide_21_kpi, slide_22_future)
    slides = [slide_01_cover(), slide_02_toc()]
    slides += build_tiktok_slides()
    slides += build_ig_slides()
    slides += build_yt_slides()
    slides += [slide_18_phase4(), slide_19_roadmap(), slide_20_schedule(),
               slide_21_kpi(), slide_22_future()]
    assert len(slides) == 22, f"expected 22 slides, got {len(slides)}"
    return slides


def main(only=None):
    os.makedirs(PREVIEW, exist_ok=True)
    scenes = get_all_slides()

    print("Building pptx...")
    pres = build_presentation(scenes)
    pres.save(os.path.join(OUT, "jinjib_marketing_proposal.pptx"))

    print("Building combined PDF...")
    full_html_path = os.path.join(OUT, "_full.html")
    with open(full_html_path, "w") as f:
        f.write(build_full_html(scenes))
    render_pdf(full_html_path, os.path.join(OUT, "jinjib_marketing_proposal.pdf"))

    indices = only if only else range(1, 23)
    print(f"Rendering {len(list(indices)) if only else 22} preview PNGs...")
    for i in (only if only else range(1, 23)):
        sc = scenes[i - 1]
        html_path = f"/tmp/slide_{i:02d}.html"
        with open(html_path, "w") as f:
            f.write(build_single_html(sc))
        render_png(html_path, os.path.join(PREVIEW, f"slide-{i:02d}.png"), 1920, 1080)
    print("Done.")


if __name__ == "__main__":
    args = sys.argv[1:]
    only = [int(a) for a in args] if args else None
    main(only)
