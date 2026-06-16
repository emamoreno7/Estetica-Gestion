// src/features/admin/EditarTratamientoModal.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Calendar,
  DollarSign,
  Loader2,
  Pencil,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { actualizarTratamiento, type TratamientoClienteRow } from './adminTratamientosApi';
import { insertNotificacion } from '@/lib/notificacionesApi';

const PROFESIONALES = ['Ailen Carro', 'Ayelen', 'Equipo Amore'] as const;

interface Props {
  tratamiento: TratamientoClienteRow;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

export default function EditarTratamientoModal({ tratamiento, onClose, onSaved }: Props) {
  // ── States ──────────────────────────────────────────────────────────
  const [sesionesTotales, setSesionesTotales] = useState(String(tratamiento.sesiones_totales));
  const [precioTotal, setPrecioTotal] = useState(String(tratamiento.precio_total));
  const [fechaInicio, setFechaInicio] = useState(tratamiento.fecha_inicio);
  const [profesional, setProfesional] = useState(tratamiento.profesional);
  const [notas, setNotas] = useState(tratamiento.notas ?? '');
  const [notificarCliente, setNotificarCliente] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // ── Detección de cambios ────────────────────────────────────────────
  const sesionesNum = Number.parseInt(sesionesTotales, 10);
  const precioNum = Number.parseFloat(precioTotal.replace(',', '.')) || 0;

  const cambios = {
    sesiones: sesionesNum !== tratamiento.sesiones_totales,
    precio: precioNum !== Number(tratamiento.precio_total),
    fecha: fechaInicio !== tratamiento.fecha_inicio,
    profesional: profesional !== tratamiento.profesional,
    notas: notas !== (tratamiento.notas ?? ''),
  };

  const hayCambios = Object.values(cambios).some(Boolean);

  // Validar que las nuevas sesiones totales no sean menores a las ya realizadas
  const sesionesInvalidas =
    sesionesNum < tratamiento.sesiones_realizadas || sesionesNum < 1 || Number.isNaN(sesionesNum);

  const canSubmit = hayCambios && !sesionesInvalidas && !saving;

  // ── Construir resumen de cambios para la notificación ──────────────
  function construirResumenCambios(): string {
    const partes: string[] = [];
    if (cambios.sesiones) {
      partes.push(`sesiones totales (${tratamiento.sesiones_totales} → ${sesionesNum})`);
    }
    if (cambios.precio) {
      partes.push(`precio actualizado`);
    }
    if (cambios.fecha) {
      partes.push(`fecha de inicio`);
    }
    if (cambios.profesional) {
      partes.push(`profesional asignado`);
    }
    if (cambios.notas) {
      partes.push(`notas internas`);
    }
    return partes.join(', ');
  }

  // ── Guardar ─────────────────────────────────────────────────────────
  async function guardar() {
    if (!canSubmit) return;
    setSaving(true);
    setErrMsg(null);

    const { error } = await actualizarTratamiento(tratamiento.id, {
      sesionesTotales: cambios.sesiones ? sesionesNum : undefined,
      precioTotal: cambios.precio ? precioNum : undefined,
      fechaInicio: cambios.fecha ? fechaInicio : undefined,
      profesional: cambios.profesional ? profesional : undefined,
      notas: cambios.notas ? (notas.trim() || null) : undefined,
    });

    if (error) {
      setErrMsg(error);
      setSaving(false);
      return;
    }

    // 🔔 Notificar al cliente si está activo el toggle
    if (notificarCliente) {
      const resumen = construirResumenCambios();
      void insertNotificacion({
        clienteId: tratamiento.cliente_id,
        kind: 'admin_mensaje',
        title: '✨ Tu plan fue actualizado',
        body: `Actualizamos tu tratamiento "${tratamiento.servicio_nombre}": ${resumen}. Revisalo en tu portal.`,
        tratamientoId: tratamiento.id,
      });
    }

    await onSaved();
  }

  return (
    <motion.div
      className="fixed inset-0 z-[940] flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,61,91,0.45)' }}
        onClick={() => !saving && onClose()}
      />
      <motion.div
        layout
        className="pointer-events-auto relative z-[941] w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl"
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
            onClick={() => !saving && onClose()}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Encabezado */}
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#003D5B] text-white">
              <Pencil className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-serif-premium text-xl font-bold text-[#003D5B]">
                Editar plan
              </h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#003D5B]/45">
                {tratamiento.servicio_nombre}
              </p>
            </div>
          </div>

          {/* Resumen actual */}
          <div
            className="mt-5 rounded-2xl border border-[#BFC9A2]/45 bg-[#BFC9A2]/12 p-4"
          >
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/55">
                  Realizadas
                </p>
                <p className="text-serif-premium mt-1 text-xl font-bold text-[#003D5B]">
                  {tratamiento.sesiones_realizadas}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/55">
                  Totales
                </p>
                <p className="text-serif-premium mt-1 text-xl font-bold text-[#003D5B]">
                  {tratamiento.sesiones_totales}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/55">
                  Puntos
                </p>
                <p className="text-serif-premium mt-1 text-xl font-bold text-[#B8956E]">
                  {tratamiento.puntos_acumulados}
                </p>
              </div>
            </div>
          </div>

          {errMsg ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errMsg}
            </div>
          ) : null}

          {/* Sesiones totales */}
          <section className="mt-6">
            <label className="block">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                <Sparkles className="h-3 w-3" />
                Cantidad total de sesiones
              </span>
              <input
                type="number"
                min={tratamiento.sesiones_realizadas || 1}
                max={100}
                value={sesionesTotales}
                onChange={(e) => setSesionesTotales(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5 text-sm text-[#003D5B] outline-none"
              />
              {sesionesInvalidas ? (
                <p className="mt-1 text-[10px] text-red-700">
                  ⚠️ No puede ser menor a las {tratamiento.sesiones_realizadas} sesiones ya realizadas.
                </p>
              ) : cambios.sesiones ? (
                <p className="mt-1 text-[10px] text-[#B8956E]">
                  Cambiado de {tratamiento.sesiones_totales} a {sesionesNum}.
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-[#7A746E]">
                  Ampliá el plan si el cliente necesita más sesiones.
                </p>
              )}
            </label>
          </section>

          {/* Precio total */}
          <section className="mt-6">
            <label className="block">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                <DollarSign className="h-3 w-3" />
                Precio total del tratamiento (ARS)
              </span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5">
                <span className="text-sm font-semibold text-[#003D5B]/50">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={precioTotal}
                  onChange={(e) => setPrecioTotal(e.target.value)}
                  className="w-full bg-transparent text-sm text-[#003D5B] outline-none"
                />
              </div>
              {cambios.precio ? (
                <p className="mt-1 text-[10px] text-[#B8956E]">
                  Precio actualizado.
                </p>
              ) : null}
            </label>
          </section>

          {/* Fecha de inicio */}
          <section className="mt-6">
            <label className="block">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                <Calendar className="h-3 w-3" />
                Fecha de inicio del tratamiento
              </span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5 text-sm text-[#003D5B] outline-none"
              />
            </label>
          </section>

          {/* Profesional */}
          <section className="mt-6">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
              <Users className="h-3 w-3" />
              Profesional asignado
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

          {/* Notas */}
          <section className="mt-6">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                Notas internas
              </span>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones, plan personalizado, indicaciones especiales…"
                rows={3}
                className="mt-1 w-full resize-none rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2 text-sm text-[#003D5B] outline-none"
              />
            </label>
          </section>

          {/* Toggle notificación */}
          <section className="mt-6">
            <button
              type="button"
              onClick={() => setNotificarCliente((v) => !v)}
              className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition"
              style={{
                borderColor: notificarCliente
                  ? 'rgba(191,201,162,0.6)'
                  : 'rgba(0,61,91,0.12)',
                background: notificarCliente
                  ? 'rgba(191,201,162,0.12)'
                  : 'rgba(255,255,255,0.5)',
              }}
            >
              <div>
                <p className="text-sm font-semibold text-[#003D5B]">
                  📱 Notificar al cliente
                </p>
                <p className="text-[11px] text-[#7A746E]">
                  {notificarCliente
                    ? 'Se enviará una notificación con los cambios'
                    : 'No se enviará notificación'}
                </p>
              </div>
              <div
                className="relative h-6 w-11 rounded-full transition-colors duration-200"
                style={{
                  background: notificarCliente ? '#003D5B' : 'rgba(0,61,91,0.2)',
                }}
              >
                <motion.div
                  animate={{ x: notificarCliente ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
                />
              </div>
            </button>
          </section>

          {/* Botón guardar */}
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
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </motion.button>

          {!canSubmit && !saving ? (
            <p className="mt-3 text-center text-[11px] text-[#7A746E]">
              {!hayCambios
                ? 'No hay cambios para guardar.'
                : sesionesInvalidas
                  ? 'Revisá la cantidad de sesiones.'
                  : ''}
            </p>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}