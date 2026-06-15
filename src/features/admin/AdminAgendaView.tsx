import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,        // ← agregar esto
  Loader2,
  MessageCircle,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { addDays, format, subDays } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import type { CitaEstado } from '@/lib/citasApi';
import {
  fetchHorasOcupadasPorFecha,
  filtrarFranjasDisponibles,
  generarFranjasComerciales,
} from '@/lib/citasApi';
import { serviciosCatalogo } from '@/data/serviciosCatalogo';
import { WHATSAPP_ADMIN_PHONE } from '@/lib/whatsapp';
import { getPortalAdminEmails, getPortalAdminUserIds } from '@/config/admin';
import { AdminShell } from './AdminShell';
import {
  actualizarEstadoCitaAdmin,
  buscarClientesActivos,
  crearCitaAdmin,
  crearClienteWalkin,
  eliminarCitaAdmin,
  fetchCitasPorFechaAdmin,
  fetchSolicitudesPendientesAdmin,
  type CitaAdminListRow,
  type ClienteOpcion,
} from './adminCitasApi';
import { clienteTieneTratamientoActivo } from './adminTratamientosApi';
import EditarCitaModal from './EditarCitaModal';
import type { CitaClienteRow } from '@/lib/citasApi';

type AdminOutletCtx = { onSignOut: () => void };

function horaCorta(horaSql: string): string {
  const m = horaSql.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return horaSql.slice(0, 5);
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

function waClienteHref(row: CitaAdminListRow): string {
  const digits = row.phone.replace(/\D/g, '');
  const hc = horaCorta(row.hora);
  const text = `Hola ${row.full_name}, te escribimos desde Amore por tu turno: ${row.servicio} (${format(
    new Date(row.fecha + 'T12:00:00'),
    'd MMM',
    { locale: esLocale }
  )} a las ${hc}).`;
  if (digits.length >= 8) {
    const n = digits.startsWith('54') ? digits : `54${digits.replace(/^0+/, '')}`;
    return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/${WHATSAPP_ADMIN_PHONE}?text=${encodeURIComponent(
    `${text}\n(El cliente figura sin teléfono válido en la ficha — contactar por recepción.)`
  )}`;
}

function EstadoEtiqueta({ estado }: { estado: CitaEstado }) {
  const map: Record<CitaEstado, { label: string; className: string }> = {
    confirmado: {
      label: '🟢 Confirmado',
      className: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
    },
    realizado: {
      label: '🔵 Realizado',
      className: 'bg-sky-50 text-sky-900 border-sky-200/80',
    },
    cancelado: {
      label: '🔴 Cancelado',
      className: 'bg-red-50 text-red-900 border-red-200/70',
    },
    pendiente: {
      label: '🟡 Pendiente',
      className: 'bg-amber-50 text-amber-950 border-amber-200/80',
    },
  };
  const x = map[estado];
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide ${x.className}`}>
      {x.label}
    </span>
  );
}

export default function AdminAgendaView() {
  const { onSignOut } = useOutletContext<AdminOutletCtx>();
  const navigate = useNavigate();
  const [dia, setDia] = useState(() => new Date());
  const fechaYmd = format(dia, 'yyyy-MM-dd');
  const [rows, setRows] = useState<CitaAdminListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [accionMsg, setAccionMsg] = useState<string | null>(null);
  const [menuRow, setMenuRow] = useState<CitaAdminListRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [avisoSinTratamiento, setAvisoSinTratamiento] = useState<{
    cliente: string;
    servicio: string;
  } | null>(null);

  // Solicitudes pendientes (turnos cargados por clientes, esperan aprobación)
  const [solicitudes, setSolicitudes] = useState<CitaAdminListRow[]>([]);
  const [solicitudesErr, setSolicitudesErr] = useState<string | null>(null);
  const [solicitudesLoading, setSolicitudesLoading] = useState(false);
  const [showSolicitudes, setShowSolicitudes] = useState(true);

  // Modal "Nuevo turno"
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [editarCitaRow, setEditarCitaRow] = useState<CitaAdminListRow | null>(null);

  const admins = getPortalAdminEmails();
  const adminIds = getPortalAdminUserIds();

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { rows: r, error } = await fetchCitasPorFechaAdmin(fechaYmd);
    if (error) setErr(error);
    else setRows(r);
    setLoading(false);
  }, [fechaYmd]);

  const loadSolicitudes = useCallback(async () => {
    setSolicitudesLoading(true);
    setSolicitudesErr(null);
    const { rows: r, error } = await fetchSolicitudesPendientesAdmin();
    if (error) setSolicitudesErr(error);
    else setSolicitudes(r);
    setSolicitudesLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadSolicitudes();
  }, [loadSolicitudes]);

  const tituloDia = useMemo(
    () => format(dia, "EEEE d 'de' MMMM yyyy", { locale: esLocale }),
    [dia]
  );

  async function aprobarSolicitud(row: CitaAdminListRow) {
    setAccionMsg(null);
    const { error } = await actualizarEstadoCitaAdmin(row.id, 'confirmado');
    if (error) {
      setAccionMsg(error);
      return;
    }
    // Si la solicitud aprobada cae en el día que estamos viendo, refrescar
    if (row.fecha === fechaYmd) await load();
    await loadSolicitudes();
  }

  async function rechazarSolicitud(row: CitaAdminListRow) {
    if (!window.confirm(`¿Rechazar la solicitud de ${row.full_name} (${row.servicio})?`)) return;
    setAccionMsg(null);
    const { error } = await actualizarEstadoCitaAdmin(row.id, 'cancelado');
    if (error) {
      setAccionMsg(error);
      return;
    }
    if (row.fecha === fechaYmd) await load();
    await loadSolicitudes();
  }

  async function aplicarEstado(estado: CitaEstado) {
    if (!menuRow) return;
    setAccionMsg(null);
    setSaving(true);
    const citaActual = menuRow;
    const { error } = await actualizarEstadoCitaAdmin(citaActual.id, estado);
    setSaving(false);
    if (error) {
      setAccionMsg(error);
      return;
    }
    setMenuRow(null);

    // Si se marcó como "realizado", verificar si el cliente tiene tratamiento activo
    if (estado === 'realizado') {
      const { tiene } = await clienteTieneTratamientoActivo(
        citaActual.cliente_id,
        citaActual.servicio
      );
      if (!tiene) {
        setAvisoSinTratamiento({
          cliente: citaActual.full_name,
          servicio: citaActual.servicio,
        });
      }
    }

    await load();
    await loadSolicitudes();
  }

  async function borrarTurno() {
    if (!menuRow) return;
    if (
      !window.confirm(
        `¿Eliminar el turno de ${menuRow.full_name} (${horaCorta(menuRow.hora)})? Esta acción no se puede deshacer.`
      )
    )
      return;
    setAccionMsg(null);
    setSaving(true);
    const { error } = await eliminarCitaAdmin(menuRow.id);
    setSaving(false);
    if (error) {
      setAccionMsg(error);
      return;
    }
    setMenuRow(null);
    await load();
    await loadSolicitudes();
  }

  return (
    <AdminShell
      onSignOut={onSignOut}
      title="Agenda"
      subtitle={tituloDia}
      actions={
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setAccionMsg(null);
              setNuevoOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-[#003D5B] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-md"
            style={{ boxShadow: '0 10px 28px rgba(0,61,91,0.22)' }}
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo turno
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              void load();
              void loadSolicitudes();
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[#BFC9A2]/50 bg-white/90 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#003D5B]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading || solicitudesLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </motion.button>
        </div>
      }
    >
      {admins.length === 0 && adminIds.length === 0 ? (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/95 px-4 py-3 text-sm text-amber-950">
          Configurá <code className="text-xs">VITE_ADMIN_EMAILS</code> o{' '}
          <code className="text-xs">VITE_ADMIN_USER_IDS</code> y la función SQL{' '}
          <code className="text-xs">is_portal_admin()</code>.
        </p>
      ) : null}

      {/* ─── Panel de solicitudes pendientes ─── */}
      {solicitudesErr ? (
        <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>Solicitudes:</strong> {solicitudesErr}
        </div>
      ) : solicitudes.length > 0 ? (
        <motion.div
          layout
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 overflow-hidden rounded-3xl border border-amber-200/85 bg-gradient-to-br from-amber-50 via-white to-[#FDF8F5] shadow-xl"
          style={{ boxShadow: '0 18px 48px rgba(180,120,40,0.10)' }}
        >
          <button
            type="button"
            onClick={() => setShowSolicitudes((v) => !v)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
          >
            <span className="relative inline-flex">
              <Bell className="h-5 w-5 text-amber-700" />
              <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {solicitudes.length}
              </span>
            </span>
            <span className="text-sm font-semibold text-amber-950">
              {solicitudes.length === 1
                ? '1 solicitud de turno pendiente'
                : `${solicitudes.length} solicitudes de turno pendientes`}
            </span>
            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-amber-800/70">
              {showSolicitudes ? 'Ocultar' : 'Ver'}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {showSolicitudes ? (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-2 px-3 pb-4 sm:px-5"
              >
                {solicitudes.map((row) => {
                  const fechaLbl = format(new Date(row.fecha + 'T12:00:00'), "d MMM", { locale: esLocale });
                  return (
                    <li
                      key={row.id}
                      className="flex flex-col gap-3 rounded-2xl border border-amber-200/70 bg-white/95 p-3.5 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                    >
                      <div className="flex shrink-0 items-baseline gap-2 sm:w-32 sm:flex-col sm:items-start sm:gap-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800/80">
                          {fechaLbl}
                        </span>
                        <span className="text-serif-premium text-xl font-bold text-[#003D5B]">
                          {horaCorta(row.hora)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#003D5B]">{row.full_name}</p>
                        <p className="text-xs text-[#7A746E]">{row.servicio}</p>
                        {row.phone ? (
                          <p className="mt-0.5 text-[11px] text-[#7A746E]/85">{row.phone}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <a
                          href={waClienteHref(row)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-2 text-[11px] font-semibold text-[#1B7E3F]"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => void rechazarSolicitud(row)}
                          className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-800 hover:bg-red-100"
                          title="Rechazar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void aprobarSolicitud(row)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Confirmar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}

      <div
        className="mb-6 flex items-center justify-between gap-3 rounded-3xl border border-[#F2D7D5]/65 bg-[#FDF8F5]/95 px-4 py-3 shadow-lg backdrop-blur-sm sm:px-5"
        style={{ boxShadow: '0 16px 48px rgba(0,61,91,0.08)' }}
      >
        <button
          type="button"
          aria-label="Día anterior"
          className="rounded-2xl border border-[#003D5B]/10 bg-white/90 p-3 text-[#003D5B] transition hover:bg-[#F2D7D5]/30"
          onClick={() => setDia((d) => subDays(d, 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-center">
          <Calendar className="h-4 w-4 shrink-0 text-[#B8956E]" aria-hidden />
          <input
            type="date"
            value={fechaYmd}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              const [y, m, d] = v.split('-').map(Number);
              setDia(new Date(y, m - 1, d));
            }}
            className="max-w-[11rem] rounded-xl border border-[#003D5B]/12 bg-white/95 px-3 py-2 text-center text-sm font-medium text-[#003D5B] outline-none focus:ring-2 focus:ring-[#F2D7D5]/70"
          />
        </div>
        <button
          type="button"
          aria-label="Día siguiente"
          className="rounded-2xl border border-[#003D5B]/10 bg-white/90 p-3 text-[#003D5B] transition hover:bg-[#F2D7D5]/30"
          onClick={() => setDia((d) => addDays(d, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setDia(new Date())}
        className="mb-6 w-full rounded-2xl border border-dashed border-[#003D5B]/18 bg-white/50 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#003D5B]/55 transition hover:border-[#BFC9A2]/60 hover:bg-white/80"
      >
        Ir a hoy
      </button>

            {accionMsg ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {accionMsg}
        </div>
      ) : null}

      <AnimatePresence>
        {avisoSinTratamiento ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="mb-5 overflow-hidden rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50/60 shadow-xl"
            style={{ boxShadow: '0 18px 48px rgba(180,120,40,0.12)' }}
          >
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex shrink-0 items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-200/70 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-950">
                  Sesión marcada como realizada, pero sin tratamiento activo
                </p>
                <p className="mt-0.5 text-xs text-amber-900/85">
                  <strong>{avisoSinTratamiento.cliente}</strong> no tiene un tratamiento activo de{' '}
                  <strong>{avisoSinTratamiento.servicio}</strong>. La sesión no se sumó al progreso.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setAvisoSinTratamiento(null)}
                  className="rounded-full border border-amber-400/50 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-amber-900 transition hover:bg-white"
                >
                  Después
                </button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setAvisoSinTratamiento(null);
                    navigate('/admin/tratamientos');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white shadow-md transition hover:bg-amber-700"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Asignar tratamiento
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#003D5B]/55">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Cargando turnos…</span>
        </div>
      ) : err ? (
        <div className="rounded-3xl border border-red-100 bg-red-50/90 px-5 py-10 text-center text-sm text-red-800">
          {err}
        </div>
      ) : rows.length === 0 ? (
        <div
          className="rounded-3xl border border-[#F2D7D5]/60 bg-[#FDF8F5]/95 px-6 py-16 text-center shadow-md"
          style={{ boxShadow: '0 20px 56px rgba(0,61,91,0.06)' }}
        >
          <p className="text-serif-premium text-lg text-[#003D5B]/75">
            No hay turnos cargados para este día.
          </p>
          <p className="mt-2 text-sm text-[#7A746E]">
            Cuando las clientes reserven desde el portal, aparecerán aquí.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <motion.li key={row.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <button
                type="button"
                onClick={() => {
                  setAccionMsg(null);
                  setMenuRow(row);
                }}
                className="flex w-full flex-col gap-3 rounded-3xl border border-[#F2D7D5]/65 bg-[#FDF8F5]/98 p-4 text-left shadow-md transition hover:border-[#BFC9A2]/45 hover:shadow-lg active:scale-[0.99] sm:flex-row sm:items-center sm:gap-4 sm:p-5"
                style={{ boxShadow: '0 14px 40px rgba(0,61,91,0.07)' }}
              >
                <div className="flex shrink-0 items-baseline gap-3 sm:w-24 sm:flex-col sm:gap-0">
                  <span className="text-serif-premium text-2xl font-semibold tabular-nums text-[#003D5B]">
                    {horaCorta(row.hora)}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7A746E]">hs</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-[#003D5B]">{row.full_name}</p>
                    <EstadoEtiqueta estado={row.estado} />
                    {row.creado_por_admin === false && row.estado === 'pendiente' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900">
                        <Bell className="h-3 w-3" /> Solicitud
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[#7A746E]">{row.servicio}</p>
                  {row.nota_admin ? (
                    <p className="mt-1 text-xs italic text-[#7A746E]/85">📝 {row.nota_admin}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:flex-col">
                  <a
                    href={waClienteHref(row)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-xs font-semibold text-white shadow-md sm:flex-initial"
                    style={{ boxShadow: '0 8px 24px rgba(37,211,102,0.28)' }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                  <span className="hidden rounded-xl border border-[#003D5B]/10 bg-white/80 p-2 text-[#003D5B]/40 sm:inline-flex">
                    <MoreVertical className="h-5 w-5" aria-hidden />
                  </span>
                </div>
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {menuRow ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar menú"
              className="fixed inset-0 z-[100] bg-[#003D5B]/35 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setMenuRow(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="agenda-accion-titulo"
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
              <h2 id="agenda-accion-titulo" className="text-serif-premium text-lg font-bold text-[#003D5B]">
                Turno {horaCorta(menuRow.hora)} · {menuRow.full_name}
              </h2>
              <p className="mt-1 text-sm text-[#7A746E]">{menuRow.servicio}</p>

              <p className="mb-3 mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
                Cambiar estado
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['confirmado', '🟢 Confirmado'],
                    ['pendiente', '🟡 Pendiente'],
                    ['realizado', '🔵 Realizado'],
                    ['cancelado', '🔴 Cancelado'],
                  ] as const
                ).map(([estado, label]) => (
                  <button
                    key={estado}
                    type="button"
                    disabled={saving || menuRow.estado === estado}
                    onClick={() => void aplicarEstado(estado)}
                    className="rounded-2xl border border-[#F2D7D5]/70 bg-white/90 px-3 py-3 text-left text-[13px] font-semibold text-[#003D5B] transition hover:bg-[#F2D7D5]/25 disabled:opacity-45"
                  >
                    {label}
                  </button>
                ))}
              </div>
                            <button
                type="button"
                disabled={saving}
                onClick={() => {
                  const row = menuRow;
                  setMenuRow(null);
                  setEditarCitaRow(row);
                }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#003D5B]/15 bg-white py-4 text-sm font-semibold text-[#003D5B] transition hover:bg-[#F2D7D5]/30"
              >
                <Pencil className="h-4 w-4" />
                Editar fecha y hora
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void borrarTurno()}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar turno
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setMenuRow(null)}
                className="mt-3 w-full rounded-2xl py-3 text-center text-sm font-medium text-[#003D5B]/55"
              >
                Cerrar
              </button>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {/* ─── Modal: Nuevo turno (creado por admin) ─── */}
      <AnimatePresence>
        {nuevoOpen ? (
          <NuevoTurnoModal
            fechaInicialYmd={fechaYmd}
            onClose={() => setNuevoOpen(false)}
            onCreated={async (cita) => {
              setNuevoOpen(false);
              setAccionMsg(`Turno creado · ${cita.full_name} · ${horaCorta(cita.hora)}`);
              // Si la cita cae en el día visible, refrescamos
              if (cita.fecha === fechaYmd) {
                await load();
              } else {
                // Saltar al día del turno creado
                const [y, m, d] = cita.fecha.split('-').map(Number);
                setDia(new Date(y, m - 1, d));
              }
              await loadSolicitudes();
            }}
          />
        ) : null}
      </AnimatePresence>
            <AnimatePresence>
        {editarCitaRow ? (
          <EditarCitaModal
            cita={{
              id: editarCitaRow.id,
              cliente_id: editarCitaRow.cliente_id,
              servicio: editarCitaRow.servicio,
              fecha: editarCitaRow.fecha,
              hora: editarCitaRow.hora,
              estado: editarCitaRow.estado,
            } satisfies CitaClienteRow}
            onClose={() => setEditarCitaRow(null)}
            onSaved={async () => {
              setEditarCitaRow(null);
              await load();
              await loadSolicitudes();
            }}
          />
        ) : null}
      </AnimatePresence>
    </AdminShell>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// NuevoTurnoModal — formulario para que el admin cargue un turno.
// Flujo: 1) elegir cliente (buscador) → 2) servicio + fecha → 3) hora libre
// ═════════════════════════════════════════════════════════════════════════

type NuevoTurnoCreated = CitaAdminListRow;

function NuevoTurnoModal(props: {
  fechaInicialYmd: string;
  onClose: () => void;
  onCreated: (cita: NuevoTurnoCreated) => void | Promise<void>;
}) {
  const [termino, setTermino] = useState('');
  const [opciones, setOpciones] = useState<ClienteOpcion[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [cliente, setCliente] = useState<ClienteOpcion | null>(null);

  // Sub-form "crear cliente nuevo"
  const [mostrarCrearCliente, setMostrarCrearCliente] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTel, setNuevoTel] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [crearClienteErr, setCrearClienteErr] = useState<string | null>(null);

  const [servicio, setServicio] = useState<string>('');
  const [fechaYmd, setFechaYmd] = useState<string>(props.fechaInicialYmd);
  const [hora, setHora] = useState<string>('');
  const [nota, setNota] = useState<string>('');
  const [estadoInicial, setEstadoInicial] = useState<CitaEstado>('confirmado');

  const todasFranjas = useMemo(() => generarFranjasComerciales(), []);
  const [slotsLibres, setSlotsLibres] = useState<string[]>(todasFranjas);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsErr, setSlotsErr] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Buscar clientes con debounce
  useEffect(() => {
    let cancel = false;
    setBuscando(true);
    const t = setTimeout(async () => {
      const { rows, error } = await buscarClientesActivos(termino, 20);
      if (cancel) return;
      setBuscando(false);
      if (error) {
        setOpciones([]);
        return;
      }
      setOpciones(rows);
    }, 220);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [termino]);

  // Recargar horarios libres al cambiar la fecha
  useEffect(() => {
    let cancel = false;
    (async () => {
      setSlotsLoading(true);
      setSlotsErr(null);
      const { horasOcupadas, error } = await fetchHorasOcupadasPorFecha(fechaYmd);
      if (cancel) return;
      setSlotsLoading(false);
      if (error) {
        setSlotsErr(error);
        setSlotsLibres([...todasFranjas]);
        return;
      }
      setSlotsLibres(filtrarFranjasDisponibles(horasOcupadas, todasFranjas));
    })();
    return () => {
      cancel = true;
    };
  }, [fechaYmd, todasFranjas]);

  const canSubmit = !!(cliente && servicio && fechaYmd && hora && !saving);

  async function guardar() {
    if (!canSubmit || !cliente) return;
    setSaving(true);
    setErrMsg(null);
    const { cita, error } = await crearCitaAdmin({
      clienteId: cliente.id,
      servicio,
      fechaYmd,
      hora,
      estado: estadoInicial,
      notaAdmin: nota.trim() || null,
    });
    setSaving(false);
    if (error || !cita) {
      setErrMsg(error ?? 'No se pudo crear el turno.');
      return;
    }
    await props.onCreated({
      ...cita,
      full_name: cliente.full_name,
      phone: cliente.phone,
      creado_por_admin: true,
      nota_admin: nota.trim() || null,
    });
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
          <h2 className="text-serif-premium text-xl font-bold text-[#003D5B]">Nuevo turno</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#003D5B]/45">
            Cargado por recepción
          </p>

          {errMsg ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errMsg}
            </div>
          ) : null}

          {/* ── Cliente ── */}
          <section className="mt-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
              1 · Cliente
            </p>
            {cliente ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#BFC9A2]/45 bg-[#BFC9A2]/12 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#003D5B]">{cliente.full_name}</p>
                  <p className="truncate text-xs text-[#7A746E]">
                    {cliente.phone || '—'} · {cliente.email || '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCliente(null)}
                  className="rounded-full border border-[#003D5B]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]"
                >
                  Cambiar
                </button>
              </div>
            ) : mostrarCrearCliente ? (
              <div className="rounded-2xl border border-[#BFC9A2]/45 bg-[#BFC9A2]/8 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#003D5B]">
                    Nuevo cliente
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarCrearCliente(false);
                      setCrearClienteErr(null);
                    }}
                    className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/60"
                  >
                    ← Volver a buscar
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/55">
                      Nombre completo *
                    </span>
                    <input
                      type="text"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      placeholder="Ej: María Pérez"
                      className="mt-1 w-full rounded-xl border border-[#F2D7D5]/75 bg-white px-3 py-2 text-sm text-[#003D5B] outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/55">
                      Teléfono / WhatsApp *
                    </span>
                    <input
                      type="tel"
                      value={nuevoTel}
                      onChange={(e) => setNuevoTel(e.target.value)}
                      placeholder="Ej: 2634123456"
                      className="mt-1 w-full rounded-xl border border-[#F2D7D5]/75 bg-white px-3 py-2 text-sm text-[#003D5B] outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/55">
                      Email (opcional)
                    </span>
                    <input
                      type="email"
                      value={nuevoEmail}
                      onChange={(e) => setNuevoEmail(e.target.value)}
                      placeholder="cliente@ejemplo.com"
                      className="mt-1 w-full rounded-xl border border-[#F2D7D5]/75 bg-white px-3 py-2 text-sm text-[#003D5B] outline-none"
                    />
                  </label>
                </div>
                {crearClienteErr ? (
                  <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-800">
                    {crearClienteErr}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={creandoCliente}
                  onClick={async () => {
                    setCrearClienteErr(null);
                    setCreandoCliente(true);
                    const { cliente: nuevo, error } = await crearClienteWalkin({
                      fullName: nuevoNombre,
                      phone: nuevoTel,
                      email: nuevoEmail,
                    });
                    setCreandoCliente(false);
                    if (error || !nuevo) {
                      setCrearClienteErr(error ?? 'No se pudo crear el cliente.');
                      return;
                    }
                    setCliente(nuevo);
                    setMostrarCrearCliente(false);
                    setNuevoNombre('');
                    setNuevoTel('');
                    setNuevoEmail('');
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#003D5B] py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white disabled:opacity-50"
                >
                  {creandoCliente ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                  {creandoCliente ? 'Creando…' : 'Guardar cliente'}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-2xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5">
                  <Search className="h-4 w-4 text-[#003D5B]/45" />
                  <input
                    autoFocus
                    type="text"
                    value={termino}
                    onChange={(e) => setTermino(e.target.value)}
                    placeholder="Buscar por nombre, teléfono o email"
                    className="w-full bg-transparent text-sm text-[#003D5B] outline-none placeholder:text-[#003D5B]/30"
                  />
                  {buscando ? <Loader2 className="h-4 w-4 animate-spin text-[#003D5B]/45" /> : null}
                </div>
                <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-[#F2D7D5]/55 bg-white/85">
                  {opciones.length === 0 && !buscando ? (
                    <p className="px-4 py-3 text-xs text-[#7A746E]">
                      {termino.trim().length >= 2
                        ? 'Sin coincidencias. Podés cargarlo desde abajo.'
                        : 'Mostrando clientes activos… escribí para filtrar.'}
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#F2D7D5]/40">
                      {opciones.map((o) => (
                        <li key={o.id}>
                          <button
                            type="button"
                            onClick={() => setCliente(o)}
                            className="block w-full px-4 py-3 text-left transition hover:bg-[#F2D7D5]/25"
                          >
                            <p className="text-sm font-semibold text-[#003D5B]">{o.full_name}</p>
                            <p className="text-xs text-[#7A746E]">
                              {o.phone || '—'} · {o.email || '—'}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarCrearCliente(true);
                    setNuevoNombre(termino.trim());
                    setCrearClienteErr(null);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#003D5B]/25 bg-white/40 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#003D5B] transition hover:border-[#003D5B]/45 hover:bg-white/70"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Crear cliente nuevo
                </button>
              </>
            )}
          </section>

          {/* ── Servicio + fecha + estado inicial ── */}
          <section className="mt-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
              2 · Servicio y fecha
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                  Servicio
                </span>
                <select
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5 text-sm text-[#003D5B] outline-none"
                >
                  <option value="">— Elegir —</option>
                  {serviciosCatalogo.map((cat) => (
                    <optgroup key={cat.id} label={cat.label}>
                      {cat.services.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                  Fecha
                </span>
                <input
                  type="date"
                  value={fechaYmd}
                  onChange={(e) => {
                    if (e.target.value) {
                      setFechaYmd(e.target.value);
                      setHora('');
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5 text-sm text-[#003D5B] outline-none"
                />
              </label>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                Estado inicial
              </span>
              {(['confirmado', 'pendiente'] as const).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEstadoInicial(e)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                    estadoInicial === e
                      ? e === 'confirmado'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white'
                      : 'border border-[#003D5B]/15 bg-white/80 text-[#003D5B]'
                  }`}
                >
                  {e === 'confirmado' ? '🟢 Confirmado' : '🟡 Pendiente'}
                </button>
              ))}
            </div>
          </section>

          {/* ── Hora ── */}
          {/* ── Hora ── */}
<section className="mt-6">
  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
    3 · Horario
    {slotsLoading ? <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin" /> : null}
  </p>

  {/* Input libre — el admin siempre puede escribir cualquier hora */}
  <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5">
    <Clock className="h-4 w-4 shrink-0 text-[#003D5B]/45" />
    <input
      type="time"
      value={hora.slice(0, 5)}
      onChange={(e) => setHora(e.target.value ? `${e.target.value}:00` : '')}
      className="w-full bg-transparent text-sm text-[#003D5B] outline-none"
      placeholder="--:--"
    />
    {hora ? (
      <span className="text-[10px] font-semibold text-[#003D5B]/45">
        seleccionado
      </span>
    ) : null}
  </div>

  {/* Slots sugeridos como acceso rápido */}
  {slotsErr ? (
    <p className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
      {slotsErr}
    </p>
  ) : null}

  {!slotsLoading && (
    <>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/35">
        Huecos disponibles
      </p>
      {slotsLibres.length === 0 ? (
        <p className="text-sm text-[#7A746E]">
          No quedan horas libres este día. Igual podés ingresar una hora arriba.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slotsLibres.map((hh) => {
            const hhCorta = horaCorta(hh);
            const seleccionado = hora.slice(0, 5) === hhCorta;
            return (
              <button
                key={hh}
                type="button"
                onClick={() => setHora(hh)}
                className={`min-h-[40px] rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                  seleccionado
                    ? 'border-[#003D5B] bg-[#003D5B] text-white'
                    : 'border-[#003D5B]/15 bg-white text-[#003D5B] hover:bg-[#F2D7D5]/25'
                }`}
              >
                {hhCorta} hs
              </button>
            );
          })}
        </div>
      )}
    </>
  )}
</section>

          {/* ── Nota ── */}
          <section className="mt-6">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                Nota interna (opcional)
              </span>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Comentarios para recepción/profesional."
                rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2 text-sm text-[#003D5B] outline-none"
              />
            </label>
          </section>

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
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Guardando…' : 'Cargar turno'}
          </motion.button>

          {!canSubmit && !saving ? (
            <p className="mt-3 text-center text-[11px] text-[#7A746E]">
              {!cliente
                ? 'Elegí un cliente para continuar.'
                : !servicio
                  ? 'Elegí el servicio.'
                  : !hora
                    ? 'Elegí un horario.'
                    : ''}
            </p>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}
