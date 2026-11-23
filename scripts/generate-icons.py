#!/usr/bin/env python3
"""Gera ícones Chrome MV3 de uma única fonte. Apenas para desenvolvimento.

Dependência opcional: python -m pip install 'Pillow>=11,<13'
Não é executado no build e não cria dependências de runtime.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets' / 'brand' / 'icon-source.png'
SIZES = (16, 32, 48, 128)
BACKGROUND = (19, 12, 28, 255)

def main() -> None:
    with Image.open(SOURCE) as src:
        mascot = src.convert('RGBA')
    if mascot.size != (256, 256):
        raise SystemExit(f'Fonte inválida: {mascot.size}; esperado 256 × 256')
    for size in SIZES:
        scale = 4 if size < 64 else 2
        side = size * scale
        tile = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        ImageDraw.Draw(tile).rounded_rectangle(
            (0, 0, side - 1, side - 1), radius=round(side * 0.24), fill=BACKGROUND
        )
        span = round(side * 0.92)
        glyph = mascot.resize((span, span), Image.Resampling.LANCZOS)
        tile.alpha_composite(glyph, ((side - span)//2, (side - span)//2))
        icon = tile.resize((size, size), Image.Resampling.LANCZOS)
        if size > 16:
            icon = icon.quantize(colors=32, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        path = ROOT / 'assets' / f'icon{size}.png'
        icon.save(path, optimize=True)
        print(f'{path.relative_to(ROOT)}: {size}×{size}')

if __name__ == '__main__':
    main()
