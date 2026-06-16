// src/features/portal/components/SelectorZona.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { ZonaCuerpo } from '@/lib/analizadorApi';

// ─── Definición de zonas ─────────────────────────────────────────────────────

interface ZonaInfo {
  id: ZonaCuerpo;
  label: string;
  emoji: string;
  descripcion: string;
  tratamientosEjemplo: string[];
  color: string;
}

const ZONAS: ZonaInfo[] = [
  {
    id: 'rostro',
    label: 'Rostro',
    emoji: '😊',
    descripcion: 'Frente, mejillas, nariz, mentón',
    tratamientosEjemplo: ['Hidratación facial', 'Limpieza profunda', 'Anti-age'],
    color: 'rgba(242,215,213,0.5)',
  },
  {
    id: 'cuello',
    label: 'Cuello',
    emoji: '🦢',
    descripcion: 'Zona cervical y submentoniana',
    tratamientosEjemplo: ['Lifting cervical', 'Hidratación', 'Tensor'],
    color: 'rgba(191,201,162,0.4)',
  },
  {
    id: 'escote',
    label: 'Escote',
    emoji: '✨',
    descripcion: 'Pecho superior y clavículas',
    tratamientosEjemplo: ['Rejuvenecimiento', 'Manchas', 'Hidratación'],
    color: 'rgba(184,149,110,0.25)',
  },
  {
    id: 'espalda',
    label: 'Espalda',
    emoji: '🔙',
    descripcion: 'Zona dorsal completa',
    tratamientosEjemplo: ['Acné dorsal', 'Exfoliación', 'Hidratación'],
    color: 'rgba(242,215,213,0.4)',
  },
  {
    id: 'brazos',
    label: 'Brazos',
    emoji: '💪',
    descripcion: 'Antebrazos, codos y axilas',
    tratamientosEjemplo: ['Depilación', 'Reafirmación', 'Manchas'],
    color: 'rgba(191,201,162,0.35)',
  },
  {
    id: 'abdomen',
    label: 'Abdomen',
    emoji: '🌟',
    descripcion: 'Zona abdominal y flancos',
    tratamientosEjemplo: ['Reafirmación', 'Reducción', 'Estrías'],
    color: 'rgba(184,149,110,0.2)',
  },
  {
    id: 'piernas',
    label: 'Piernas',
    emoji: '🦵',
    descripcion: 'Muslos, rodillas y pantorrillas',
    tratamientosEjemplo: ['Celulitis', 'Depilación', 'Reafirmación'],
    color: 'rgba(242,215,213,0.45)',
  },
  {
    id: 'manos',
    label: 'Manos',
    emoji: '🤲',
    descripcion: 'Dorso, dedos y uñas',
    tratamientosEjemplo: ['Rejuvenecimiento', 'Manchas', 'Hidratación'],
    color: 'rgba(191,201,162,0.4)',
  },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  onSeleccionar: (zona: ZonaCuerpo) => void;
  onVolver: () => void;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function SelectorZona({ onSeleccionar, onVolver }: Props) {
  const [hoveredZona, setHoveredZona] = useState<ZonaCuerpo | null>(null);

  const zonaHovered = ZONAS.find((z) => z.id === hoveredZona) ?? null;

  return (
    <div className="space-y-4">

      {/* Header de sección */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onVolver}
          className="flex h-9 w-9 items-center justify-center rounded-2xl"
          style={{
            background: 'rgba(0,61,91,0.07)',
            border: '1px solid rgba(0,61,91,0.12)',
          }}
        >
          <ArrowLeft className="h-4 w-4" style={{ color: 'var(--primary-navy)' }} />
        </motion.button>
        <div>
          <h3
            className="text-serif-premium text-lg font-bold"
            style={{ color: 'var(--primary-navy)' }}
          >
            ¿Qué zona querés analizar?
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Seleccioná la zona para personalizar el análisis
          </p>
        </div>
      </div>

      {/* Preview de zona hovered (escritorio) */}
      <motion.div
        animate={{
          opacity: zonaHovered ? 1 : 0,
          height: zonaHovered ? 'auto' : 0,
        }}
        className="overflow-hidden"
      >
        {zonaHovered && (
          <motion.div
            key={zonaHovered.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl px-5 py-4"
            style={{
              background: zonaHovered.color,
              border: '1px solid rgba(0,61,91,0.1)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{zonaHovered.emoji}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--primary-navy)' }}>
                  {zonaHovered.label} — {zonaHovered.descripcion}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Tratamientos frecuentes:{' '}
                  <span className="font-medium">
                    {zonaHovered.tratamientosEjemplo.join(' · ')}
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Grid de zonas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ZONAS.map((zona, i) => (
          <motion.button
            key={zona.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onHoverStart={() => setHoveredZona(zona.id)}
            onHoverEnd={() => setHoveredZona(null)}
            onClick={() => onSeleccionar(zona.id)}
            className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl p-5 text-left transition-shadow"
            style={{
              background: 'rgba(253,248,245,0.95)',
              border: '1px solid var(--accent-rose)',
              boxShadow: '0 4px 20px rgba(0,61,91,0.06)',
            }}
          >
            {/* Fondo de color al hover */}
            <motion.div
              className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: zona.color }}
            />

            {/* Contenido */}
            <div className="relative flex flex-col items-center gap-2 w-full">
              {/* Emoji en círculo */}
              <motion.div
                whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.4 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                style={{ background: zona.color }}
              >
                {zona.emoji}
              </motion.div>

              {/* Label */}
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--primary-navy)' }}
              >
                {zona.label}
              </p>

              {/* Descripción */}
              <p
                className="text-center text-[10px] leading-tight"
                style={{ color: 'var(--text-muted)' }}
              >
                {zona.descripcion}
              </p>
            </div>

            {/* Indicador "seleccionar" al hover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1 }}
              className="relative mt-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: 'var(--primary-navy)',
                color: 'white',
              }}
            >
              Analizar
            </motion.div>
          </motion.button>
        ))}
      </div>

      {/* Nota al pie */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        💡 Cuanto más específica sea la zona, más preciso será el análisis
      </motion.p>
    </div>
  );
}