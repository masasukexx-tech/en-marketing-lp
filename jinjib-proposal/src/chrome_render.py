import os
import subprocess
import tempfile

from png_util import crop_png

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
BASE_FLAGS = ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
              "--font-render-hinting=none", "--force-color-profile=srgb"]

# This chrome build's headless --screenshot leaves a fixed unpainted band at
# the bottom of the viewport regardless of --window-size (measured ~65px at
# 1x scale); overscan the window and crop it back off so output PNGs are
# exact and gray-band-free.
OVERSCAN_PX = 100


def render_png(html_path, png_path, width, height, scale=1):
    tall = height + OVERSCAN_PX
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
    cmd = [CHROME, *BASE_FLAGS, f"--screenshot={tmp_path}",
           f"--window-size={width},{tall}",
           f"--force-device-scale-factor={scale}",
           f"file://{os.path.abspath(html_path)}"]
    subprocess.run(cmd, check=True, capture_output=True)
    crop_png(tmp_path, png_path, 0, 0, width * scale, height * scale)
    os.remove(tmp_path)


def render_pdf(html_path, pdf_path):
    cmd = [CHROME, *BASE_FLAGS, f"--print-to-pdf={pdf_path}",
           "--print-to-pdf-no-header", "--no-pdf-header-footer",
           f"file://{os.path.abspath(html_path)}"]
    subprocess.run(cmd, check=True, capture_output=True)
