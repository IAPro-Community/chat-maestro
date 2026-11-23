#!/usr/bin/env python3
"""Regenera somente os ícones de distribuição a partir do PNG aprovado.

Dependência OPCIONAL de desenvolvimento: python -m pip install "Pillow>=11,<13"
O pacote de extensão nunca precisa de Python/Pillow em runtime.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "brand" / "icon-source.png"
SIZES = (16, 32, 48, 128)

def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    assert source.size == (256, 256), "Fonte de marca deve ter 256 × 256 px"
    for size in SIZES:
        image = source.resize((size, size), Image.Resampling.LANCZOS)
        image = image.quantize(colors=64, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        path = ROOT / "assets" / f"icon{size}.png"
        image.save(path, optimize=True)
        print(f"{path.relative_to(ROOT)}: {size}×{size}")

if __name__ == "__main__":
    main()
