/** Servicios reservables en el portal (etiquetas canónicas del catálogo). */
export const CITAS_SERVICIOS_RESERVABLES = [
  'Body Up',
  'Radiofrecuencia',
  'Crio-lipólisis',
  'Lipo-láser',
  'Electrodos',
  'Cavitación 40k',
  'Vacuum',
  'Masajes relajantes',
  'Masaje linfático',
  'Presoterapia',
  'Piedras calientes',
  'Hollywood Peel',
  'Lifting de pestañas',
  'Laminado de cejas',
  'Perfilado de cejas',
  'Belleza de manos',
  'Nails (uñas)',
  'Depilación definitiva',
  'Eliminación de tatuajes',
] as const;

export type ServicioReservable = (typeof CITAS_SERVICIOS_RESERVABLES)[number];

/** Paso en minutos entre franjas (evita overlaps de 60m). */
export const CITA_INTERVALO_MIN = 60;

/** Horario recepción (Argentina / negocio). */
export const CITA_HORA_INICIO = 9; // 09:00
export const CITA_HORA_FIN = 20; // hasta 19:59 (último turno opcionalmente 19:00 con intervalos 60m)

/** Cross-sell predefinido: servicio reservado → complemento recomendado. */
export type CrossSellReco = {
  complemento: string;
  motivoProfesional: string;
};

const key = (s: string) => s.trim().toLowerCase();

const CROSS_SELL_MAP = new Map<string, CrossSellReco>([
  [
    key('Crio-lipólisis'),
    {
      complemento: 'Electrodos',
      motivoProfesional: 'Potencia la tonificación tras reducir grasa.',
    },
  ],
  [
    key('Radiofrecuencia'),
    {
      complemento: 'Hollywood Peel',
      motivoProfesional: 'Prepara la piel para una mejor absorción y brillo.',
    },
  ],
  [
    key('Electrodos'),
    {
      complemento: 'Masaje linfático',
      motivoProfesional: 'Ayuda a eliminar toxinas liberadas por el trabajo muscular.',
    },
  ],
  [
    key('Depilación definitiva'),
    {
      complemento: 'Nutrición / hidratación dermal focal',
      motivoProfesional: 'Ayuda al confort tras sesiones láser/IPL cuando lo indiquen tus profesionales.',
    },
  ],
  [
    key('Hollywood Peel'),
    {
      complemento: 'Hidratación con activos revitalizantes',
      motivoProfesional: 'Sellar el peeling con nutrición deja la piel más luminosa entre sesiones.',
    },
  ],
  [
    key('Presoterapia'),
    {
      complemento: 'Masaje linfático',
      motivoProfesional: 'Potencia los resultados reductores combinando succión dirigida con drenaje suave.',
    },
  ],
  [
    key('Cavitación 40k'),
    {
      complemento: 'Vacuum',
      motivoProfesional: 'Potencia la reducción localizada con succión y drenaje inmediato tras el ultrasonido.',
    },
  ],
  [
    key('Vacuum'),
    {
      complemento: 'Presoterapia',
      motivoProfesional: 'Complementamos el drenaje manual con compresión secuencial para potenciar la circulación.',
    },
  ],
]);

/** Opcional cuando el servicio no está en tabla fija — “reductivo” típico. */
const REDUCTOR_DEFAULT_CROSS: CrossSellReco = {
  complemento: 'Presoterapia',
  motivoProfesional: 'Complementamos la reducción con tonificación/drenaje según valoración profesional.',
};

export function obtenerCrossSellPorServicio(servicio: string): CrossSellReco | null {
  const direct = CROSS_SELL_MAP.get(key(servicio));
  if (direct) return direct;
  const t = servicio.toLowerCase();
  if (/crio|lip[oó]lis|lipol/i.test(t)) return CROSS_SELL_MAP.get(key('Crio-lipólisis')) ?? null;
  if (/presot|vacum|vacuum|lipom/i.test(t)) return REDUCTOR_DEFAULT_CROSS;
  return null;
}

/** Hasta sugerencias complementarias únicas para el Dashboard según tratamiento y/o próxima cita. */
export function obtenerSugerenciasBienestar(
  focoPrincipal: string | null | undefined,
  focoSecundario?: string | null
): CrossSellReco[] {
  const out: CrossSellReco[] = [];
  const seen = new Set<string>();

  function pushReco(r: CrossSellReco | null): void {
    if (!r || out.length >= 3) return;
    const id = r.complemento.trim().toLowerCase();
    if (seen.has(id)) return;
    seen.add(id);
    out.push(r);
  }

  if (focoPrincipal?.trim()) pushReco(obtenerCrossSellPorServicio(focoPrincipal));
  const sec = focoSecundario?.trim();
  const pri = focoPrincipal?.trim() ?? '';
  if (sec && sec.toLowerCase() !== pri.toLowerCase()) {
    pushReco(obtenerCrossSellPorServicio(sec));
  }

  for (const hint of ['Presoterapia', 'Crio-lipólisis', 'Radiofrecuencia']) {
    pushReco(obtenerCrossSellPorServicio(hint));
    if (out.length >= 3) break;
  }

  return out;
}