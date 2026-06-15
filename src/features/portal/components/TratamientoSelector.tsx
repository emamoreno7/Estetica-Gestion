import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { usePortalCliente } from '@/context/PortalClienteContext';

/**
 * Selector de tratamientos activos.
 * Se muestra solo si hay 2 o más tratamientos.
 * Al hacer click cambia el tratamiento seleccionado en el context.
 */
export function TratamientoSelector() {
  const { tratamientos, tratamientoSeleccionadoIdx, setTratamientoSeleccionadoIdx } =
    usePortalCliente();

  // Si hay uno solo o ninguno, no mostramos nada
  if (tratamientos.length <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 overflow-hidden rounded-2xl border border-[#F2D7D5]/70 bg-white/80 p-1.5 shadow-md backdrop-blur-sm"
      style={{ boxShadow: '0 8px 32px rgba(0,61,91,0.08)' }}
    >
      {/* Etiqueta superior */}
      <div className="mb-1.5 flex items-center gap-1.5 px-2 pt-1">
        <Sparkles className="h-3 w-3 text-[#B8956E]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/50">
          Tus tratamientos activos
        </span>
      </div>

      {/* Tabs de tratamientos */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {tratamientos.map((t, idx) => {
          const seleccionado = idx === tratamientoSeleccionadoIdx;
          const pct =
            t.sesiones_totales > 0
              ? Math.round((t.sesiones_realizadas / t.sesiones_totales) * 100)
              : 0;

          return (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => setTratamientoSeleccionadoIdx(idx)}
              whileTap={{ scale: 0.97 }}
              className={`relative flex min-w-[160px] flex-1 flex-col gap-1 overflow-hidden rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                seleccionado
                  ? 'bg-[#003D5B] text-white shadow-lg'
                  : 'bg-[#FDF8F5]/80 text-[#003D5B] hover:bg-[#F2D7D5]/30'
              }`}
              style={
                seleccionado
                  ? { boxShadow: '0 8px 24px rgba(0,61,91,0.22)' }
                  : undefined
              }
            >
              {/* Nombre del tratamiento */}
              <span
                className={`line-clamp-1 text-[13px] font-semibold ${
                  seleccionado ? 'text-white' : 'text-[#003D5B]'
                }`}
              >
                {t.servicio_nombre}
              </span>

              {/* Progreso */}
              <span
                className={`text-[10px] font-medium ${
                  seleccionado ? 'text-white/75' : 'text-[#7A746E]'
                }`}
              >
                {t.sesiones_realizadas}/{t.sesiones_totales} sesiones · {pct}%
              </span>

              {/* Barra de progreso mini */}
              <div
                className={`h-1 w-full overflow-hidden rounded-full ${
                  seleccionado ? 'bg-white/20' : 'bg-[#003D5B]/10'
                }`}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    seleccionado
                      ? 'bg-[#BFC9A2]'
                      : 'bg-gradient-to-r from-[#BFC9A2] to-[#003D5B]'
                  }`}
                />
              </div>

              {/* Indicador activo */}
              {seleccionado ? (
                <motion.div
                  layoutId="selector-active"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#BFC9A2]"
                />
              ) : null}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}