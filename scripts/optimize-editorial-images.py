"""Optimización editorial de imágenes existentes. Ejecutar en CI (Pillow requerido).

Son imágenes ilustrativas del catálogo: no representan casos reales ni resultados clínicos.
No se alteran los JPG de /casos; esos requieren autorización y revisión manual.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUTPUT = PUBLIC / "editorial"
OUTPUT.mkdir(parents=True, exist_ok=True)

SOURCE_IMAGES = (
    "body-up.png",
    "radiofrecuencia.png",
    "crio.png",
    "lipolaser.png",
    "electrodo.png",
    "presoterapia.png",
    "masajesr.png",
    "masajesl.png",
    "piedras-calientes.png",
    "pestanas.png",
    "depilacion.png",
    "tatuajes.png",
)

for filename in SOURCE_IMAGES:
    source = PUBLIC / filename
    if not source.exists():
        raise SystemExit(f"No se encontró la imagen de catálogo: {source}")
    destination = OUTPUT / (source.stem + ".webp")
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
        image = ImageOps.fit(image, (760, 920), method=Image.Resampling.LANCZOS, centering=(0.5, 0.43))
        image = ImageEnhance.Color(image).enhance(0.90)
        image = ImageEnhance.Contrast(image).enhance(0.98)
        image.save(destination, "WEBP", quality=73, method=6, exact=False)
    print(f"{filename:24s} -> {destination.relative_to(ROOT)} ({destination.stat().st_size // 1024} KB)")
