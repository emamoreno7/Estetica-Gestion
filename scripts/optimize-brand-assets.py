"""Optimiza el sello Amore y el crédito DotCom a WebP para la landing.

Los PNG originales se conservan; la app mantiene fallback ante error de carga.
El crop de Amore se basa en el logo vertical aprobado (853x1280).
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUTPUT = PUBLIC / "editorial"
OUTPUT.mkdir(exist_ok=True, parents=True)

source = PUBLIC / "logo-amore-v2.png"
with Image.open(source) as original:
    logo = ImageOps.exif_transpose(original).convert("RGB")
    width, height = logo.size
    # Logotipo circular centrado dentro de un PNG vertical con márgenes blancos.
    mark = logo.crop((
        round(width * 0.075), round(height * 0.177),
        round(width * 0.925), round(height * 0.745),
    ))
    mark = ImageOps.fit(mark, (300, 300), method=Image.Resampling.LANCZOS)
    dest = OUTPUT / "amore-mark.webp"
    mark.save(dest, "WEBP", quality=85, method=6)
    print(f"{dest.relative_to(ROOT)}: {dest.stat().st_size // 1024} KB")

source = PUBLIC / "bydotcom-logo.png"
with Image.open(source) as original:
    mark = ImageOps.exif_transpose(original).convert("RGB")
    mark.thumbnail((144,144), Image.Resampling.LANCZOS)
    dest = OUTPUT / "bydotcom-mark.webp"
    mark.save(dest, "WEBP", quality=80, method=6)
    print(f"{dest.relative_to(ROOT)}: {dest.stat().st_size // 1024} KB")
