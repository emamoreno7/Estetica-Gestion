import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Calendar,
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { AdminShell } from './AdminShell';
import {
  actualizarEstadoTratamiento,
  eliminarTratamiento,
  listTratamientosAdmin,
  type TratamientoClienteRow,
  type TratamientoEstado,
} from './adminTratamientosApi';
import AsignarTratamientoModal from './AsignarTratamientoModal';
import RegistrarSesionModal from './RegistrarSesionModal';
import SubirFotoModal from './SubirFotoModal';

type AdminOutletCtx = { onSignOut: () => void };

function formatPrecio(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n);
}

function EstadoBadge({ estado }: { estado: TratamientoEstado }) {
  const map: Record<TratamientoEstado, { label: string; className: string }> = {
    activo: {
      label: '🟢 Activo',
      className: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
    },
    finalizado: {
      label: '✅ Finalizado',
      className: 'bg-sky-50 text-sky-900 border-sky-200/80',
    },
    pausado: {
      label: '⏸️ Pausado',
      className: 'bg-amber-50 text-amber-950 border-amber-200/80',
    },
    cancelado: {
      label: '❌ Cancelado',
      className: 'bg-red-50 text-red-900 border-red-200/70',
    },
  };
  const x = map[estado];
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide ${x.className}`}
    >
      {x.label}
    </span>
  );
}

export default function AdminTratamientosView() {
  const { onSignOut } = useOutletContext<AdminOutletCtx>();
  const [rows, setRows] = useState<TratamientoClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [accionMsg, setAccionMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<TratamientoEstado | 'todos'>('activo');

  // Modales
  const [asignarOpen, setAsignarOpen] = useState(false);
  const [sesionTratamiento, setSesionTratamiento] = useState<TratamientoClienteRow | null>(null);
  const [fotoTratamiento, setFotoTratamiento] = useState<TratamientoClienteRow | null>(null);
  const [menuTratamiento, setMenuTratamiento] = useState<TratamientoClienteRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { rows: r, error } = await listTratamientosAdmin();
    if (error) setErr(error);
    else setRows(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return rows.filter((r) => {
      if (filtroEstado !== 'todos' && r.estado !== filtroEstado) return false;
      if (!q) return true;
      return (
        (r.cliente_nombre ?? '').toLowerCase().includes(q) ||
        r.servicio_nombre.toLowerCase().includes(q) ||
        r.profesional.toLowerCase().includes(q)
      );
    });
  }, [rows, busqueda, filtroEstado]);

  const stats = useMemo(() => {
    const activos = rows.filter((r) => r.estado === 'activo').length;
    const finalizados = rows.filter((r) => r.estado === 'finalizado').length;
    const sesionesHechas = rows.reduce((acc, r) => acc + r.sesiones_realizadas, 0);
    return { total: rows.length, activos, finalizados, sesionesHechas };
  }, [rows]);

  async function cambiarEstado(t: TratamientoClienteRow, estado: TratamientoEstado) {
    setAccionMsg(null);
    setSaving(true);
    const { error } = await actualizarEstadoTratamiento(t.id, estado);
    setSaving(false);
    if (error) {
      setAccionMsg(error);
      return;
    }
    setMenuTratamiento(null);
    await load();
  }

  async function borrar(t: TratamientoClienteRow) {
    if (
      !window.confirm(
        `¿Eliminar el tratamiento "${t.servicio_nombre}" de ${t.cliente_nombre}?\n\nSe borrarán también las sesiones y fotos asociadas. Esta acción no se puede deshacer.`
      )
    )
      return;
    setAccionMsg(null);
    setSaving(true);
    const { error } = await eliminarTratamiento(t.id);
    setSaving(false);
    if (error) {
      setAccionMsg(error);
      return;
    }
    setMenuTratamiento(null);
    await load();
  }

  return (
    <AdminShell
      onSignOut={onSignOut}
      title="Tratamientos"
      subtitle="Gestión de tratamientos, sesiones y evolución"
      actions={
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setAccionMsg(null);
              setAsignarOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-[#003D5B] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-md"
            style={{ boxShadow: '0 10px 28px rgba(0,61,91,0.22)' }}
          >
            <Plus className="h-3.5 w-3.5" />
            Asignar tratamiento
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-full border border-[#BFC9A2]/50 bg-white/90 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#003D5B]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </motion.button>
        </div>
      }
    >
      {/* ─── Stats ─── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Total" value={stats.total} />
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label="Activos"
          value={stats.activos}
          accent="emerald"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Finalizados"
          value={stats.finalizados}
          accent="sky"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Sesiones hechas"
          value={stats.sesionesHechas}
          accent="amber"
        />
      </div>

      {/* ─── Filtros ─── */}
      <div
        className="mb-5 flex flex-col gap-3 rounded-3xl border border-[#F2D7D5]/65 bg-[#FDF8F5]/95 p-4 shadow-md sm:flex-row sm:items-center"
        style={{ boxShadow: '0 16px 48px rgba(0,61,91,0.08)' }}
      >
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5">
          <Search className="h-4 w-4 text-[#003D5B]/45" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, servicio o profesional…"
            className="w-full bg-transparent text-sm text-[#003D5B] outline-none placeholder:text-[#003D5B]/30"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['todos', 'activo', 'finalizado', 'pausado', 'cancelado'] as const).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setFiltroEstado(e)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition ${
                filtroEstado === e
                  ? 'bg-[#003D5B] text-white shadow'
                  : 'border border-[#003D5B]/15 bg-white/70 text-[#003D5B]/70 hover:bg-white'
              }`}
            >
              {e === 'todos' ? 'Todos' : e}
            </button>
          ))}
        </div>
      </div>

      {accionMsg ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {accionMsg}
        </div>
      ) : null}

      {/* ─── Lista ─── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#003D5B]/55">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Cargando tratamientos…</span>
        </div>
      ) : err ? (
        <div className="rounded-3xl border border-red-100 bg-red-50/90 px-5 py-10 text-center text-sm text-red-800">
          {err}
        </div>
      ) : filtrados.length === 0 ? (
        <div
          className="rounded-3xl border border-[#F2D7D5]/60 bg-[#FDF8F5]/95 px-6 py-16 text-center shadow-md"
          style={{ boxShadow: '0 20px 56px rgba(0,61,91,0.06)' }}
        >
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-[#B8956E]" />
          <p className="text-serif-premium text-lg text-[#003D5B]/75">
            {rows.length === 0
              ? 'Todavía no hay tratamientos asignados.'
              : 'No se encontraron tratamientos con esos filtros.'}
          </p>
          <p className="mt-2 text-sm text-[#7A746E]">
            {rows.length === 0
              ? 'Asigná el primer tratamiento desde el botón "Asignar tratamiento".'
              : 'Probá cambiar los filtros o el término de búsqueda.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtrados.map((t) => {
            const porcentaje =
              t.sesiones_totales > 0
                ? Math.round((t.sesiones_realizadas / t.sesiones_totales) * 100)
                : 0;
            return (
              <motion.li key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div
                  className="rounded-3xl border border-[#F2D7D5]/65 bg-[#FDF8F5]/98 p-4 shadow-md transition hover:border-[#BFC9A2]/45 hover:shadow-lg sm:p-5"
                  style={{ boxShadow: '0 14px 40px rgba(0,61,91,0.07)' }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {/* Info principal */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-serif-premium text-lg font-bold text-[#003D5B]">
                          {t.servicio_nombre}
                        </h3>
                        <EstadoBadge estado={t.estado} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7A746E]">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <strong className="font-semibold text-[#003D5B]">
                            {t.cliente_nombre}
                          </strong>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {t.profesional}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {t.zona}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(t.fecha_inicio + 'T12:00:00'), 'd MMM yyyy', {
                            locale: esLocale,
                          })}
                        </span>
                      </div>

                      {/* Barra de progreso */}
                      <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
                          <span className="text-[#003D5B]/65">
                            Sesiones {t.sesiones_realizadas} / {t.sesiones_totales}
                          </span>
                          <span className="text-[#003D5B]">{porcentaje}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#003D5B]/8">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background:
                                'linear-gradient(90deg, #BFC9A2 0%, #003D5B 100%)',
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${porcentaje}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span className="text-[#7A746E]">
                          💎 <strong className="text-[#003D5B]">{t.puntos_acumulados}</strong>{' '}
                          puntos
                        </span>
                        {t.precio_total > 0 ? (
                          <span className="text-[#7A746E]">
                            💰{' '}
                            <strong className="text-[#003D5B]">
                              {formatPrecio(t.precio_total)}
                            </strong>
                          </span>
                        ) : null}
                      </div>

                      {t.notas ? (
                        <p className="mt-3 rounded-xl bg-white/60 px-3 py-2 text-xs italic text-[#7A746E]">
                          📝 {t.notas}
                        </p>
                      ) : null}
                    </div>

                    {/* Acciones */}
                    <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSesionTratamiento(t)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#003D5B] px-3 py-2.5 text-[11px] font-semibold text-white shadow-sm sm:flex-initial"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Sesión
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFotoTratamiento(t)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#B8956E]/50 bg-[#B8956E]/10 px-3 py-2.5 text-[11px] font-semibold text-[#8B6F4E] sm:flex-initial"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Foto
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMenuTratamiento(t)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#003D5B]/15 bg-white/90 px-3 py-2.5 text-[11px] font-semibold text-[#003D5B] sm:flex-initial"
                      >
                        Más
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}

      {/* ─── Menú de acciones ─── */}
      <AnimatePresence>
        {menuTratamiento ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar menú"
              className="fixed inset-0 z-[100] bg-[#003D5B]/35 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setMenuTratamiento(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[110] max-h-[85vh] overflow-y-auto rounded-t-[1.75rem] border border-[#F2D7D5]/80 px-5 pb-10 pt-6 shadow-2xl sm:left-1/2 sm:max-w-md sm:-translate-x-1/2"
              style={{
                background: 'linear-gradient(180deg, #fffefb 0%, #FDF8F5 100%)',
                boxShadow: '0 -20px 64px rgba(0,61,91,0.18)',
              }}
            >
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#003D5B]/15" aria-hidden />
              <h2 className="text-serif-premium text-lg font-bold text-[#003D5B]">
                {menuTratamiento.servicio_nombre}
              </h2>
              <p className="mt-1 text-sm text-[#7A746E]">{menuTratamiento.cliente_nombre}</p>

              <p className="mb-3 mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
                Cambiar estado
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['activo', '🟢 Activo'],
                    ['pausado', '⏸️ Pausado'],
                    ['finalizado', '✅ Finalizado'],
                    ['cancelado', '❌ Cancelado'],
                  ] as const
                ).map(([estado, label]) => (
                  <button
                    key={estado}
                    type="button"
                    disabled={saving || menuTratamiento.estado === estado}
                    onClick={() => void cambiarEstado(menuTratamiento, estado)}
                    className="rounded-2xl border border-[#F2D7D5]/70 bg-white/90 px-3 py-3 text-left text-[13px] font-semibold text-[#003D5B] transition hover:bg-[#F2D7D5]/25 disabled:opacity-45"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => void borrar(menuTratamiento)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar tratamiento
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setMenuTratamiento(null)}
                className="mt-3 w-full rounded-2xl py-3 text-center text-sm font-medium text-[#003D5B]/55"
              >
                Cerrar
              </button>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {/* ─── Modales ─── */}
      <AnimatePresence>
        {asignarOpen ? (
          <AsignarTratamientoModal
            onClose={() => setAsignarOpen(false)}
            onCreated={async () => {
              setAsignarOpen(false);
              setAccionMsg('Tratamiento asignado correctamente.');
              await load();
            }}
          />
        ) : null}

        {sesionTratamiento ? (
          <RegistrarSesionModal
            tratamiento={sesionTratamiento}
            onClose={() => setSesionTratamiento(null)}
            onCreated={async () => {
              setSesionTratamiento(null);
              setAccionMsg('Sesión registrada correctamente.');
              await load();
            }}
          />
        ) : null}

        {fotoTratamiento ? (
          <SubirFotoModal
            tratamiento={fotoTratamiento}
            onClose={() => setFotoTratamiento(null)}
            onUploaded={async () => {
              setFotoTratamiento(null);
              setAccionMsg('Foto subida correctamente.');
              await load();
            }}
          />
        ) : null}
      </AnimatePresence>
    </AdminShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════

function StatCard({
  icon,
  label,
  value,
  accent = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: 'default' | 'emerald' | 'sky' | 'amber';
}) {
  const accentMap = {
    default: 'bg-[#003D5B]/8 text-[#003D5B]',
    emerald: 'bg-emerald-100 text-emerald-700',
    sky: 'bg-sky-100 text-sky-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <div
      className="rounded-2xl border border-[#F2D7D5]/65 bg-[#FDF8F5]/95 p-3 shadow-sm"
      style={{ boxShadow: '0 8px 20px rgba(0,61,91,0.05)' }}
    >
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${accentMap[accent]}`}>
          {icon}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7A746E]">
          {label}
        </span>
      </div>
      <p className="text-serif-premium mt-2 text-2xl font-bold text-[#003D5B]">{value}</p>
    </div>
  );
}