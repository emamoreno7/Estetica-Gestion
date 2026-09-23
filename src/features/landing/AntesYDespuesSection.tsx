/**
 * Sección "Antes & Después" — social proof interactivo en la landing.
 *
 * Carrusel de casos reales con slider arrastrable para comparar
 * el antes y después. Las imágenes optimizadas WebP viven en /public/casos/.
 * Los JPG originales se conservan sin retoques y sirven como fuente.
 * Publicar únicamente resultados y testimonios verificables/autorizados.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Sparkles, Star } from 'lucide-react';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import { asset } from '@/lib/asset';

type Caso = {
  slug: string;
  titulo: string;
  tratamiento: string;
  sesiones: string;
  testimonio: string;
  cliente: string;
  beforeSrc: string;
  afterSrc: string;
};

const CASOS: Caso[] = [
  {
    slug: 'body-up-abdomen',
    titulo: 'Modelado abdominal',
    tratamiento: 'Body Up + Radiofrecuencia',
    sesiones: '8 sesiones',
    testimonio:
      'No buscaba un resultado mágico, buscaba acompañamiento. Las chicas me explicaron todo en cada sesión y vi mi piel cambiar.',
    cliente: 'Sofía R.',
    beforeSrc: asset('casos/body-up-antes.webp'),
    afterSrc: asset('casos/body-up-despues.webp'),
  },
  {
    slug: 'criolipolisis-piernas',
    titulo: 'Reducción zona muslos',
    tratamiento: 'Crio-lipólisis',
    sesiones: '4 sesiones',
    testimonio:
      'Lo más lindo es entrar y sentir que es tu momento. La crio fue mucho más cómoda de lo que pensaba.',
    cliente: 'Mariela B.',
    beforeSrc: asset('casos/crio-antes.webp'),
    afterSrc: asset('casos/crio-despues.webp'),
  },
  {
    slug: 'lifting-pestanas',
    titulo: 'Lifting de pestañas',
    tratamiento: 'Lifting + Tinte',
    sesiones: '1 sesión',
    testimonio:
      'Mi mirada cambió. Es sutil pero la diferencia entre maquillarme y no maquillarme se nota muchísimo.',
    cliente: 'Camila G.',
    beforeSrc: asset('casos/pestanas-antes.webp'),
    afterSrc: asset('casos/pestanas-despues.webp'),
  },
  {
    slug: 'depilacion-piernas',
    titulo: 'Depilación definitiva',
    tratamiento: 'Láser diodo',
    sesiones: '6 sesiones',
    testimonio:
      'Ya no me preocupo por la depilación cada semana. La constancia y la atención hicieron toda la diferencia.',
    cliente: 'Laura M.',
    beforeSrc: asset('casos/depilacion-antes.webp'),
    afterSrc: asset('casos/depilacion-despues.webp'),
  },
];

export function AntesYDespuesSection() {
  const [idx, setIdx] = useState(0);
  const caso = CASOS[idx];

  function next() {
    setIdx((i) => (i + 1) % CASOS.length);
  }
  function prev() {
    setIdx((i) => (i - 1 + CASOS.length) % CASOS.length);
  }

  return (
    <section
      className="relative px-4 py-24 sm:px-10 lg:py-32"
      style={{ background: 'linear-gradient(180deg, #FDF8F5 0%, #FBEEE6 100%)' }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-20 top-10 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: 'rgba(191,201,162,0.20)' }}
        />
        <div
          className="absolute -right-20 bottom-10 h-[460px] w-[460px] rounded-full blur-3xl"
          style={{ background: 'rgba(242,215,213,0.30)' }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="mb-14 text-center"
        >
          <p
            className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.38em]"
            style={{ color: 'var(--accent-sage)' }}
          >
            <Sparkles className="h-3 w-3" />
            Resultados reales
          </p>
          <h2
            className="text-serif-premium mx-auto max-w-xl text-3xl font-light leading-snug sm:text-5xl"
            style={{ color: 'var(--primary-navy)' }}
          >
            Antes & Después
          </h2>
          <div className="mx-auto mt-5 flex items-center justify-center gap-3">
            <div className="h-px w-14" style={{ background: 'var(--accent-rose)' }} />
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent-rose)' }} />
            <div className="h-px w-14" style={{ background: 'var(--accent-rose)' }} />
          </div>
          <p
            className="mx-auto mt-5 max-w-xl text-sm leading-7 sm:text-base"
            style={{ color: 'var(--text-muted)' }}
          >
            Arrastrá el control para ver la evolución. Cada caso es de una persona real acompañada en Amore.
          </p>
        </motion.div>

        {/* ─── Slider + info ─── */}
        <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* Slider */}
          <motion.div
            key={caso.slug}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <BeforeAfterSlider
              beforeSrc={caso.beforeSrc}
              afterSrc={caso.afterSrc}
              beforeLabel="ANTES"
              afterLabel="DESPUÉS"
            />
            {/* Navegación */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={prev}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#003D5B]/10 bg-white text-[#003D5B] shadow-sm transition hover:scale-105"
                aria-label="Caso anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-1.5">
                {CASOS.map((c, i) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setIdx(i)}
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: i === idx ? 28 : 8,
                      background:
                        i === idx ? 'var(--primary-navy)' : 'rgba(0,61,91,0.20)',
                    }}
                    aria-label={`Ver caso ${i + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={next}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#003D5B]/10 bg-white text-[#003D5B] shadow-sm transition hover:scale-105"
                aria-label="Caso siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          {/* Info del caso */}
          <motion.div
            key={`info-${caso.slug}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl border border-[#F2D7D5]/55 bg-white/85 p-7 shadow-xl backdrop-blur-sm sm:p-9"
          >
            <p
              className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: 'var(--accent-sage)' }}
            >
              {caso.tratamiento}
            </p>
            <h3
              className="text-serif-premium text-2xl font-light leading-tight sm:text-3xl"
              style={{ color: 'var(--primary-navy)' }}
            >
              {caso.titulo}
            </h3>

            <div className="mt-5 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Star className="h-3.5 w-3.5" fill="#BFC9A2" stroke="#BFC9A2" />
              <span>{caso.sesiones} · resultado documentado</span>
            </div>

            <div className="my-6 h-px w-12" style={{ background: 'var(--accent-rose)' }} />

            <Quote className="h-5 w-5 opacity-30" style={{ color: 'var(--primary-navy)' }} />
            <p
              className="mt-2 text-[15px] italic leading-[1.7] sm:text-base"
              style={{ color: 'var(--text-muted)' }}
            >
              "{caso.testimonio}"
            </p>
            <p
              className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: 'var(--primary-navy)' }}
            >
              — {caso.cliente}
            </p>

            <div className="mt-7 rounded-2xl bg-[#FDF8F5] p-4 text-[11px] leading-5" style={{ color: 'var(--text-muted)' }}>
              <strong className="text-[#003D5B]">¿Querés un caso así?</strong> Reservá tu evaluación gratuita y armamos un
              plan a tu medida.
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
