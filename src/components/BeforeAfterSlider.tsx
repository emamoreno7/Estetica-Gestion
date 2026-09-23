import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GripHorizontal } from 'lucide-react';

interface Props {
  beforeSrc: string;
  afterSrc: string;
  beforeSrcSet?: string;
  afterSrcSet?: string;
  imageSizes?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeSrcSet,
  afterSrcSet,
  imageSizes,
  beforeLabel = 'ANTES',
  afterLabel = 'DESPUÉS',
}: Props) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const update = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(3, Math.min(97, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(true);
      setHasInteracted(true);
      update(e.clientX);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [update]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      update(e.clientX);
    },
    [dragging, update]
  );

  const onPointerUp = useCallback(() => setDragging(false), []);

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="group"
      aria-label="Comparador fotográfico antes y después"
      className="ba-slider-container relative w-full overflow-hidden rounded-2xl"
      style={{ aspectRatio: '16 / 10' }}
    >
      {/* After image (full background) */}
      <div className="absolute inset-0">
        <img
          src={afterSrc}
          srcSet={afterSrcSet}
          sizes={imageSizes}
          loading="lazy"
          decoding="async"
          alt={afterLabel}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      {/* Before image (clipped from left) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeSrc}
          srcSet={beforeSrcSet}
          sizes={imageSizes}
          loading="lazy"
          decoding="async"
          alt={beforeLabel}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none" />

      {/* ═══ Slider Line + Handle ═══ */}
      <div
        className="absolute top-0 z-20 h-full"
        style={{ left: `${position}%`, transform: 'translateX(-50%)', width: '2px' }}
      >
        {/* White line */}
        <div className="absolute inset-0 bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]" />

        {/* Handle */}
        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            role="slider"
            tabIndex={0}
            aria-label="Comparar fotos antes y después"
            aria-valuemin={3}
            aria-valuemax={97}
            aria-valuenow={Math.round(position)}
            aria-valuetext={Math.round(position) + ' por ciento de la fotografía anterior visible'}
            onKeyDown={(event) => {
              let next = position;
              if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next -= 5;
              else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next += 5;
              else if (event.key === 'Home') next = 3;
              else if (event.key === 'End') next = 97;
              else return;
              event.preventDefault();
              setHasInteracted(true);
              setPosition(Math.min(97, Math.max(3, next)));
            }}
            animate={{
              scale: dragging ? 1.18 : 1,
              boxShadow: dragging
                ? '0 0 28px rgba(212, 165, 116, 0.5), 0 4px 20px rgba(0,0,0,0.15)'
                : '0 0 12px rgba(255,255,255,0.3), 0 4px 16px rgba(0,0,0,0.1)',
            }}
            transition={{ duration: 0.15 }}
            className="flex h-12 w-12 cursor-ew-resize items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br from-[#d4a574] via-[#c9b99a] to-[#b8a88a] shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#103a4d]"
          >
            <GripHorizontal className="h-5 w-5 text-white drop-shadow-sm" />
          </motion.div>
        </div>
      </div>

      {/* ═══ Labels ═══ */}
      {/* Before — top left */}
      <motion.div
        animate={{ opacity: position > 10 ? 1 : 0, x: position > 10 ? 0 : -8 }}
        transition={{ duration: 0.2 }}
        className="absolute left-4 top-4 z-10"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/80" />
          {beforeLabel}
        </span>
      </motion.div>

      {/* After — top right */}
      <motion.div
        animate={{ opacity: position < 90 ? 1 : 0, x: position < 90 ? 0 : 8 }}
        transition={{ duration: 0.2 }}
        className="absolute right-4 top-4 z-10"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#d4a574] to-[#c9b99a] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/80" />
          {afterLabel}
        </span>
      </motion.div>

      {/* Bottom center — instruction or percentage */}
      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
        <motion.div
          animate={{ opacity: dragging ? 1 : hasInteracted ? 0 : 0.8 }}
          className="rounded-full bg-black/40 px-4 py-1.5 text-center backdrop-blur-md"
        >
          {dragging ? (
            <span className="text-[11px] font-bold text-white tabular-nums">
              {Math.round(position)}% visible
            </span>
          ) : hasInteracted ? null : (
            <span className="text-[11px] font-medium text-white/90">
              ← Desliza para comparar →
            </span>
          )}
        </motion.div>
      </div>
    </div>
  );
}
