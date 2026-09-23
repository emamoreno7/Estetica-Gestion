# Amore: publicación con GitHub Pages + Cloudflare

Dominio preparado: **https://amore.bydotcom.com/**. DNS en Cloudflare; hosting y despliegues en GitHub Pages desde `main`.

**No fusionar la rama de migración hasta completar el procedimiento en [docs/amore-custom-domain.md](docs/amore-custom-domain.md).** La web actual permanece en `https://emamoreno7.github.io/Estetica-Gestion/` hasta el corte.

### Compilación y control
```bash
npm ci
npx tsc --noEmit
npm run build:domain
npm run verify:domain
npm run preview:domain
```
La nueva versión se sirve desde `/`. `build:pages` permanece disponible sólo para **reversión** al subdirectorio previo.

### GitHub Pages
Settings → Pages → Source: GitHub Actions. Configurar el custom domain en Pages y el CNAME en Cloudflare con el orden indicado en la guía. El workflow `.github/workflows/deploy-pages.yml` conserva los Secrets configurados del repo y compila con `VITE_BASE_PATH=/`.

### Protección del acceso
El formulario usa Supabase Auth y perfiles con RLS; el dominio nuevo debe agregarse a Auth → URL Configuration. Nunca publicar una `service_role` key en VITE_* ni en el repositorio.
