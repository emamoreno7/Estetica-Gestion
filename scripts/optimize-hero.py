"""Generar hero WebP responsive sin depender de servicios de imagen externos.

Fuente inmutable: public/hero-editorial-source.webp (fotografía aprobada).
No modificar las imágenes clínicas de resultados.
"""
from pathlib import Path
from PIL import Image, ImageOps
import hashlib

PUBLIC = Path(__file__).resolve().parents[1] / "public"
SOURCE = PUBLIC / "hero-editorial-source.webp"

if not SOURCE.is_file():
    raise SystemExit("Falta la fotografía maestra hero-editorial-source.webp")

with Image.open(SOURCE) as raw:
    image = ImageOps.exif_transpose(raw).convert("RGB")
    if min(image.size) < 900:
        raise SystemExit(f"La foto fuente necesita resolución editorial: {image.size}")

    for width, quality in [(768, 81), (1280, 83), (1920, 83)]:
        target = image.resize(
            (width, round(image.height * width / image.width)),
            Image.Resampling.LANCZOS,
        )
        out = PUBLIC / f"hero-editorial-{width}.webp"
        target.save(out, format="WEBP", quality=quality, method=6)
        with Image.open(out) as check:
            assert check.size == target.size
        print(f"{out.name}: {target.size}, {out.stat().st_size // 1024} KB")

    # Un encuadre autónomo de la misma fotografía para pantallas verticales.
    # El rostro y el gesto quedan visibles sin cargar 1920 px en un celular.
    crop = ImageOps.fit(
        image, (780, 880), method=Image.Resampling.LANCZOS,
        centering=(0.70, 0.33),
    )
    mobile = PUBLIC / "hero-editorial-mobile.webp"
    crop.save(mobile, format="WEBP", quality=82, method=6)
    print(f"{mobile.name}: {crop.size}, {mobile.stat().st_size // 1024} KB")

print("Fuente SHA256:", hashlib.sha256(SOURCE.read_bytes()).hexdigest())
