# Amore — Fase 2 (arquitectura y mantenimiento)

## Alcance

- Sólo web pública: microinteracciones discretas, menú con Escape, footer compacto y SEO local.
- Rendimiento: panel administrativo, portal y formularios se cargan por rutas con React.lazy. El chat de escritorio no forma parte del bundle móvil; el alta de clientas usa el WebP publicado.
- Integridad: no se modifican SQL, Supabase, permisos, lógica de negocio ni originales de Antes/Después.

## Antes de publicar

1. Ejecutar npm ci, npx tsc --noEmit, npm run build y npm run build:pages.
2. Revisar capturas y smoke checks en desktop, laptop, tablet, móvil 390 y 320 px.
3. Revisar informes Lighthouse: los umbrales iniciales son advertencias hasta disponer de línea de base reproducible.
4. Probar manualmente ingreso, registro, portal y administración con cuentas de prueba. No compartir información clínica real.
5. Confirmar autenticidad y autorización de fotografías y testimonios de resultados.
6. Si se agrega dominio propio, actualizar canonical, OG URL, sitemap.xml y robots.txt.
7. El robots.txt de GitHub Pages de proyecto no se sirve automáticamente desde la raíz del host: configurar allí o usar dominio propio.

## Publicación

Revisar el PR y fusionar sin force-push. El workflow existente despliega desde main.