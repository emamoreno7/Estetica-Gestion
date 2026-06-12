import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { format } from 'date-fns';
import {
  listSesionesByTratamiento,
  registrarSesion,
  type SesionRow,
  type TratamientoClienteRow,
} from './adminTratamientosApi';

const PROFESIONALES = ['Ailen Carro', 'Ayelen', 'Equipo Amore'] as const;

export default function RegistrarSesionModal(props: {
  tratamiento: TratamientoClienteRow;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const { tratamiento } = props;

  const [sesionesPrevias, setSesionesPrevias] = useState<SesionRow[]>([]);
  const [loadingPrevias, setLoadingPrevias] = useState(true);

  const proximoNumero = sesionesPrevias.length + 1;

  const [fechaSesion, setFechaSesion] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [horaSesion, setHoraSesion] = useState(() => format(new Date(), 'HH:mm'));
  const [profesional, setProfesional] = useState<string>(tratamiento.profesional || PROFESIONALES[0]);
  const [observaciones, setObservaciones] = useState('');
  const [puntos, setPuntos] = useState('10');

  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Cargar sesiones previas para calcular el próximo número
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingPrevias(true);
      const { rows } = await listSesionesByTratamiento(tratamiento.id);
      if (cancel) return;
      setSesionesPrevias(rows);
      setLoadingPrevias(false);
    })();
    return () => {
      cancel = true;
    };
  }, [tratamiento.id]);

  const yaCompleto = proximoNumero > tratamiento.sesiones_totales;

  const canSubmit = !!(fechaSesion && profesional && !saving && !yaCompleto);

  async function guardar() {
    if (!canSubmit) return;
    setSaving(true);
    setErrMsg(null);

    const puntosNum = Number.parseInt(puntos, 10);

    const { error } = await registrarSesion({
      tratamientoId: tratamiento.id,
      numeroSesion: proximoNumero,
      fechaSesion,
      horaSesion: horaSesion || null,
      profesional,
      observaciones: observaciones.trim() || null,
      puntosOtorgados: Number.isNaN(puntosNum) ? 10 : puntosNum,
    });

    setSaving(false);

    if (error) {
      setErrMsg(error);
      return;
    }

    await props.onCreated();
  }

  return (
    <motion.div
      className="fixed inset-0 z-[930] flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,61,91,0.42)' }}
        onClick={() => !saving && props.onClose()}
      />
      <motion.div
        layout
        className="pointer-events-auto relative z-[931] flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl shadow-2xl"
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
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#003D5B] text-white">
              <Plus className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-serif-premium text-xl font-bold text-[#003D5B]">
                Registrar sesión
              </h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#003D5B]/45">
                {tratamiento.servicio_nombre} · {tratamiento.cliente_nombre}
              </p>
            </div>
          </div>

          {/* Resumen del tratamiento */}
          <div
            className="mt-5 rounded-2xl border border-[#BFC9A2]/45 bg-[#BFC9A2]/12 p-4"
            style={{ boxShadow: '0 8px 20px rgba(0,61,91,0.05)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/55">
                  Progreso actual
                </p>
                {loadingPrevias ? (
                  <p className="mt-1 text-sm text-[#7A746E]">
                    <Loader2 className="inline h-3 w-3 animate-spin" /> Cargando…
                  </p>
                ) : (
                  <p className="text-serif-premium mt-1 text-2xl font-bold text-[#003D5B]">
                    {sesionesPrevias.length} / {tratamiento.sesiones_totales}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/55">
                  Próxima sesión
                </p>
                <p className="text-serif-premium mt-1 text-2xl font-bold text-[#B8956E]">
                  #{proximoNumero}
                </p>
              </div>
            </div>
          </div>

          {yaCompleto ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-900">
                Este tratamiento ya completó sus {tratamiento.sesiones_totales} sesiones.
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                Marcalo como "Finalizado" desde el menú del tratamiento.
              </p>
            </div>
          ) : (
            <>
              {errMsg ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {errMsg}
                </div>
              ) : null}

              {/* Fecha y hora */}
              <section className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                    Fecha de la sesión
                  </span>
                  <input
                    type="date"
                    value={fechaSesion}
                    onChange={(e) => setFechaSesion(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5 text-sm text-[#003D5B] outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                    Hora (opcional)
                  </span>
                  <input
                    type="time"
                    value={horaSesion}
                    onChange={(e) => setHoraSesion(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5 text-sm text-[#003D5B] outline-none"
                  />
                </label>
              </section>

              {/* Profesional */}
              <section className="mt-6">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
                  Profesional que atendió
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

              {/* Puntos */}
              <section className="mt-6">
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                    Puntos a otorgar
                  </span>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5">
                    <Sparkles className="h-4 w-4 text-[#B8956E]" />
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={puntos}
                      onChange={(e) => setPuntos(e.target.value)}
                      className="w-full bg-transparent text-sm text-[#003D5B] outline-none"
                    />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7A746E]">
                      pts
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-[#7A746E]">
                    Por defecto se otorgan 10 puntos por sesión.
                  </p>
                </label>
              </section>

              {/* Observaciones */}
              <section className="mt-6">
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                    Observaciones de la sesión (opcional)
                  </span>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas sobre la sesión: producto usado, reacción del cliente, cambios observados…"
                    rows={3}
                    className="mt-1 w-full resize-none rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2 text-sm text-[#003D5B] outline-none"
                  />
                </label>
              </section>

              {/* Listado de sesiones previas */}
              {sesionesPrevias.length > 0 ? (
                <section className="mt-6">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
                    Sesiones registradas ({sesionesPrevias.length})
                  </p>
                  <div className="max-h-40 overflow-y-auto rounded-2xl border border-[#F2D7D5]/55 bg-white/85">
                    <ul className="divide-y divide-[#F2D7D5]/40">
                      {sesionesPrevias.map((s) => (
                        <li key={s.id} className="flex items-center justify-between px-3 py-2">
                          <div>
                            <p className="text-xs font-semibold text-[#003D5B]">
                              Sesión #{s.numero_sesion}
                            </p>
                            <p className="text-[10px] text-[#7A746E]">
                              {format(new Date(s.fecha_sesion + 'T12:00:00'), 'd MMM yyyy')} ·{' '}
                              {s.profesional}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold text-[#B8956E]">
                            +{s.puntos_otorgados} pts
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              ) : null}

              <motion.button
                type="button"
                disabled={!canSubmit}
                whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                onClick={() => void guardar()}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white disabled:pointer-events-none disabled:opacity-40"
                style={{
                  background: 'linear-gradient(90deg, #BFC9A2 0%, #003D5B 100%)',
                  boxShadow: '0 14px 32px rgba(0,61,91,0.20)',
                }}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {saving ? 'Registrando…' : `Registrar sesión #${proximoNumero}`}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}