#!/usr/bin/env python3
"""Regera os PNGs a partir do SVG. Requer CairoSVG e Pillow apenas para edição."""
from io import BytesIO
from pathlib import Path
import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "chat-maestro-icon.svg"
SIZES = (16, 32, 48, 128)

def main() -> None:
    svg = SOURCE.read_bytes()
    for size in SIZES:
        png = cairosvg.svg2png(bytestring=svg, output_width=size * 4, output_height=size * 4)
        image = Image.open(BytesIO(png)).convert("RGB")
        image = image.resize((size, size), Image.Resampling.LANCZOS)
        image = image.quantize(colors=16, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        target = ROOT / "assets" / f"icon{size}.png"
        image.save(target, optimize=True)
        print(f"{target.relative_to(ROOT)}: {size}x{size}")

if __name__ == "__main__":
    main()
