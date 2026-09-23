"""Conversión fiel de una imagen de marca a icono iOS opaco (requiere Pillow)."""
from pathlib import Path
import argparse

from PIL import Image, ImageOps


def generate_app_icon(source: Path, output: Path) -> None:
    with Image.open(source) as original:
        symbol = ImageOps.contain(original.convert('RGBA'), (864, 864), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (1024, 1024), 'white')
    canvas.paste(symbol, ((1024 - symbol.width) // 2, (1024 - symbol.height) // 2), symbol)
    canvas.save(output, format='PNG')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    arguments = parser.parse_args()
    generate_app_icon(arguments.source, arguments.output)
