from pptx_builder import Presentation
from scene import replay_to_pptx


def build_presentation(scenes):
    pres = Presentation()
    for sc in scenes:
        sb = pres.new_slide()
        replay_to_pptx(sc, sb)
    return pres
