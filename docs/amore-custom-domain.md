# Amore — migración controlada al subdominio

**Objetivo:** https://amore.bydotcom.com/ · **Hosting:** GitHub Pages del repositorio `emamoreno7/Estetica-Gestion` · **DNS:** Cloudflare de `bydotcom.com`.

Este PR deja preparada la compilación en raíz, pero **no debe fusionarse antes de coordinar el cambio de dominio y de configurar el origen de autenticación**. No modifica la web actual mientras permanezca en la rama.

## 1. Verificaciones antes del corte
- GitHub Actions: TypeScript, compilación, `verify:domain`, capturas responsive con base `/` y Lighthouse móvil.
- Supabase → Authentication → URL Configuration: agregar **Redirect URLs** exactas `https://amore.bydotcom.com/`, `https://amore.bydotcom.com/ingreso`, `https://amore.bydotcom.com/portal`, `https://amore.bydotcom.com/unete` **antes** de quitar las URLs antiguas. Mantener temporalmente `https://emamoreno7.github.io/Estetica-Gestion/` y sus rutas. Cambiar la **Site URL** al nuevo dominio una vez activo.
- El login con contraseña actualmente no depende del origen en los callbacks; los correos de confirmación o recuperación sí utilizan la configuración URL de Supabase.
- Comprobar que Cloudflare no tenga ya un registro `amore` en DNS. No modificar los registros del dominio raíz, correo ni `www`.

## 2. Ajustes manuales del dominio (se hace juntos, cerca del corte)
1. Si corresponde, verificar previamente el dominio propio en GitHub mediante el TXT que indique Settings → Pages (verificación de dominio, para reducir riesgo de takeover).
2. GitHub → repositorio → **Settings → Pages → Custom domain**: colocar `amore.bydotcom.com` y **Save**. Con GitHub Actions, el archivo `public/CNAME` del repositorio es documental y se incluye en el artifact, pero **NO sustituye esta configuración**.
3. Cloudflare → bydotcom.com → DNS → Add record:
   - Tipo: **CNAME**
   - Nombre: **amore**
   - Destino: **emamoreno7.github.io** (sin el nombre del repositorio)
   - Proxy: **DNS only** (nube gris, inicialmente)
   - TTL: Auto
4. En GitHub Pages esperar a que el DNS check sea correcto. Activar **Enforce HTTPS** una vez disponible.
5. Revisar DNS y `https://amore.bydotcom.com/` (certificado, recursos, íconos, CSS) antes de anunciar la migración. GitHub advierte que la propagación DNS puede demorar hasta 24 horas.

**Importante:** poner el dominio en GitHub Settings ANTES de publicar el CNAME en Cloudflare, según el orden de seguridad indicado por GitHub. Esta ventana puede generar redirecciones a un dominio que todavía se está propagando: coordinar la fusión al finalizar la configuración para minimizar la indisponibilidad.

## 3. Fusionar y verificar la versión nueva
- Fusionar el PR aprobado que compila con `VITE_BASE_PATH=/`. El workflow de main publica el artifact en Pages.
- Verificar la home, menú, `/ingreso`, `/unete`, `/portal` y `/admin` con cuentas de prueba, enlaces externos y WhatsApp. Confirmar protección de las rutas privadas y no subir datos de clientas a GitHub.
- Tras confirmar producción, actualizar la Site URL de Supabase y revisar la expiración de las sesiones: por el cambio de origen (host), las personas tendrán que iniciar sesión de nuevo.
- Verificar en Google Search Console la propiedad por **prefijo de URL** `https://amore.bydotcom.com/` y enviar `https://amore.bydotcom.com/sitemap.xml`.
- GitHub Pages normalmente redirige el dominio anterior al personalizado cuando está configurado. Verificarlo en producción; no dar por garantizado hasta comprobar las redirecciones.

## 4. Plan de reversión
Si falla el sitio en la nueva dirección: no borrar el repositorio ni tocar las tablas. Revisar primero GitHub Pages DNS/HTTPS. Para volver al hosting anterior, quitar el custom domain desde Pages y el CNAME de Cloudflare; revertir el commit de migración de `main` (incluidos `VITE_BASE_PATH=/Estetica-Gestion/`, `segmentCount=1` y metadatos), restaurar la Site URL anterior de Supabase y conservar temporalmente ambos redirect URLs. El workflow de Pages volverá a publicar en el subpath habitual.

## Diferencia técnica
Con GitHub Pages + custom domain, el sitio está en la **raíz** `/`, aunque el repositorio conserve el nombre `Estetica-Gestion`. En nuestra app, `import.meta.env.BASE_URL` y `BrowserRouter` ya gestionan este cambio; no se reescribieron componentes ni reglas de negocio.
