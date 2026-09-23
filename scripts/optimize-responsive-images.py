"""Derivados responsive fieles y livianos; nunca modificar las fotos originales.

Catálogo: miniaturas 240/480, CSS object-fit decide el encuadre.
Comparadores: 480/800, NO alterar color, no recortar ni retocar contenido.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
EDITORIAL = ROOT / "public" / "editorial"
CASOS = ROOT / "public" / "casos"

def generate(source: Path, sizes: tuple[int, ...], *, quality: int = 79):
    with Image.open(source) as original:
        original = ImageOps.exif_transpose(original).convert("RGB")
        for target in sizes:
            if original.width <= target:
                raise ValueError(f"{source.name}: original insuficiente para {target} px")
            copy = original.copy()
            copy.thumbnail((target, 10_000), Image.Resampling.LANCZOS)
            destination = source.with_name(f"{source.stem}-{target}.webp")
            copy.save(destination, "WEBP", quality=quality, method=6)
            with Image.open(destination) as check:
                assert check.size == copy.size, destination
            print(f"{destination.relative_to(ROOT)}: {destination.stat().st_size // 1024} KB")

for photo in sorted(EDITORIAL.glob("*.webp")):
    if photo.stem in ("amore-mark", "bydotcom-mark") or photo.stem.endswith(("-240", "-480", "-800")):
        continue
    generate(photo, (240, 480), quality=76)

for photo in sorted(CASOS.glob("*.webp")):
    if photo.stem.endswith(("-480", "-800")):
        continue
    # Conservamos el JPG original y el WebP completo sin modificaciones.
    generate(photo, (480, 800), quality=81)

with Image.open(EDITORIAL / "amore-mark.webp") as im:
    for size in (96, 144):
        small = im.copy()
        small.thumbnail((size, size), Image.Resampling.LANCZOS)
        path = EDITORIAL / f"amore-mark-{size}.webp"
        small.save(path, "WEBP", quality=80, method=6)
        print(f"{path.relative_to(ROOT)}: {path.stat().st_size // 1024} KB")
