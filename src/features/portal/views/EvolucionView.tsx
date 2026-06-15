import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Camera, ChevronLeft, ChevronRight, Eye, Plus, TrendingUp, User } from 'lucide-react';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import { useAuth } from '@/context/AuthContext';
import { usePortalCliente } from '@/context/PortalClienteContext';
import { PortalTreatmentEmptyPlaceholder } from '../components/PortalTreatmentEmptyPlaceholder';
import SubirFotoClienteModal from './SubirFotoClienteModal';
import { TratamientoSelector } from '../components/TratamientoSelector';

export function EvolucionView() {
  const { session } = useAuth();
  const {
    activeTreatment,
    sessions,
    beforeAfterPairs,
    fotosCliente,
    tratamientoActivoId,
    refreshTratamiento,
  } = usePortalCliente();
  const [currentPair, setCurrentPair] = useState(0);
  const [subirOpen, setSubirOpen] = useState(false);

  const clienteId = session?.user?.id ?? '';

  // Si no hay tratamiento activo, igual mostramos el placeholder original
  if (!activeTreatment) {
    return (
      <div className="space-y-6">
        <PortalTreatmentEmptyPlaceholder
          title="Todavía no hay fotos comparativas"
          paragraph="En esta sección vas a comparar antes y después cuando registremos tu primera sesión. Es una forma muy clara de ver tu avance."
        />
      </div>
    );
  }

  const hayPares = beforeAfterPairs.length > 0;
  const pair = hayPares ? beforeAfterPairs[currentPair] : null;

  return (
  <div className="space-y-6">
    <TratamientoSelector />
    {/* Stats */}
    <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Camera, value: String(fotosCliente.length + sessions.filter((s) => s.foto).length), label: 'Fotos de Progreso' },
          { icon: TrendingUp, value: `${Math.round((activeTreatment.sesionesCompletadas / Math.max(activeTreatment.totalSesiones, 1)) * 100)}%`, label: 'Progreso del Plan' },
          { icon: Award, value: String(activeTreatment.sesionesCompletadas), label: 'Sesiones Registradas' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass flex items-center gap-4 rounded-2xl p-5"
          >
            <div className="rounded-xl bg-champagne-50 p-3">
              <s.icon className="h-5 w-5 text-champagne" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#003D5B]">{s.value}</p>
              <p className="text-xs text-[#7A746E]">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comparación Antes & Después (solo si hay pares del admin) */}
      {hayPares && pair ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-strong overflow-hidden rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="rounded-lg bg-[#003D5B] p-1.5">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-serif-premium text-lg font-bold text-[#003D5B]">
                  Comparación Antes & Después
                </h3>
              </div>
              <p className="text-sm text-[#7A746E]">Desliza el controlador para comparar tu progreso</p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentPair((p) => (p === 0 ? beforeAfterPairs.length - 1 : p - 1))}
              className="rounded-full border border-[#F2D7D5]/70 bg-[#FDF8F5]/90 p-2 text-[#7A746E] transition-all hover:border-[#BFC9A2] hover:text-[#003D5B]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              {beforeAfterPairs.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPair(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentPair
                      ? 'w-8 bg-gradient-to-r from-[#BFC9A2] to-[#003D5B]'
                      : 'w-2 bg-gray-200 hover:bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentPair((p) => (p === beforeAfterPairs.length - 1 ? 0 : p + 1))}
              className="rounded-full border border-[#F2D7D5]/70 bg-[#FDF8F5]/90 p-2 text-[#7A746E] transition-all hover:border-[#BFC9A2] hover:text-[#003D5B]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={pair.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BeforeAfterSlider beforeSrc={pair.before} afterSrc={pair.after} />
              <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F2D7D5]/20 px-5 py-3">
                <p className="text-sm font-bold text-[#003D5B]">{pair.title}</p>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#003D5B]">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#BFC9A2] animate-pulse" />
                  {pair.improvement}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1">
            {beforeAfterPairs.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPair(idx)}
                className={`group relative shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                  idx === currentPair ? 'border-[#003D5B] shadow-soft' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <div className="flex h-14 w-20">
                  <img src={p.before} alt="Antes" className="h-full w-1/2 object-cover" />
                  <img src={p.after} alt="Después" className="h-full w-1/2 object-cover" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        // Cuando aún no hay pares comparativos del admin
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-6 text-center"
        >
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2D7D5]/40">
            <Eye className="h-5 w-5 text-[#003D5B]/60" />
          </div>
          <p className="text-sm font-semibold text-[#003D5B]">
            Tu comparación Antes & Después aparecerá acá
          </p>
          <p className="mt-1 text-xs text-[#7A746E]">
            El equipo Amore subirá las fotos comparativas a medida que avances en tus sesiones.
          </p>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MI SEGUIMIENTO PERSONAL — Fotos subidas por el cliente */}
      {/* ═══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-strong rounded-2xl p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="rounded-lg bg-[#BFC9A2]/25 p-1.5">
                <User className="h-4 w-4 text-[#003D5B]" />
              </div>
              <h3 className="text-serif-premium text-lg font-bold text-[#003D5B]">
                Mi seguimiento personal
              </h3>
            </div>
            <p className="text-xs text-[#7A746E]">
              Fotos que vos misma vas subiendo para llevar tu propio registro.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSubirOpen(true)}
            disabled={!tratamientoActivoId}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white shadow disabled:opacity-40"
            style={{
              background: 'linear-gradient(90deg, #BFC9A2 0%, #003D5B 100%)',
              boxShadow: '0 8px 20px rgba(0,61,91,0.18)',
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Subir foto
          </button>
        </div>

        {fotosCliente.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#003D5B]/15 bg-white/40 py-10 text-center">
            <Camera className="mx-auto h-8 w-8 text-[#B8956E]/70" />
            <p className="mt-2 text-sm font-semibold text-[#003D5B]">
              Todavía no subiste ninguna foto
            </p>
            <p className="mt-1 text-xs text-[#7A746E]">
              Tocá <strong>Subir foto</strong> para empezar tu seguimiento personal.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {fotosCliente.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-xl"
              >
                <img
                  src={f.url_foto}
                  alt={f.descripcion ?? 'Foto personal'}
                  className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span
                  className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                  style={{ background: 'rgba(0,61,91,0.85)' }}
                >
                  Subida por vos
                </span>
                {f.descripcion ? (
                  <p className="absolute bottom-2 left-2 right-2 line-clamp-2 text-[10px] font-medium text-white">
                    {f.descripcion}
                  </p>
                ) : null}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Galería de sesiones (fotos del admin asociadas a sesiones) */}
      {sessions.some((s) => s.foto) ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-strong rounded-2xl p-6"
        >
          <h3 className="text-serif-premium mb-4 text-lg font-bold text-[#003D5B]">
            Galería de Sesiones
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {sessions
              .filter((s) => s.foto)
              .map((s, i) => (
                <motion.div
                  key={s.nro}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="group relative overflow-hidden rounded-xl"
                >
                  <img
                    src={s.foto}
                    alt={`Sesión ${s.nro}`}
                    className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-2 left-2 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    Sesión {s.nro}
                  </span>
                </motion.div>
              ))}
          </div>
        </motion.div>
      ) : null}

      {/* Modal subir foto cliente */}
      <AnimatePresence>
        {subirOpen && tratamientoActivoId && clienteId ? (
          <SubirFotoClienteModal
            tratamientoId={tratamientoActivoId}
            clienteId={clienteId}
            onClose={() => setSubirOpen(false)}
            onUploaded={async () => {
              setSubirOpen(false);
              await refreshTratamiento();
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}