import type { IllustrationKey } from '@/features/landing/ServiceIllustration';

export type ServicioItem = {
  name: string;
  desc: string;
  badges: string[];
  /** Imagen tipo foto (fallback / admin / portal). */
  image: string;
  /** Ilustración SVG line-art usada en la landing. */
  illustration?: IllustrationKey;
};

export type ServicioCategoria = {
  id: string;
  label: string;
  services: ServicioItem[];
};

export const serviciosCatalogo: ServicioCategoria[] = [
  {
    id: 'corporal',
    label: 'Remodelación Corporal',
    services: [
      {
        name: 'Body Up',
        desc: 'Modelado corporal con protocolo Amore: tonificación y contorno con la serenidad de un ritual de belleza, no de un gimnasio.',
        badges: ['Tonificador', 'Reductor'],
        image: '/body-up.png',
        illustration: 'bodyUp',
      },
      {
        name: 'Radiofrecuencia',
        desc: 'Firmeza y luminosidad: estimulación del colágeno para una piel más compacta, con la calma y la precisión que tu cuerpo merece.',
        badges: ['Reafirmante'],
        image: '/radiofrecuencia.png',
        illustration: 'radiofrecuencia',
      },
      {
        name: 'Crio-lipólisis',
        desc: 'Enfriamiento controlado sobre zonas localizadas, en un entorno clínico impecable y acogedor. Sin prisas, solo resultados bien acompañados.',
        badges: ['Reductor'],
        image: '/crio.png',
        illustration: 'crio',
      },
      {
        name: 'Lipo-láser',
        desc: 'Tecnología láser para acompañar tu silueta con contornos más definidos, siempre dentro de un cuidado personalizado Amore.',
        badges: ['Reductor'],
        image: '/lipolaser.png',
        illustration: 'lipolaser',
      },
      {
        name: 'Electrodos',
        desc: 'Activación muscular profunda para tonificar y drenar, con sensación de bienestar y sin perder la elegancia del momento.',
        badges: ['Tonificador', 'Drenante'],
        image: '/electrodo.png',
        illustration: 'electrodos',
      },
      {
        name: 'Cavitación 40k y Vacuum',
        desc: 'Ultrasonido de 40 kHz y succión vacuum para acompañar la reducción localizada y el drenaje, con un protocolo Amore preciso y respetuoso.',
        badges: ['Reductor', 'Drenante'],
        image: '/presoterapia.png',
        illustration: 'presoterapia',
      },
    ],
  },
  {
    id: 'bienestar',
    label: 'Bienestar',
    services: [
      {
        name: 'Masajes relajantes',
        desc: 'Ritual de descanso con movimientos lentos y aceites seleccionados. Tu cuerpo baja el ritmo; tu mente, también.',
        badges: ['Relajante'],
        image: '/masajesr.png',
        illustration: 'masajeRelajante',
      },
      {
        name: 'Masaje linfático',
        desc: 'Drenaje suave y rítmico que favorece la circulación y la sensación de ligereza, en un espacio pensado para tu bienestar.',
        badges: ['Drenante'],
        image: '/masajesl.png',
        illustration: 'masajeLinfatico',
      },
      {
        name: 'Presoterapia',
        desc: 'Compresión secuencial envolvente para activar la circulación y la sensación de piernas descansadas y definidas.',
        badges: ['Drenante', 'Reafirmante'],
        image: '/presoterapia.png',
        illustration: 'presoterapia',
      },
      {
        name: 'Piedras calientes',
        desc: 'Calor volcanic sobre la piel que relaja la fibra muscular hasta lo más profundo. Un clásico del spa, elevado al estándar Amore.',
        badges: ['Relajante'],
        image: '/piedras-calientes.png',
        illustration: 'piedrasCalientes',
      },
    ],
  },
  {
    id: 'facial',
    label: 'Facial & Mirada',
    services: [
      {
        name: 'Hollywood Peel',
        desc: 'Peeling de carbón con láser para una piel luminosa y unificada: reduce poros, opacidad y textura con un acabado fresco y radiante.',
        badges: ['Facial'],
        image: '/pestanas.png',
      },
      {
        name: 'Lifting de pestañas',
        desc: 'Curva y elevación natural: una mirada despierta y femenina sin el peso de las extensiones, con acabado limpio y duradero.',
        badges: ['Lashista'],
        image: '/pestanas.png',
        illustration: 'liftingPestanas',
      },
      {
        name: 'Laminado de cejas',
        desc: 'Cejas peinadas, fijadas y con forma definida durante semanas: efecto prolijo y voluminoso que enmarca la mirada.',
        badges: ['Lashista'],
        image: '/pestanas.png',
      },
      {
        name: 'Perfilado de cejas',
        desc: 'Diseño a medida que equilibra simetría y expresión: cejas que enmarcan sin competir con tu rostro.',
        badges: ['Lashista'],
        image: '/pestanas.png',
        illustration: 'perfiladoCejas',
      },
    ],
  },
  {
    id: 'manos',
    label: 'Manos & Uñas',
    services: [
      {
        name: 'Belleza de manos',
        desc: 'Cuidado completo de manos: prolijado de cutículas, hidratación y esmaltado para manos prolijas y cuidadas.',
        badges: ['Manicura'],
        image: '/pestanas.png',
      },
      {
        name: 'Nails (uñas)',
        desc: 'Servicio de uñas: esculpidas, semipermanente o kapping, con diseño y terminación profesional a tu estilo.',
        badges: ['Uñas'],
        image: '/pestanas.png',
      },
    ],
  },
  {
    id: 'especialidades',
    label: 'Especialidades',
    services: [
      {
        name: 'Depilación definitiva',
        desc: 'Piel lisa y cuidada en el tiempo, con tecnología y seguimiento profesional. Cada sesión avanza hacia tu comodidad y confianza.',
        badges: ['Definitivo'],
        image: '/depilacion.png',
        illustration: 'depilacionDefinitiva',
      },
      {
        name: 'Eliminación de tatuajes',
        desc: 'Protocolo láser Neatcell con enfoque en seguridad y resultados progresivos. Piel acompañada, información clara, en cada paso.',
        badges: ['Especialidad'],
        image: '/tatuajes.png',
        illustration: 'eliminacionTatuajes',
      },
    ],
  },
];

export const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  Reductor: { bg: 'rgba(191,201,162,0.3)', color: '#4A6741' },
  Tonificador: { bg: 'rgba(0,61,91,0.10)', color: '#003D5B' },
  Reafirmante: { bg: 'rgba(0,61,91,0.10)', color: '#003D5B' },
  Drenante: { bg: 'rgba(191,201,162,0.3)', color: '#4A6741' },
  Terapéutico: { bg: 'rgba(0,61,91,0.10)', color: '#003D5B' },
  Relajante: { bg: 'rgba(242,215,213,0.55)', color: '#8B4A5A' },
  Lashista: { bg: 'rgba(242,215,213,0.55)', color: '#8B4A5A' },
  Facial: { bg: 'rgba(242,215,213,0.55)', color: '#8B4A5A' },
  Manicura: { bg: 'rgba(245,230,218,0.6)', color: '#7A5A3A' },
  'Uñas': { bg: 'rgba(245,230,218,0.6)', color: '#7A5A3A' },
  Definitivo: { bg: 'rgba(0,61,91,0.10)', color: '#003D5B' },
  Especialidad: { bg: 'rgba(245,230,218,0.6)', color: '#7A5A3A' },
};

export function getAllServiceNames(): string[] {
  return serviciosCatalogo.flatMap(c => c.services.map(s => s.name));
}
