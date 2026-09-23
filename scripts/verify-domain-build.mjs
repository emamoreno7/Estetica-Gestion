/**
 * Contrato del despliegue a amore.bydotcom.com.
 * Corre tras npm run build:domain, sin red ni credenciales.
 */
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const dist = 'dist';
const read = (file) => readFile(join(dist, file), 'utf8');
const fail = (message) => { throw new Error('[amore-domain] ' + message); };
const [html, notFound, robots, sitemap, cname, manifest] = await Promise.all([
  read('index.html'), read('404.html'), read('robots.txt'),
  read('sitemap.xml'), read('CNAME'), read('manifest.json')
]);
const url = 'https://amore.bydotcom.com/';
if (cname.trim() !== 'amore.bydotcom.com') fail('CNAME incorrecto');
if (!html.includes('rel="canonical" href="' + url + '"')) fail('Canonical incorrecto');
if (!html.includes('property="og:url" content="' + url + '"')) fail('og:url incorrecto');
if (!html.includes('href="/manifest.json"')) fail('Manifest no está bajo /');
if (!html.includes('href="/amore-hero.webp"')) fail('El preload del hero no usa /');
if (!html.includes('src="/assets/')) fail('Los assets compilados no usan la raíz');
if (html.includes('emamoreno7.github.io/Estetica-Gestion/')) fail('La landing conserva metadatos del dominio anterior');
if (!notFound.includes('var segmentCount = 0;')) fail('404.html no está preparado para subdominio');
if (!sitemap.includes('<loc>' + url + '</loc>')) fail('Sitemap incorrecto');
if (!robots.includes('Sitemap: ' + url + 'sitemap.xml')) fail('Robots no referencia el sitemap');
const parsed = JSON.parse(manifest);
if (parsed.start_url !== './' || parsed.scope !== './') fail('Manifest PWA no es relativo a la raíz');
await stat(join(dist, 'amore-hero.webp'));
console.log('OK: base /, canonical, OG, PWA, 404, CNAME, robots, sitemap y hero.');
