# Hero editorial — Amore

Objetivo: recrear la portada aprobada sin aplanar texto ni botones dentro de la fotografía.

- Fuente aprobada: `public/hero-editorial-source.webp` (misma fotografía en cuatro variantes).
- Desktop: 768, 1280 y 1920 px en `srcSet`. Móvil: recorte dedicado de la misma foto.
- Tarjetas de categorías integradas bajo la portada. No duplicar el bloque de categorías en la sección de servicios.
- Los botones de categorías activan los filtros reales del catálogo; el backend y las rutas permanecen intactos.
- La nota manuscrita, títulos y botones son texto HTML accesible, no una captura plana.
- Revisar capturas 1440/1024/768/390/320 antes de fusionar. No migrar el dominio en este PR.