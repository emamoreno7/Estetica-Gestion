/**
 * Ilustraciones editoriales para cada servicio del catálogo.
 *
 * Estilo: minimalista, femenino, tipo Aesop / Le Labo / Glossier.
 *   - Mucho aire / espacio negativo
 *   - Símbolo central simple y elegante, stroke fino
 *   - Número romano grande de fondo (decorativo, editorial)
 *   - Tipografía serif para textos sutiles
 *   - Paleta: navy, sage, rose, cream
 *   - Cada servicio tiene un símbolo único y reconocible
 *
 * Diseñado para verse impecable a cualquier tamaño (aspect 3/4).
 */

import type { JSX } from 'react';
import { motion } from 'framer-motion';

export type IllustrationKey =
  | 'bodyUp'
  | 'radiofrecuencia'
  | 'crio'
  | 'lipolaser'
  | 'electrodos'
  | 'cavitacion40k'
  | 'vacuum'
  | 'masajeRelajante'
  | 'masajeDescontracturante'
  | 'masajeLinfatico'
  | 'presoterapia'
  | 'piedrasCalientes'
  | 'liftingPestanas'
  | 'laminadoPestanas'
  | 'perfiladoCejas'
  | 'depilacionDefinitiva'
  | 'eliminacionTatuajes';

const NAVY = '#003D5B';
const SAGE = '#BFC9A2';
const ROSE = '#E8B4B8';

type Props = {
  variant: IllustrationKey;
  className?: string;
};

export function ServiceIllustration({ variant, className }: Props) {
  const conf = ILLUSTRATIONS[variant] ?? ILLUSTRATIONS.bodyUp;
  const Inner = conf.symbol;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{ width: '100%', height: '100%' }}
    >
      <svg
        viewBox="0 0 300 400"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={conf.title}
      >
        {/* Fondo gradient — cada servicio tiene su variación de tono */}
        <defs>
          <linearGradient id={`bg-${variant}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={conf.bgTop} />
            <stop offset="100%" stopColor={conf.bgBottom} />
          </linearGradient>
          <radialGradient id={`spotlight-${variant}`} cx="0.5" cy="0.45" r="0.6">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        <rect width="300" height="400" fill={`url(#bg-${variant})`} />
        <rect width="300" height="400" fill={`url(#spotlight-${variant})`} />

        {/* Número romano grande decorativo */}
        <text
          x="150"
          y="265"
          textAnchor="middle"
          fontFamily="Georgia, 'Cormorant Garamond', serif"
          fontStyle="italic"
          fontWeight="300"
          fontSize="180"
          fill={NAVY}
          opacity="0.06"
          style={{ letterSpacing: '0.05em' }}
        >
          {conf.roman}
        </text>

        {/* Eyebrow categoría arriba */}
        <text
          x="150"
          y="50"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="9"
          fill={NAVY}
          opacity="0.35"
          letterSpacing="3"
          style={{ textTransform: 'uppercase' }}
        >
          {conf.eyebrow}
        </text>

        {/* Línea separadora decorativa */}
        <line x1="135" y1="62" x2="165" y2="62" stroke={NAVY} strokeWidth="0.6" opacity="0.4" />

        {/* Símbolo central — cada servicio tiene el suyo */}
        <g transform="translate(150 210)">
          <Inner />
        </g>

        {/* Línea inferior */}
        <line x1="130" y1="360" x2="170" y2="360" stroke={NAVY} strokeWidth="0.6" opacity="0.35" />

        {/* Título italico abajo */}
        <text
          x="150"
          y="378"
          textAnchor="middle"
          fontFamily="Georgia, 'Cormorant Garamond', serif"
          fontStyle="italic"
          fontSize="13"
          fill={NAVY}
          opacity="0.65"
        >
          {conf.title}
        </text>
      </svg>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuración por servicio: paleta del fondo + roman + símbolo central
// El símbolo se renderiza dentro de un <g transform="translate(150 210)">
// así que cada Symbol dibuja con 0,0 como centro.
// ─────────────────────────────────────────────────────────────────────────────

type IllustrationConfig = {
  roman: string;
  eyebrow: string;
  title: string;
  bgTop: string;
  bgBottom: string;
  symbol: () => JSX.Element;
};

const ILLUSTRATIONS: Record<IllustrationKey, IllustrationConfig> = {
  // I. Body Up — flor de loto / pétalos abriéndose
  bodyUp: {
    roman: 'I',
    eyebrow: 'Corporal',
    title: 'Body Up',
    bgTop: '#FAEFE6',
    bgBottom: '#F5E0D6',
    symbol: () => (
      <g fill="none" stroke={NAVY} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Pétalo central vertical */}
        <path d="M0 -60 Q-8 -20 0 0 Q8 -20 0 -60 Z" />
        {/* Pétalos laterales */}
        <path d="M0 -50 Q-30 -28 -38 -5 Q-25 0 -10 -8 Q-3 -25 0 -50" />
        <path d="M0 -50 Q30 -28 38 -5 Q25 0 10 -8 Q3 -25 0 -50" />
        {/* Pétalos diagonales más bajos */}
        <path d="M-10 -10 Q-45 -5 -55 20 Q-35 25 -15 15 Q-8 0 -10 -10" />
        <path d="M10 -10 Q45 -5 55 20 Q35 25 15 15 Q8 0 10 -10" />
        {/* Punto central */}
        <circle cx="0" cy="-5" r="2.5" fill={SAGE} stroke="none" />
        {/* Base curva */}
        <path d="M-50 30 Q0 22 50 30" opacity="0.45" />
      </g>
    ),
  },

  // II. Radiofrecuencia — ondas concéntricas perfectas
  radiofrecuencia: {
    roman: 'II',
    eyebrow: 'Corporal',
    title: 'Radiofrecuencia',
    bgTop: '#F5E8E0',
    bgBottom: '#EAD5C8',
    symbol: () => (
      <g fill="none" strokeLinecap="round">
        <circle cx="0" cy="0" r="55" stroke={NAVY} strokeWidth="0.7" opacity="0.25" />
        <circle cx="0" cy="0" r="42" stroke={NAVY} strokeWidth="0.9" opacity="0.4" />
        <circle cx="0" cy="0" r="29" stroke={NAVY} strokeWidth="1.1" opacity="0.6" />
        <circle cx="0" cy="0" r="16" stroke={NAVY} strokeWidth="1.3" opacity="0.85" />
        <circle cx="0" cy="0" r="6" fill={ROSE} stroke="none" opacity="0.85" />
        <circle cx="0" cy="0" r="2.5" fill={NAVY} stroke="none" />
      </g>
    ),
  },

  // III. Crio-lipólisis — cristal hexagonal con destello
  crio: {
    roman: 'III',
    eyebrow: 'Corporal',
    title: 'Crio-lipólisis',
    bgTop: '#E8EFEF',
    bgBottom: '#D5DFE0',
    symbol: () => (
      <g fill="none" stroke={NAVY} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Estrella de 6 puntas / copo de nieve elegante */}
        <line x1="0" y1="-55" x2="0" y2="55" />
        <line x1="-48" y1="-28" x2="48" y2="28" />
        <line x1="-48" y1="28" x2="48" y2="-28" />
        {/* Puntas pequeñas en cada extremo */}
        <path d="M0 -55 L-6 -45 M0 -55 L6 -45" />
        <path d="M0 55 L-6 45 M0 55 L6 45" />
        <path d="M-48 -28 L-42 -36 M-48 -28 L-40 -22" />
        <path d="M48 28 L42 36 M48 28 L40 22" />
        <path d="M48 -28 L42 -22 M48 -28 L40 -36" />
        <path d="M-48 28 L-42 22 M-48 28 L-40 36" />
        {/* Hexágono central muy sutil */}
        <polygon points="0,-18 16,-9 16,9 0,18 -16,9 -16,-9" opacity="0.5" />
        <circle cx="0" cy="0" r="3" fill={SAGE} stroke="none" opacity="0.85" />
      </g>
    ),
  },

  // IV. Lipo-láser — tres rayos finos convergiendo + destello
  lipolaser: {
    roman: 'IV',
    eyebrow: 'Corporal',
    title: 'Lipo-láser',
    bgTop: '#F8E8E5',
    bgBottom: '#EFD4CF',
    symbol: () => (
      <g fill="none" strokeLinecap="round">
        {/* Tres rayos finos */}
        <line x1="-60" y1="-55" x2="-5" y2="-5" stroke={NAVY} strokeWidth="1.2" opacity="0.6" />
        <line x1="60" y1="-55" x2="5" y2="-5" stroke={NAVY} strokeWidth="1.2" opacity="0.6" />
        <line x1="0" y1="-70" x2="0" y2="-10" stroke={NAVY} strokeWidth="1.4" opacity="0.85" />
        {/* Punto focal central — destello */}
        <circle cx="0" cy="0" r="18" stroke={NAVY} strokeWidth="0.6" opacity="0.3" />
        <circle cx="0" cy="0" r="10" stroke={NAVY} strokeWidth="0.8" opacity="0.55" />
        <circle cx="0" cy="0" r="5" fill={ROSE} stroke="none" />
        {/* Reflejo */}
        <circle cx="-2" cy="-2" r="1.5" fill="#FFFFFF" stroke="none" opacity="0.9" />
        {/* Trazo expansivo abajo (energía) */}
        <path d="M-45 35 Q-15 25 0 30 Q15 25 45 35" stroke={NAVY} strokeWidth="0.8" opacity="0.4" />
      </g>
    ),
  },

  // V. Electrodos — línea de pulso/latido elegante
  electrodos: {
    roman: 'V',
    eyebrow: 'Corporal',
    title: 'Electrodos',
    bgTop: '#F5EFE6',
    bgBottom: '#E8DDCC',
    symbol: () => (
      <g fill="none" stroke={NAVY} strokeLinecap="round" strokeLinejoin="round">
        {/* Línea de pulso */}
        <path
          d="M-70 0 L-45 0 L-32 -28 L-18 28 L-5 -18 L8 18 L22 0 L45 0 L70 0"
          strokeWidth="1.5"
        />
        {/* Puntos en los extremos */}
        <circle cx="-70" cy="0" r="2.5" fill={NAVY} stroke="none" />
        <circle cx="70" cy="0" r="2.5" fill={NAVY} stroke="none" />
        {/* Aura central muy sutil */}
        <circle cx="-5" cy="-5" r="22" strokeWidth="0.5" opacity="0.18" />
        {/* Detalle inferior */}
        <line x1="-30" y1="38" x2="30" y2="38" strokeWidth="0.6" opacity="0.35" />
      </g>
    ),
  },

  // VI. Cavitación 40k — ondas ultrasónicas convergiendo en burbuja de cavitación
  cavitacion40k: {
    roman: 'VI',
    eyebrow: 'Corporal',
    title: 'Cavitación 40k',
    bgTop: '#E6EEF2',
    bgBottom: '#CFDEE6',
    symbol: () => (
      <g fill="none" stroke={NAVY} strokeLinecap="round">
        {/* Ondas ultrasónicas concéntricas emanando hacia el punto focal */}
        <path d="M-52 -38 A52 52 0 0 1 52 -38" strokeWidth="0.8" opacity="0.3" />
        <path d="M-39 -22 A39 39 0 0 1 39 -22" strokeWidth="1" opacity="0.5" />
        <path d="M-26 -6 A26 26 0 0 1 26 -6" strokeWidth="1.2" opacity="0.75" />
        {/* Burbuja de cavitación en el foco */}
        <circle cx="0" cy="10" r="7" fill={ROSE} stroke="none" opacity="0.9" />
        <circle cx="0" cy="10" r="11" strokeWidth="0.7" opacity="0.4" />
        {/* Micro-burbujas dispersándose */}
        <circle cx="-18" cy="32" r="2.6" fill={SAGE} stroke="none" opacity="0.85" />
        <circle cx="17" cy="34" r="2" fill={SAGE} stroke="none" opacity="0.7" />
        <circle cx="0" cy="42" r="1.5" fill={SAGE} stroke="none" opacity="0.55" />
        {/* Brillo */}
        <circle cx="-2.5" cy="7" r="1.6" fill="#FFFFFF" stroke="none" opacity="0.85" />
      </g>
    ),
  },

  // VII. Vacuum — cabezal de succión con flechas de tracción
  vacuum: {
    roman: 'VII',
    eyebrow: 'Corporal',
    title: 'Vacuum',
    bgTop: '#EAF0E4',
    bgBottom: '#D3DFC7',
    symbol: () => (
      <g fill="none" stroke={NAVY} strokeLinecap="round" strokeLinejoin="round">
        {/* Cabezal de ventosa (media cúpula) */}
        <path d="M-38 8 Q-38 -34 0 -34 Q38 -34 38 8" strokeWidth="1.3" />
        <line x1="-38" y1="8" x2="-38" y2="20" strokeWidth="1.1" opacity="0.85" />
        <line x1="38" y1="8" x2="38" y2="20" strokeWidth="1.1" opacity="0.85" />
        <path d="M-38 20 Q0 29 38 20" strokeWidth="1.1" opacity="0.65" />
        {/* Flechas de succión hacia el interior del cabezal */}
        <path d="M-17 -6 L-17 -20 M-21 -13 L-17 -20 L-13 -13" strokeWidth="0.9" opacity="0.6" />
        <path d="M17 -6 L17 -20 M13 -13 L17 -20 L21 -13" strokeWidth="0.9" opacity="0.6" />
        {/* Piel traccionada, ondulando debajo */}
        <path d="M-46 38 Q-20 48 0 40 Q20 48 46 38" strokeWidth="0.7" opacity="0.4" />
        {/* Punto de succión */}
        <circle cx="0" cy="-8" r="2.6" fill={ROSE} stroke="none" opacity="0.85" />
      </g>
    ),
  },

  // VIII. Masajes relajantes — flor minimalista (jazmín 5 pétalos)
  masajeRelajante: {
    roman: 'VIII',
    eyebrow: 'Bienestar',
    title: 'Masaje Relajante',
    bgTop: '#F8E8E8',
    bgBottom: '#EFD4D4',
    symbol: () => {
      const petals = [0, 1, 2, 3, 4];
      return (
        <g fill="none" stroke={NAVY} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
          {/* 5 pétalos alrededor */}
          {petals.map((i) => {
            const angle = (i * 72 - 90) * (Math.PI / 180);
            const cx = Math.cos(angle) * 32;
            const cy = Math.sin(angle) * 32;
            return (
              <ellipse
                key={i}
                cx={cx}
                cy={cy}
                rx="18"
                ry="10"
                transform={`rotate(${i * 72} ${cx} ${cy})`}
              />
            );
          })}
          {/* Centro */}
          <circle cx="0" cy="0" r="6" fill={SAGE} stroke="none" opacity="0.85" />
          <circle cx="0" cy="0" r="3" fill={NAVY} stroke="none" />
          {/* Hojas inferiores */}
          <path d="M-25 55 Q-15 48 0 50 Q15 48 25 55" opacity="0.45" />
        </g>
      );
    },
  },

  // VII. Masaje descontracturante — dos manos abstractas en armonía
  masajeDescontracturante: {
    roman: 'IX',
    eyebrow: 'Bienestar',
    title: 'Descontracturante',
    bgTop: '#EFE5DC',
    bgBottom: '#DCCBB8',
    symbol: () => (
      <g fill="none" stroke={NAVY} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Dos arcos opuestos (manos) */}
        <path d="M-50 -10 Q-30 -50 0 -40 Q30 -50 50 -10 Q40 30 0 35 Q-40 30 -50 -10 Z" opacity="0.85" />
        {/* Líneas internas — dedos abstractos */}
        <path d="M-30 -25 Q-20 -15 -15 0" opacity="0.5" />
        <path d="M-15 -32 Q-8 -20 -3 -5" opacity="0.5" />
        <path d="M0 -38 L0 -5" opacity="0.5" />
        <path d="M15 -32 Q8 -20 3 -5" opacity="0.5" />
        <path d="M30 -25 Q20 -15 15 0" opacity="0.5" />
        {/* Puntos de presión */}
        <circle cx="0" cy="10" r="2.5" fill={ROSE} stroke="none" />
        <circle cx="-18" cy="5" r="1.8" fill={SAGE} stroke="none" opacity="0.8" />
        <circle cx="18" cy="5" r="1.8" fill={SAGE} stroke="none" opacity="0.8" />
      </g>
    ),
  },

  // VIII. Masaje linfático — tres gotas en cascada vertical
  masajeLinfatico: {
    roman: 'X',
    eyebrow: 'Bienestar',
    title: 'Masaje Linfático',
    bgTop: '#E5ECE9',
    bgBottom: '#CFD9D5',
    symbol: () => (
      <g fill="none" stroke={NAVY} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* 3 gotas alineadas verticalmente, con tamaños distintos */}
        <path d="M0 -60 Q12 -45 12 -32 Q12 -22 0 -22 Q-12 -22 -12 -32 Q-12 -45 0 -60 Z" />
        <path d="M0 -10 Q15 8 15 22 Q15 35 0 35 Q-15 35 -15 22 Q-15 8 0 -10 Z" />
        <path d="M-25 50 Q-22 38 -16 35" opacity="0.45" />
        <path d="M25 50 Q22 38 16 35" opacity="0.45" />
        {/* Conexiones */}
        <line x1="0" y1="-22" x2="0" y2="-10" strokeDasharray="2 3" opacity="0.45" />
        {/* Brillo en gota más grande */}
        <ellipse cx="-4" cy="12" rx="2.5" ry="4" fill="#FFFFFF" stroke="none" opacity="0.7" />
        <circle cx="-2" cy="-40" r="1.5" fill="#FFFFFF" stroke="none" opacity="0.8" />
      </g>
    ),
  },

  // IX. Presoterapia — tres anillos elegantes apilados
  presoterapia: {
    roman: 'XI',
    eyebrow: 'Bienestar',
    title: 'Presoterapia',
    bgTop: '#F0E8E2',
    bgBottom: '#DECBBA',
    symbol: () => (
      <g fill="none" stroke={NAVY} strokeLinecap="round">
        {/* Tres "anillos" verticales con perspectiva */}
        <ellipse cx="0" cy="-45" rx="45" ry="8" strokeWidth="1.3" />
        <ellipse cx="0" cy="-15" rx="40" ry="7" strokeWidth="1.3" />
        <ellipse cx="0" cy="15" rx="35" ry="6" strokeWidth="1.3" />
        <ellipse cx="0" cy="45" rx="30" ry="5" strokeWidth="1.3" />
        {/* Líneas verticales conectoras laterales */}
        <line x1="-45" y1="-45" x2="-30" y2="45" strokeWidth="0.7" opacity="0.45" />
        <line x1="45" y1="-45" x2="30" y2="45" strokeWidth="0.7" opacity="0.45" />
        {/* Flechas que indican compresión */}
        <g opacity="0.55">
          <path d="M-60 0 L-50 0 M-54 -4 L-50 0 L-54 4" strokeWidth="0.9" />
          <path d="M60 0 L50 0 M54 -4 L50 0 L54 4" strokeWidth="0.9" />
        </g>
      </g>
    ),
  },

  // X. Piedras calientes — tres círculos apilados con destello
  piedrasCalientes: {
    roman: 'XII',
    eyebrow: 'Bienestar',
    title: 'Piedras Calientes',
    bgTop: '#F0E2DA',
    bgBottom: '#D9B8A4',
    symbol: () => (
      <g>
        {/* Vapor sutil */}
        <g fill="none" stroke={NAVY} strokeWidth="0.9" strokeLinecap="round" opacity="0.4">
          <path d="M-12 -75 Q-5 -65 -10 -55 Q-15 -45 -8 -38" />
          <path d="M5 -78 Q12 -68 7 -58 Q2 -48 9 -40" />
        </g>
        {/* Tres piedras apiladas */}
        <ellipse cx="0" cy="35" rx="50" ry="12" fill={NAVY} opacity="0.85" />
        <ellipse cx="0" cy="35" rx="50" ry="12" fill="none" stroke={NAVY} strokeWidth="0.8" />
        <ellipse cx="-3" cy="5" rx="42" ry="11" fill={NAVY} opacity="0.7" />
        <ellipse cx="-3" cy="5" rx="42" ry="11" fill="none" stroke={NAVY} strokeWidth="0.8" />
        <ellipse cx="2" cy="-22" rx="32" ry="9" fill={NAVY} opacity="0.55" />
        <ellipse cx="2" cy="-22" rx="32" ry="9" fill="none" stroke={NAVY} strokeWidth="0.8" />
        {/* Reflejos */}
        <ellipse cx="-12" cy="-25" rx="6" ry="1.5" fill="#FFFFFF" opacity="0.7" />
        <ellipse cx="-12" cy="2" rx="7" ry="1.5" fill="#FFFFFF" opacity="0.55" />
        <ellipse cx="-15" cy="33" rx="9" ry="1.5" fill="#FFFFFF" opacity="0.5" />
      </g>
    ),
  },

  // XI. Lifting de pestañas — arco con pestañas curvadas elegantes
  liftingPestanas: {
    roman: 'XIII',
    eyebrow: 'Mirada',
    title: 'Lifting de Pestañas',
    bgTop: '#F5E8E6',
    bgBottom: '#E4C9C6',
    symbol: () => (
      <g fill="none" stroke={NAVY} strokeLinecap="round">
        {/* Línea de párpado */}
        <path d="M-55 8 Q0 18 55 8" strokeWidth="1.8" />
        {/* Pestañas curvadas hacia arriba — graduación de longitud */}
        <path d="M-48 7 Q-48 -10 -52 -25" strokeWidth="1.2" />
        <path d="M-36 5 Q-37 -15 -40 -34" strokeWidth="1.2" />
        <path d="M-22 3 Q-22 -22 -22 -42" strokeWidth="1.2" />
        <path d="M-8 2 Q-7 -25 -5 -48" strokeWidth="1.2" />
        <path d="M8 2 Q7 -25 5 -48" strokeWidth="1.2" />
        <path d="M22 3 Q22 -22 22 -42" strokeWidth="1.2" />
        <path d="M36 5 Q37 -15 40 -34" strokeWidth="1.2" />
        <path d="M48 7 Q48 -10 52 -25" strokeWidth="1.2" />
        {/* Arco indicando elevación */}
        <path d="M-50 50 Q0 42 50 50" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.6" />
        {/* Flecha de lift */}
        <g opacity="0.7">
          <line x1="0" y1="62" x2="0" y2="48" strokeWidth="1" />
          <path d="M-4 53 L0 48 L4 53" strokeWidth="1" />
        </g>
      </g>
    ),
  },

  // XII. Laminado de pestañas — ojo abierto minimalista
  laminadoPestanas: {
    roman: 'XIV',
    eyebrow: 'Mirada',
    title: 'Laminado',
    bgTop: '#EFE5E2',
    bgBottom: '#DDC4C0',
    symbol: () => (
      <g fill="none" stroke={NAVY} strokeLinecap="round" strokeLinejoin="round">
        {/* Ojo almendrado abierto */}
        <path d="M-55 0 Q0 -22 55 0 Q0 22 -55 0 Z" strokeWidth="1.5" />
        {/* Iris */}
        <circle cx="0" cy="0" r="12" stroke={NAVY} strokeWidth="1.2" fill={SAGE} opacity="0.7" />
        <circle cx="0" cy="0" r="5" fill={NAVY} stroke="none" />
        {/* Brillo */}
        <circle cx="4" cy="-3" r="2" fill="#FFFFFF" stroke="none" opacity="0.95" />
        {/* Pestañas estilizadas, simétricas */}
        <line x1="-40" y1="-10" x2="-44" y2="-22" strokeWidth="1.1" />
        <line x1="-22" y1="-16" x2="-25" y2="-30" strokeWidth="1.1" />
        <line x1="-5" y1="-18" x2="-7" y2="-34" strokeWidth="1.1" />
        <line x1="12" y1="-17" x2="14" y2="-32" strokeWidth="1.1" />
        <line x1="30" y1="-13" x2="34" y2="-26" strokeWidth="1.1" />
        <line x1="46" y1="-7" x2="52" y2="-18" strokeWidth="1.1" />
        {/* Destello superior */}
        <path d="M-3 -45 L0 -52 L3 -45" strokeWidth="0.9" opacity="0.55" />
      </g>
    ),
  },

  // XIII. Perfilado de cejas — arco perfecto con destello
  perfiladoCejas: {
    roman: 'XV',
    eyebrow: 'Mirada',
    title: 'Perfilado de Cejas',
    bgTop: '#F0E6DC',
    bgBottom: '#DCC7AB',
    symbol: () => (
      <g fill="none" stroke={NAVY} strokeLinecap="round">
        {/* Arco principal de ceja */}
        <path
          d="M-60 5 Q-35 -25 0 -22 Q35 -18 55 0"
          strokeWidth="3"
          opacity="0.85"
        />
        {/* Detalles internos del arco (mini-pelos) */}
        <line x1="-50" y1="-2" x2="-52" y2="-12" strokeWidth="0.9" opacity="0.6" />
        <line x1="-30" y1="-15" x2="-32" y2="-25" strokeWidth="0.9" opacity="0.7" />
        <line x1="-10" y1="-22" x2="-12" y2="-32" strokeWidth="0.9" opacity="0.75" />
        <line x1="12" y1="-20" x2="14" y2="-30" strokeWidth="0.9" opacity="0.7" />
        <line x1="32" y1="-12" x2="34" y2="-22" strokeWidth="0.9" opacity="0.6" />
        {/* Reflejo abajo (ojo cerrado abstracto) */}
        <path d="M-55 35 Q0 42 55 35" strokeWidth="1" opacity="0.45" />
        {/* Puntos de medida */}
        <circle cx="-55" cy="5" r="2.5" fill={ROSE} stroke="none" />
        <circle cx="0" cy="-22" r="2.5" fill={ROSE} stroke="none" />
        <circle cx="55" cy="0" r="2.5" fill={ROSE} stroke="none" />
      </g>
    ),
  },

  // XIV. Depilación definitiva — haz vertical de luz
  depilacionDefinitiva: {
    roman: 'XVI',
    eyebrow: 'Especialidades',
    title: 'Depilación Definitiva',
    bgTop: '#F0E2DE',
    bgBottom: '#D8B5AE',
    symbol: () => (
      <g>
        {/* Haz vertical (triángulo invertido) */}
        <defs>
          <linearGradient id="beam-dep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ROSE} stopOpacity="0.85" />
            <stop offset="100%" stopColor={ROSE} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points="-3,-70 3,-70 22,55 -22,55" fill="url(#beam-dep)" />
        {/* Núcleo del haz */}
        <line x1="0" y1="-70" x2="0" y2="55" stroke={NAVY} strokeWidth="1.2" opacity="0.85" />
        {/* Origen — punto brillante */}
        <circle cx="0" cy="-70" r="5" fill={NAVY} stroke="none" />
        <circle cx="0" cy="-70" r="2.5" fill="#FFFFFF" stroke="none" />
        {/* Línea de piel debajo */}
        <path d="M-65 60 Q0 52 65 60" stroke={NAVY} strokeWidth="1.3" fill="none" />
        {/* Brillos en la zona tratada */}
        <circle cx="-30" cy="50" r="1.5" fill="#FFFFFF" />
        <circle cx="30" cy="50" r="1.5" fill="#FFFFFF" />
        <circle cx="0" cy="58" r="1.8" fill="#FFFFFF" />
      </g>
    ),
  },

  // XV. Eliminación de tatuajes — degradado de visible a transparente
  eliminacionTatuajes: {
    roman: 'XVII',
    eyebrow: 'Especialidades',
    title: 'Eliminación de Tatuajes',
    bgTop: '#EFE5E5',
    bgBottom: '#D6BCBC',
    symbol: () => (
      <g>
        {/* Antes — forma sólida */}
        <g fill={NAVY}>
          <path d="M-55 -10 L-50 -25 L-40 -10 L-35 -25 L-30 -10 Z" />
          <path d="M-55 5 Q-50 -5 -45 5 Q-40 -5 -35 5 Q-30 -5 -25 5 Q-30 15 -45 15 Z" />
        </g>
        {/* Centro — desvaneciéndose */}
        <g fill={NAVY} opacity="0.5">
          <circle cx="-5" cy="-10" r="4" />
          <circle cx="5" cy="5" r="3" />
          <circle cx="0" cy="20" r="2.5" />
        </g>
        {/* Lado derecho — solo polvo */}
        <g fill={NAVY} opacity="0.18">
          <circle cx="35" cy="-5" r="1.5" />
          <circle cx="45" cy="5" r="1.2" />
          <circle cx="40" cy="15" r="1" />
          <circle cx="50" cy="-12" r="1" />
        </g>
        {/* Flecha que conecta el proceso */}
        <path
          d="M-25 35 L50 35 M44 30 L50 35 L44 40"
          stroke={NAVY}
          strokeWidth="0.9"
          fill="none"
          opacity="0.45"
          strokeLinecap="round"
        />
        {/* Línea de piel */}
        <path d="M-60 -45 Q0 -52 60 -45" stroke={NAVY} strokeWidth="1" fill="none" opacity="0.45" />
        {/* Destello en la zona ya limpia */}
        <circle cx="40" cy="-30" r="2.5" fill={ROSE} />
        <path d="M40 -36 L40 -24 M34 -30 L46 -30" stroke={ROSE} strokeWidth="0.7" opacity="0.7" />
      </g>
    ),
  },
};