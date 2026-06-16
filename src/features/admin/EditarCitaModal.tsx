import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Loader2, X } from 'lucide-react';
import {
  actualizarCitaAdmin,
  fetchHorasOcupadasPorFecha,
  type CitaClienteRow,
  type CitaEstado,
} from '@/lib/citasApi';
import { insertNotificacion } from '@/lib/notificacionesApi';
import { format, parseISO } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';

const ESTADOS: { value: CitaEstado; label: string }[] = [
  { value: 'pendiente', label: '⏳ Pendiente' },
  { value: 'confirmado', label: '✅ Confirmado' },
  { value: 'realizado', label: '💆 Realizado' },
  { value: 'cancelado', label: '❌ Cancelado' },
];

export default function EditarCitaModal(props: {
  cita: CitaClienteRow;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { cita } = props;

  // Extraer hh:mm de la hora (que viene como hh:mm:ss)
  const horaInicial = (cita.hora ?? '').slice(0, 5);

  const [fecha, setFecha] = useState(cita.fecha);
  const [hora, setHora] = useState(horaInicial);
  const [estado, setEstado] = useState<CitaEstado>(cita.estado);

  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

    const cambiosHechos =
    fecha !== cita.fecha || hora !== horaInicial || estado !== cita.estado;

  const cambioFechaHora = fecha !== cita.fecha || hora !== horaInicial;

  // Verificar conflicto de horario (otra cita ya ocupa ese slot)
  const [horarioOcupado, setHorarioOcupado] = useState(false);

  useEffect(() => {
    if (!cambioFechaHora) {
      setHorarioOcupado(false);
      return;
    }
    let cancel = false;
    (async () => {
      const { horasOcupadas } = await fetchHorasOcupadasPorFecha(fecha);
      if (cancel) return;
      // Filtrar la hora actual de ESTA cita (no es conflicto consigo misma)
      const ocupadasOtras = horasOcupadas.filter((h) => {
        if (fecha === cita.fecha && h.slice(0, 5) === horaInicial) return false;
        return true;
      });
      const ocupado = ocupadasOtras.some((h) => h.slice(0, 5) === hora);
      setHorarioOcupado(ocupado);
    })();
    return () => {
      cancel = true;
    };
  }, [fecha, hora, cambioFechaHora, cita.fecha, horaInicial]);

    async function guardar() {
    if (!cambiosHechos || saving) return;
    setSaving(true);
    setErrMsg(null);

    const { error } = await actualizarCitaAdmin(cita.id, {
      fecha,
      hora: `${hora}:00`,
      estado,
    });

    setSaving(false);
    if (error) {
      setErrMsg(error);
      return;
    }

    // 🔔 Notificar al cliente si cambió la fecha u hora
    if (cambioFechaHora) {
      try {
        const fechaLegible = format(parseISO(fecha), "d 'de' MMMM", { locale: esLocale });
        void insertNotificacion({
          clienteId: cita.cliente_id,
          kind: 'cita_actualizada',
          title: 'Tu cita fue actualizada 📅',
          body: `Tu turno de ${cita.servicio} fue reagendado para ${fechaLegible}, ${hora} hs. Si tenés alguna consulta, escribinos por WhatsApp.`,
        });
      } catch {
        // Silencioso: la cita se guardó OK aunque falle la notif
      }
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
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#003D5B] text-white">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-serif-premium text-xl font-bold text-[#003D5B]">Editar cita</h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#003D5B]/45">
                {cita.servicio}
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

          {/* Estado */}
          <section className="mt-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
              Estado
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ESTADOS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setEstado(e.value)}
                  className={`rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                    estado === e.value
                      ? 'bg-[#003D5B] text-white shadow'
                      : 'border border-[#003D5B]/15 bg-white/85 text-[#003D5B] hover:bg-[#F2D7D5]/25'
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </section>
                    {/* Advertencia horario ocupado */}
          {horarioOcupado ? (
            <div
              className="mt-5 flex items-start gap-2 rounded-xl border px-3 py-2.5"
              style={{
                borderColor: 'rgba(245,158,11,0.45)',
                background: 'rgba(254,243,199,0.55)',
              }}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
              <p className="text-[10px] leading-relaxed text-amber-900">
                <strong>Atención:</strong> ese horario ya tiene otra cita agendada. Se puede guardar
                igual si atendés a dos personas en simultáneo, pero confirmá que esté todo bien.
              </p>
            </div>
          ) : null}

          {/* Info */}
          <div className="mt-5 rounded-xl bg-[#BFC9A2]/12 px-3 py-2.5 text-[10px] leading-relaxed text-[#003D5B]/70">
            <strong>Tip:</strong> si cambiás la cita a <em>realizado</em>, se intentará crear una
            sesión automática para el cliente si tiene tratamiento activo de este servicio.
          </div>

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