// src/features/portal/components/ResultadoAnalisis.tsx
import { motion } from 'framer-motion';
import {
  RotateCcw,
  Sparkles,
  Calendar,
  Clock,
  Lightbulb,
  MessageCircle,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import type { ResultadoAnalisisIA, ZonaCuerpo } from '@/lib/analizadorApi';

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  resultado: ResultadoAnalisisIA;
  zona: ZonaCuerpo;
  imagenCapturada: File | null;
  onReiniciar: () => void;
  analisisRestantes: number;
  puedeAnalizar: boolean;
}

// ─── Helpers visuales ────────────────────────────────────────────────────────

const ZONA_LABELS: Record<ZonaCuerpo, string> = {
  rostro: 'Rostro',
  cuello: 'Cuello',
  escote: 'Escote',
  espalda: 'Espalda',
  brazos: 'Brazos',
  abdomen: 'Abdomen',
  piernas: 'Piernas',
  manos: 'Manos',
};

function urgenciaBadge(nivel: 'bajo' | 'medio' | 'alto') {
  const map = {
    bajo: {
      bg: 'rgba(191,201,162,0.35)',
      text: '#3a5c1a',
      label: 'Atención preventiva',
      icon: '🟢',
    },
    medio: {
      bg: 'rgba(184,149,110,0.25)',
      text: '#7a4a10',
      label: 'Atención recomendada',
      icon: '🟡',
    },
    alto: {
      bg: 'rgba(242,215,213,0.6)',
      text: '#8B3A3A',
      label: 'Atención prioritaria',
      icon: '🔴',
    },
  };
  return map[nivel] ?? map.bajo;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function ResultadoAnalisis({
  resultado,
  zona,
  imagenCapturada,
  onReiniciar,
  analisisRestantes,
  puedeAnalizar,
}: Props) {
  const badge = urgenciaBadge(resultado.nivel_urgencia);

  // URL de preview de la imagen (si existe)
  const previewUrl = imagenCapturada ? URL.createObjectURL(imagenCapturada) : null;

  // Link de WhatsApp con contexto del análisis
  const waTexto = encodeURIComponent(
    `Hola Amore! Hice el análisis de mi ${ZONA_LABELS[zona]} y me recomendaron "${resultado.tratamiento_recomendado}". ¿Podemos coordinar una consulta?`
  );
  const waHref = `https://wa.me/5491100000000?text=${waTexto}`;

  return (
    <div className="space-y-5">

      {/* ── Header de resultado ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(191,201,162,0.3) 0%, rgba(242,215,213,0.3) 100%)',
          border: '1px solid rgba(191,201,162,0.5)',
          boxShadow: '0 12px 40px rgba(0,61,91,0.08)',
        }}
      >
        {/* Círculo decorativo */}
        <div
          className="absolute -right-8 -top-8 h-32 w-32 rounded-full"
          style={{ background: 'rgba(242,215,213,0.25)' }}
        />

        <div className="relative flex items-start gap-4">
          {/* Preview de imagen */}
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex-shrink-0 overflow-hidden rounded-2xl"
              style={{
                width: '72px',
                height: '72px',
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: '0 4px 16px rgba(0,61,91,0.15)',
              }}
            >
              <img
                src={previewUrl}
                alt="Foto analizada"
                className="h-full w-full object-cover"
              />
            </motion.div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--primary-navy)' }} />
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--primary-navy)' }}
              >
                Análisis completado · {ZONA_LABELS[zona]}
              </p>
            </div>
            <h3
              className="text-serif-premium text-xl font-bold leading-tight"
              style={{ color: 'var(--primary-navy)' }}
            >
              {resultado.tratamiento_recomendado}
            </h3>

            {/* Badge urgencia */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: badge.bg, color: badge.text }}
            >
              {badge.icon} {badge.label}
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* ── Diagnóstico ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-3xl p-5"
        style={{
          background: 'rgba(253,248,245,0.95)',
          border: '1px solid var(--accent-rose)',
          boxShadow: '0 8px 32px rgba(0,61,91,0.06)',
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: 'rgba(0,61,91,0.08)' }}
          >
            <ShieldCheck className="h-4 w-4" style={{ color: 'var(--primary-navy)' }} />
          </div>
          <h4 className="text-sm font-bold" style={{ color: 'var(--primary-navy)' }}>
            Diagnóstico
          </h4>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#4a4440' }}>
          {resultado.diagnostico}
        </p>
      </motion.div>

      {/* ── Plan recomendado ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-3xl p-5"
        style={{
          background: 'rgba(253,248,245,0.95)',
          border: '1px solid var(--accent-rose)',
          boxShadow: '0 8px 32px rgba(0,61,91,0.06)',
        }}
      >
        <div className="mb-4 flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: 'rgba(0,61,91,0.08)' }}
          >
            <TrendingUp className="h-4 w-4" style={{ color: 'var(--primary-navy)' }} />
          </div>
          <h4 className="text-sm font-bold" style={{ color: 'var(--primary-navy)' }}>
            Plan recomendado
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Sesiones */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center rounded-2xl py-4 px-3 text-center"
            style={{ background: 'rgba(191,201,162,0.2)', border: '1px solid rgba(191,201,162,0.4)' }}
          >
            <div
              className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(191,201,162,0.4)' }}
            >
              <Calendar className="h-5 w-5" style={{ color: '#3a5c1a' }} />
            </div>
            <p
              className="text-2xl font-bold"
              style={{ color: 'var(--primary-navy)' }}
            >
              {resultado.sesiones_recomendadas}
            </p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              sesiones
            </p>
          </motion.div>

          {/* Frecuencia */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="flex flex-col items-center justify-center rounded-2xl py-4 px-3 text-center"
            style={{ background: 'rgba(242,215,213,0.3)', border: '1px solid rgba(242,215,213,0.6)' }}
          >
            <div
              className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(242,215,213,0.5)' }}
            >
              <Clock className="h-5 w-5" style={{ color: '#8B3A3A' }} />
            </div>
            <p
              className="text-sm font-bold leading-tight"
              style={{ color: 'var(--primary-navy)' }}
            >
              {resultado.frecuencia}
            </p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              frecuencia
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Tips ────────────────────────────────────────────────────── */}
      {resultado.tips && resultado.tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-3xl p-5"
          style={{
            background: 'rgba(253,248,245,0.95)',
            border: '1px solid var(--accent-rose)',
            boxShadow: '0 8px 32px rgba(0,61,91,0.06)',
          }}
        >
          <div className="mb-4 flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: 'rgba(0,61,91,0.08)' }}
            >
              <Lightbulb className="h-4 w-4" style={{ color: 'var(--primary-navy)' }} />
            </div>
            <h4 className="text-sm font-bold" style={{ color: 'var(--primary-navy)' }}>
              Tips para potenciar resultados
            </h4>
          </div>

          <div className="space-y-2.5">
            {resultado.tips.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-start gap-3 rounded-2xl px-4 py-3"
                style={{ background: 'rgba(0,61,91,0.04)', border: '1px solid rgba(0,61,91,0.06)' }}
              >
                <span
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white mt-0.5"
                  style={{ background: 'var(--primary-navy)' }}
                >
                  {i + 1}
                </span>
                <p className="text-xs leading-relaxed" style={{ color: '#4a4440' }}>
                  {tip}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── CTA WhatsApp ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-3xl p-5 text-center"
        style={{
          background: 'linear-gradient(135deg, #003D5B 0%, #005580 100%)',
          boxShadow: '0 16px 48px rgba(0,61,91,0.25)',
        }}
      >
        <p className="mb-1 text-sm font-semibold text-white">
          ¿Querés empezar este tratamiento?
        </p>
        <p
          className="mb-4 text-xs"
          style={{ color: 'rgba(253,248,245,0.75)' }}
        >
          Nuestras especialistas te esperan para una consulta personalizada
        </p>
        <motion.a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white"
          style={{
            background: '#25D366',
            boxShadow: '0 8px 24px rgba(37,211,102,0.3)',
          }}
        >
          <MessageCircle className="h-4 w-4" />
          Reservar consulta por WhatsApp
        </motion.a>
      </motion.div>

      {/* ── Acciones finales ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        {/* Nuevo análisis (si tiene créditos) */}
        {puedeAnalizar && (
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReiniciar}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
            style={{
              background: 'rgba(253,248,245,0.95)',
              border: '1px solid var(--accent-rose)',
              color: 'var(--primary-navy)',
              boxShadow: '0 4px 16px rgba(0,61,91,0.07)',
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Analizar otra zona
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: 'rgba(191,201,162,0.4)', color: '#3a5c1a' }}
            >
              {analisisRestantes} restante{analisisRestantes !== 1 ? 's' : ''}
            </span>
          </motion.button>
        )}

        {/* Volver al inicio siempre */}
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onReiniciar}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
          style={{
            color: 'var(--text-muted)',
            border: '1px solid rgba(0,61,91,0.12)',
            background: 'white',
          }}
        >
          <RotateCcw className="h-4 w-4" />
          {puedeAnalizar ? 'Volver al inicio' : 'Volver'}
        </motion.button>
      </motion.div>

      {/* Nota análisis restantes */}
      {!puedeAnalizar && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          Usaste todos tus análisis gratuitos. Para más, visitanos en sede 💆‍♀️
        </motion.p>
      )}
    </div>
  );
}