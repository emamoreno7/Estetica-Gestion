/**
 * Mapeo de servicios a imágenes.
 * Detecta el nombre del servicio y devuelve la imagen apropiada.
 * Si no encuentra coincidencia, devuelve la imagen por defecto.
 */

const IMAGEN_POR_DEFECTO = '/body-up.png';

// Mapeo: palabras clave en el nombre del servicio → imagen
const MAPEO_IMAGENES: { keywords: string[]; imagen: string }[] = [
  { keywords: ['body up', 'bodyup', 'body-up'], imagen: '/body-up.png' },
  { keywords: ['lipolaser', 'lipoláser', 'lipo láser', 'lipo'], imagen: '/lipolaser.png' },
  { keywords: ['crio', 'criolipólisis', 'criolipolisis', 'criofrecuencia'], imagen: '/crio.png' },
  { keywords: ['depilación', 'depilacion', 'laser definitiva', 'láser definitiva'], imagen: '/depilacion.png' },
  { keywords: ['electrodo', 'electroestimulación', 'electroestimulacion'], imagen: '/electrodo.png' },
  { keywords: ['radiofrecuencia', 'radio frecuencia', 'rf'], imagen: '/radiofrecuencia.png' },
  { keywords: ['presoterapia', 'presoterápia'], imagen: '/presoterapia.png' },
  { keywords: ['piedras calientes', 'piedras-calientes', 'hot stone'], imagen: '/piedras-calientes.png' },
  { keywords: ['masaje relajante', 'relajante', 'masajes relajantes', 'masajesr'], imagen: '/masajesr.png' },
  { keywords: ['masaje', 'masajes', 'lomo descontracturante', 'masajesl'], imagen: '/masajesl.png' },
  { keywords: ['pestañas', 'pestanas', 'lifting de pestañas'], imagen: '/pestanas.png' },
  { keywords: ['tatuaje', 'tatuajes', 'micropigmentación', 'micropigmentacion'], imagen: '/tatuajes.png' },
];

/**
 * Devuelve la imagen correspondiente al nombre del servicio.
 * Hace match parcial (case-insensitive) buscando palabras clave.
 */
export function getImagenServicio(servicioNombre: string | null | undefined): string {
  if (!servicioNombre) return IMAGEN_POR_DEFECTO;

  const nombre = servicioNombre.toLowerCase().trim();

  for (const { keywords, imagen } of MAPEO_IMAGENES) {
    if (keywords.some((kw) => nombre.includes(kw.toLowerCase()))) {
      return imagen;
    }
  }

  return IMAGEN_POR_DEFECTO;
}

/**
 * Devuelve la imagen correspondiente a un servicio por su ID (de la base de datos).
 * Útil cuando guardamos servicio_id en lugar de solo el nombre.
 */
export function getImagenServicioById(servicioId: string | null | undefined): string {
  if (!servicioId) return IMAGEN_POR_DEFECTO;

  // El servicio_id en nuestra base es del tipo "corporal::Body Up"
  const partes = servicioId.split('::');
  const nombre = partes.length > 1 ? partes[1] : partes[0];

  return getImagenServicio(nombre);
}