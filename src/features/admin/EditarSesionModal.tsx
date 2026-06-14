import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Loader2, Pencil, X } from 'lucide-react';
import { actualizarSesion, type SesionRow } from './adminTratamientosApi';

const PROFESIONALES = ['Ailen Carro', 'Ayelen', 'Equipo Amore'] as const;

export default function EditarSesionModal(props: {
  sesion: SesionRow;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { sesion } = props;

  const horaInicial = (sesion.hora_sesion ?? '').slice(0, 5);

  const [fecha, setFecha] = useState(sesion.fecha_sesion);
  const [hora, setHora] = useState(horaInicial);
  const [profesional, setProfesional] = useState(sesion.profesional);
  const [observaciones, setObservaciones] = useState(sesion.observaciones ?? '');

  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const cambiosHechos =
    fecha !== sesion.fecha_sesion ||
    hora !== horaInicial ||
    profesional !== sesion.profesional ||
    observaciones !== (sesion.observaciones ?? '');

  async function guardar() {
    if (!cambiosHechos || saving) return;
    setSaving(true);
    setErrMsg(null);

    const { error } = await actualizarSesion(sesion.id, {
      fechaSesion: fecha,
      horaSesion: hora ? `${hora}:00` : null,
      profesional,
      observaciones: observaciones.trim() || null,
    });

    setSaving(false);
    if (error) {
      setErrMsg(error);
      return;
    }
    await props.onSaved();
  }

  return (
    <motion.div
      className="fixed inset-0 z-[950] flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,61,91,0.45)' }}
        onClick={() => !saving && props.onClose()}
      />
      <motion.div
        layout
        className="pointer-events-auto relative z-[951] w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
        style={{
          border: '1px solid rgba(242,215,213,0.75)',
          background: 'var(--bg-cream, #FDF8F5)',
          boxShadow: '0 32px 64px rgba(0,61,91,0.18)',
        }}
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="max-h-[92vh] overflow-y-auto p-6 sm:p-8">
          <button
            type="button"
            className="absolute right-5 top-5 rounded-full p-2 text-[#003D5B]/45 hover:bg-[#F2D7D5]/45"
            onClick={() => !saving && props.onClose()}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Encabezado */}
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#B8956E]/20 text-[#8B6F4E]">
              <Pencil className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-serif-premium text-xl font-bold text-[#003D5B]">
                Editar sesión #{sesion.numero_sesion}
              </h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#003D5B]/45">
                +{sesion.puntos_otorgados} pts otorgados
              </p>
            </div>
          </div>

          {errMsg ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errMsg}
            </div>
          ) : null}

          {/* Fecha y hora */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                Fecha
              </span>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5 text-sm text-[#003D5B] outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                Hora
              </span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5">
                <Clock className="h-4 w-4 text-[#003D5B]/45" />
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-full bg-transparent text-sm text-[#003D5B] outline-none"
                />
              </div>
            </label>
          </section>

          {/* Profesional */}
          <section className="mt-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
              Profesional
            </p>
            <div className="flex flex-wrap gap-2">
              {PROFESIONALES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProfesional(p)}
                  className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition ${
                    profesional === p
                      ? 'bg-[#003D5B] text-white shadow'
                      : 'border border-[#003D5B]/15 bg-white/80 text-[#003D5B]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          {/* Observaciones */}
          <section className="mt-6">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                Observaciones
              </span>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas sobre la sesión…"
                rows={3}
                className="mt-1 w-full resize-none rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2 text-sm text-[#003D5B] outline-none"
              />
            </label>
          </section>

          <motion.button
            type="button"
            disabled={!cambiosHechos || saving}
            whileTap={{ scale: cambiosHechos && !saving ? 0.98 : 1 }}
            onClick={() => void guardar()}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white disabled:pointer-events-none disabled:opacity-40"
            style={{
              background: 'linear-gradient(90deg, #BFC9A2 0%, #003D5B 100%)',
              boxShadow: '0 14px 32px rgba(0,61,91,0.20)',
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}