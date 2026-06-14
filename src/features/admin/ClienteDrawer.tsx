import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Calendar,
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Sparkles,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import type { PerfilClienteRow } from '@/lib/perfilCliente';
import {
  actualizarEstadoTratamiento,
  eliminarTratamiento,
  listFotosByTratamiento,
  listSesionesByTratamiento,
  listTratamientosAdmin,
  type FotoRow,
  type SesionRow,
  type TratamientoClienteRow,
  type TratamientoEstado,
} from './adminTratamientosApi';
import { listCitasCliente, type CitaClienteRow } from '@/lib/citasApi';
import RegistrarSesionModal from './RegistrarSesionModal';
import AsignarTratamientoModal from './AsignarTratamientoModal';
import SubirFotoModal from './SubirFotoModal';
import EditarCitaModal from './EditarCitaModal';
import EditarSesionModal from './EditarSesionModal';

type TabId = 'tratamientos' | 'citas' | 'datos';

const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'tratamientos', label: 'Tratamientos', icon: Sparkles },
  { id: 'citas', label: 'Citas', icon: CalendarDays },
  { id: 'datos', label: 'Datos', icon: UserIcon },
];

function estadoLabel(e: TratamientoEstado): string {
  return { activo: '🟢 Activo', pausado: '⏸️ Pausado', finalizado: '✅ Finalizado', cancelado: '❌ Cancelado' }[e];
}

function estadoCita(e: CitaClienteRow['estado']): string {
  return { pendiente: '⏳ Pendiente', confirmado: '✅ Confirmado', realizado: '💆 Realizado', cancelado: '❌ Cancelado' }[e];
}

export default function ClienteDrawer(props: {
  cliente: PerfilClienteRow;
  onClose: () => void;
}) {
  const { cliente } = props;
  const [tab, setTab] = useState<TabId>('tratamientos');

  const [tratamientos, setTratamientos] = useState<TratamientoClienteRow[]>([]);
  const [citas, setCitas] = useState<CitaClienteRow[]>([]);
  const [loadingTrat, setLoadingTrat] = useState(true);
  const [loadingCitas, setLoadingCitas] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Modales secundarios
  const [sesionTrat, setSesionTrat] = useState<TratamientoClienteRow | null>(null);
  const [fotoTrat, setFotoTrat] = useState<TratamientoClienteRow | null>(null);
  const [editarCita, setEditarCita] = useState<CitaClienteRow | null>(null);
  const [editarSesion, setEditarSesion] = useState<SesionRow | null>(null);
  const [asignarOpen, setAsignarOpen] = useState(false);

  // ─── Cargar tratamientos del cliente ──────────────────────
  const loadTratamientos = useCallback(async () => {
    setLoadingTrat(true);
    const { rows, error } = await listTratamientosAdmin();
    if (error) {
      setErrMsg(error);
      setTratamientos([]);
    } else {
      // Filtrar solo los de este cliente
      const míos = rows.filter((t) => t.cliente_id === cliente.id);
      // Ordenar: activos primero
      míos.sort((a, b) => {
        if (a.estado === 'activo' && b.estado !== 'activo') return -1;
        if (a.estado !== 'activo' && b.estado === 'activo') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setTratamientos(míos);
    }
    setLoadingTrat(false);
  }, [cliente.id]);

  const loadCitas = useCallback(async () => {
    setLoadingCitas(true);
    const { rows, error } = await listCitasCliente(cliente.id);
    if (error) setErrMsg(error);
    else setCitas(rows);
    setLoadingCitas(false);
  }, [cliente.id]);

  useEffect(() => {
    void loadTratamientos();
    void loadCitas();
  }, [loadTratamientos, loadCitas]);

  // Stats datos
  const stats = useMemo(() => {
    const puntos = tratamientos.reduce((acc, t) => acc + t.puntos_acumulados, 0);
    const activos = tratamientos.filter((t) => t.estado === 'activo').length;
    const sesiones = tratamientos.reduce((acc, t) => acc + t.sesiones_realizadas, 0);
    return { puntos, activos, sesiones };
  }, [tratamientos]);

  async function cambiarEstadoTrat(t: TratamientoClienteRow, nuevo: TratamientoEstado) {
    const { error } = await actualizarEstadoTratamiento(t.id, nuevo);
    if (error) {
      setErrMsg(error);
      return;
    }
    await loadTratamientos();
  }

  async function borrarTrat(t: TratamientoClienteRow) {
    if (
      !window.confirm(
        `¿Eliminar el tratamiento "${t.servicio_nombre}"?\n\nSe borrarán sesiones y fotos asociadas.`
      )
    )
      return;
    const { error } = await eliminarTratamiento(t.id);
    if (error) {
      setErrMsg(error);
      return;
    }
    await loadTratamientos();
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[800]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Cerrar"
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: 'rgba(0,61,91,0.45)' }}
          onClick={props.onClose}
        />

        {/* Drawer panel */}
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="absolute right-0 top-0 h-full w-full max-w-[920px] overflow-hidden shadow-2xl sm:w-[85%] md:w-[75%]"
          style={{
            background: 'var(--bg-cream, #FDF8F5)',
            borderLeft: '1px solid rgba(242,215,213,0.75)',
            boxShadow: '-32px 0 64px rgba(0,61,91,0.18)',
          }}
        >
          <div className="flex h-full flex-col">
            {/* ─── Header ─────────────────────────────────── */}
            <header
              className="flex items-center justify-between gap-3 border-b px-6 py-5"
              style={{ borderColor: 'rgba(242,215,213,0.55)' }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #F2D7D5, #BFC9A2)',
                  }}
                >
                  {cliente.full_name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h2 className="text-serif-premium truncate text-xl font-bold text-[#003D5B]">
                    {cliente.full_name}
                  </h2>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#003D5B]/50">
                    {cliente.phone || 'Sin teléfono'} · {cliente.status}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={props.onClose}
                className="rounded-full p-2 text-[#003D5B]/55 transition hover:bg-[#F2D7D5]/45"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* ─── Stats rápidas ──────────────────────────── */}
            <div className="grid grid-cols-3 gap-2 border-b px-6 py-3 sm:px-8"
                 style={{ borderColor: 'rgba(242,215,213,0.55)' }}>
              <MiniStat icon={<Sparkles className="h-3.5 w-3.5" />} label="Tratamientos" value={tratamientos.length} />
              <MiniStat icon={<Activity className="h-3.5 w-3.5" />} label="Activos" value={stats.activos} accent="emerald" />
              <MiniStat icon={<UserIcon className="h-3.5 w-3.5" />} label="Pts. totales" value={stats.puntos} accent="amber" />
            </div>

            {/* ─── Tabs ───────────────────────────────────── */}
            <nav
              className="flex shrink-0 gap-1 border-b px-4 py-2"
              style={{ borderColor: 'rgba(242,215,213,0.55)' }}
            >
              {TABS.map((t) => {
                const isActive = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition ${
                      isActive
                        ? 'bg-[#003D5B] text-white shadow'
                        : 'text-[#003D5B]/65 hover:bg-[#F2D7D5]/30'
                    }`}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </nav>

            {errMsg ? (
              <div className="mx-6 mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
                {errMsg}
              </div>
            ) : null}

            {/* ─── Contenido ──────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8">
                            {tab === 'tratamientos' ? (
                <TabTratamientos
                  loading={loadingTrat}
                  tratamientos={tratamientos}
                  onRegistrarSesion={(t) => setSesionTrat(t)}
                  onSubirFoto={(t) => setFotoTrat(t)}
                  onCambiarEstado={(t, e) => void cambiarEstadoTrat(t, e)}
                  onEliminar={(t) => void borrarTrat(t)}
                  onEditarSesion={(s) => setEditarSesion(s)}
                  onAsignarNuevo={() => setAsignarOpen(true)}
                />
              ) : null}

              {tab === 'citas' ? (
                <TabCitas
                  loading={loadingCitas}
                  citas={citas}
                  onEditar={(c) => setEditarCita(c)}
                />
              ) : null}

              {tab === 'datos' ? <TabDatos cliente={cliente} stats={stats} /> : null}
            </div>
          </div>
        </motion.aside>
      </motion.div>

      {/* ─── Modales anidados ────────────────────────────── */}
      <AnimatePresence>
                {asignarOpen ? (
          <AsignarTratamientoModal
            clientePreseleccionadoId={cliente.id}
            onClose={() => setAsignarOpen(false)}
            onCreated={async () => {
              setAsignarOpen(false);
              await loadTratamientos();
            }}
          />
        ) : null}
        {sesionTrat ? (
          <RegistrarSesionModal
            tratamiento={sesionTrat}
            onClose={() => setSesionTrat(null)}
            onCreated={async () => {
              setSesionTrat(null);
              await loadTratamientos();
            }}
          />
        ) : null}
        {fotoTrat ? (
          <SubirFotoModal
            tratamiento={fotoTrat}
            onClose={() => setFotoTrat(null)}
            onUploaded={async () => {
              setFotoTrat(null);
              await loadTratamientos();
            }}
          />
        ) : null}
        {editarCita ? (
          <EditarCitaModal
            cita={editarCita}
            onClose={() => setEditarCita(null)}
            onSaved={async () => {
              setEditarCita(null);
              await loadCitas();
            }}
          />
        ) : null}
        {editarSesion ? (
          <EditarSesionModal
            sesion={editarSesion}
            onClose={() => setEditarSesion(null)}
            onSaved={async () => {
              setEditarSesion(null);
              await loadTratamientos();
            }}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════════════════

function MiniStat({
  icon,
  label,
  value,
  accent = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: 'default' | 'emerald' | 'amber';
}) {
  const accentMap = {
    default: 'bg-[#003D5B]/8 text-[#003D5B]',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <div
      className="rounded-xl border border-[#F2D7D5]/55 bg-white/70 px-3 py-2"
    >
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg ${accentMap[accent]}`}>
          {icon}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-[#7A746E]">
          {label}
        </span>
      </div>
      <p className="text-serif-premium mt-1 text-lg font-bold text-[#003D5B]">{value}</p>
    </div>
  );
}

// ─── Tab Tratamientos ────────────────────────────────────────

function TabTratamientos(props: {
  loading: boolean;
  tratamientos: TratamientoClienteRow[];
  onRegistrarSesion: (t: TratamientoClienteRow) => void;
  onSubirFoto: (t: TratamientoClienteRow) => void;
  onCambiarEstado: (t: TratamientoClienteRow, e: TratamientoEstado) => void;
  onEliminar: (t: TratamientoClienteRow) => void;
  onEditarSesion: (s: SesionRow) => void;
  onAsignarNuevo: () => void;
}) {
  if (props.loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[#003D5B]/55">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Cargando tratamientos…</span>
      </div>
    );
  }

    if (props.tratamientos.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#003D5B]/15 bg-white/40 px-6 py-12 text-center">
        <Sparkles className="mx-auto mb-2 h-8 w-8 text-[#B8956E]" />
        <p className="text-sm font-semibold text-[#003D5B]">
          Este cliente todavía no tiene tratamientos.
        </p>
        <button
          type="button"
          onClick={props.onAsignarNuevo}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#003D5B] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Asignar primer tratamiento
        </button>
      </div>
    );
  }

        return (
    <div className="space-y-3">
      {/* Botón asignar nuevo tratamiento */}
      <button
        type="button"
        onClick={props.onAsignarNuevo}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#003D5B]/25 bg-white/40 py-3 text-sm font-semibold text-[#003D5B] transition hover:border-[#003D5B]/45 hover:bg-white/70"
      >
        <Plus className="h-4 w-4" />
        Asignar otro tratamiento
      </button>

      <ul className="space-y-3">
        {props.tratamientos.map((t) => (
          <TratamientoCard
            key={t.id}
            tratamiento={t}
            onRegistrarSesion={() => props.onRegistrarSesion(t)}
            onSubirFoto={() => props.onSubirFoto(t)}
            onCambiarEstado={(e) => props.onCambiarEstado(t, e)}
            onEliminar={() => props.onEliminar(t)}
            onEditarSesion={props.onEditarSesion}
          />
        ))}
      </ul>
    </div>
  );
}

function TratamientoCard(props: {
  tratamiento: TratamientoClienteRow;
  onRegistrarSesion: () => void;
  onSubirFoto: () => void;
  onCambiarEstado: (e: TratamientoEstado) => void;
  onEliminar: () => void;
  onEditarSesion: (s: SesionRow) => void;
}) {
  const { tratamiento: t } = props;
  const [expanded, setExpanded] = useState(false);
  const [sesiones, setSesiones] = useState<SesionRow[]>([]);
  const [fotos, setFotos] = useState<FotoRow[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const cargarDetalle = useCallback(async () => {
    setLoadingDetalle(true);
    const [{ rows: ses }, { rows: fts }] = await Promise.all([
      listSesionesByTratamiento(t.id),
      listFotosByTratamiento(t.id),
    ]);
    setSesiones(ses);
    setFotos(fts);
    setLoadingDetalle(false);
  }, [t.id]);

  function toggleExpanded() {
    setExpanded((v) => {
      const nuevo = !v;
      if (nuevo) void cargarDetalle();
      return nuevo;
    });
  }

  const porcentaje =
    t.sesiones_totales > 0
      ? Math.round((t.sesiones_realizadas / t.sesiones_totales) * 100)
      : 0;

  return (
    <li
      className="rounded-2xl border border-[#F2D7D5]/65 bg-white/85 p-4 shadow-sm"
      style={{ boxShadow: '0 8px 24px rgba(0,61,91,0.05)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-serif-premium text-base font-bold text-[#003D5B]">
              {t.servicio_nombre}
            </h3>
            <span className="rounded-full bg-[#003D5B]/8 px-2 py-0.5 text-[10px] font-semibold text-[#003D5B]">
              {estadoLabel(t.estado)}
            </span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#7A746E]">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {t.profesional}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {t.zona}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(t.fecha_inicio + 'T12:00:00'), 'd MMM yyyy', {
                locale: esLocale,
              })}
            </span>
            <span>💎 {t.puntos_acumulados} pts</span>
          </p>

          {/* Progreso */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/65">
              <span>
                {t.sesiones_realizadas} / {t.sesiones_totales} sesiones
              </span>
              <span>{porcentaje}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#003D5B]/10">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #BFC9A2 0%, #003D5B 100%)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${porcentaje}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleExpanded}
          className="shrink-0 rounded-full border border-[#003D5B]/15 bg-white px-2 py-2 text-[#003D5B]"
          aria-label={expanded ? 'Contraer' : 'Expandir'}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Acciones */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={props.onRegistrarSesion}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#003D5B] px-3 py-1.5 text-[11px] font-semibold text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Sesión
        </button>
        <button
          type="button"
          onClick={props.onSubirFoto}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#B8956E]/45 bg-[#B8956E]/10 px-3 py-1.5 text-[11px] font-semibold text-[#8B6F4E]"
        >
          <Camera className="h-3.5 w-3.5" /> Foto
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#003D5B]/15 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#003D5B]"
          >
            Estado
          </button>
          {menuOpen ? (
            <div
              className="absolute left-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-xl border bg-white shadow-lg"
              style={{ borderColor: 'rgba(242,215,213,0.7)' }}
            >
              {(['activo', 'pausado', 'finalizado', 'cancelado'] as const).map((e) => (
                <button
                  key={e}
                  type="button"
                  disabled={t.estado === e}
                  onClick={() => {
                    setMenuOpen(false);
                    props.onCambiarEstado(e);
                  }}
                  className="block w-full px-3 py-2 text-left text-xs text-[#003D5B] hover:bg-[#F2D7D5]/25 disabled:opacity-40"
                >
                  {estadoLabel(e)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={props.onEliminar}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-800"
        >
          <Trash2 className="h-3.5 w-3.5" /> Eliminar
        </button>
      </div>

      {/* Detalle expandido */}
      <AnimatePresence>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-[#F2D7D5]/55 pt-4">
              {loadingDetalle ? (
                <div className="flex items-center gap-2 py-4 text-xs text-[#003D5B]/55">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando detalle…
                </div>
              ) : (
                <>
                  {/* Sesiones */}
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
                    Sesiones registradas ({sesiones.length})
                  </p>
                  {sesiones.length === 0 ? (
                    <p className="rounded-xl bg-white/60 px-3 py-3 text-xs italic text-[#7A746E]">
                      Aún no hay sesiones registradas.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {sesiones.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[#F2D7D5]/55 bg-white/80 px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#003D5B]">
                              Sesión #{s.numero_sesion} ·{' '}
                              {format(new Date(s.fecha_sesion + 'T12:00:00'), 'd MMM yyyy', {
                                locale: esLocale,
                              })}
                              {s.hora_sesion ? ` · ${s.hora_sesion.slice(0, 5)} hs` : ''}
                            </p>
                            <p className="text-[10px] text-[#7A746E]">
                              {s.profesional} · +{s.puntos_otorgados} pts
                            </p>
                            {s.observaciones ? (
                              <p className="mt-1 line-clamp-2 text-[10px] italic text-[#7A746E]">
                                {s.observaciones}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => props.onEditarSesion(s)}
                            className="shrink-0 rounded-full border border-[#003D5B]/15 bg-white p-1.5 text-[#003D5B]"
                            aria-label="Editar sesión"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Fotos */}
                  <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
                    Fotos ({fotos.length})
                  </p>
                  {fotos.length === 0 ? (
                    <p className="rounded-xl bg-white/60 px-3 py-3 text-xs italic text-[#7A746E]">
                      Sin fotos cargadas.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {fotos.map((f) => (
                        <div
                          key={f.id}
                          className="group relative overflow-hidden rounded-xl border border-[#F2D7D5]/55"
                        >
                          <img
                            src={f.url_foto}
                            alt={f.descripcion ?? 'Foto'}
                            className="h-24 w-full object-cover"
                          />
                          <span
                            className="absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white"
                            style={{ background: 'rgba(0,61,91,0.85)' }}
                          >
                            {f.tipo}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

// ─── Tab Citas ──────────────────────────────────────────────

function TabCitas(props: {
  loading: boolean;
  citas: CitaClienteRow[];
  onEditar: (c: CitaClienteRow) => void;
}) {
  if (props.loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[#003D5B]/55">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Cargando citas…</span>
      </div>
    );
  }

  if (props.citas.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#003D5B]/15 bg-white/40 px-6 py-12 text-center">
        <CalendarDays className="mx-auto mb-2 h-8 w-8 text-[#B8956E]" />
        <p className="text-sm font-semibold text-[#003D5B]">Sin citas registradas.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {props.citas.map((c) => (
        <li
          key={c.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-[#F2D7D5]/65 bg-white/85 px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#003D5B]">{c.servicio}</p>
            <p className="text-[11px] text-[#7A746E]">
              {format(new Date(c.fecha + 'T12:00:00'), "d 'de' MMM yyyy", {
                locale: esLocale,
              })}{' '}
              · {c.hora.slice(0, 5)} hs · {estadoCita(c.estado)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => props.onEditar(c)}
            className="shrink-0 rounded-full border border-[#003D5B]/15 bg-white p-2 text-[#003D5B]"
            aria-label="Editar cita"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

// ─── Tab Datos ──────────────────────────────────────────────

function TabDatos(props: {
  cliente: PerfilClienteRow;
  stats: { puntos: number; activos: number; sesiones: number };
}) {
  const { cliente, stats } = props;
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#F2D7D5]/65 bg-white/85 p-5">
        <h3 className="text-serif-premium mb-3 text-base font-bold text-[#003D5B]">
          Datos personales
        </h3>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-[#7A746E]">
              <UserIcon className="h-3.5 w-3.5" /> Nombre
            </dt>
            <dd className="text-right font-semibold text-[#003D5B]">{cliente.full_name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-[#7A746E]">
              <Phone className="h-3.5 w-3.5" /> Teléfono
            </dt>
            <dd className="text-right font-semibold text-[#003D5B]">
              {cliente.phone || '—'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-[#7A746E]">
              <Activity className="h-3.5 w-3.5" /> Estado
            </dt>
            <dd className="text-right font-semibold text-[#003D5B] capitalize">
              {cliente.status}
            </dd>
          </div>
          {cliente.created_at ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="inline-flex items-center gap-1.5 text-[#7A746E]">
                <Calendar className="h-3.5 w-3.5" /> Alta
              </dt>
              <dd className="text-right font-semibold text-[#003D5B]">
                {format(new Date(cliente.created_at), "d 'de' MMM yyyy", {
                  locale: esLocale,
                })}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="rounded-2xl border border-[#F2D7D5]/65 bg-white/85 p-5">
        <h3 className="text-serif-premium mb-3 text-base font-bold text-[#003D5B]">
          Resumen de actividad
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[#003D5B]/5 px-3 py-3 text-center">
            <p className="text-2xl font-bold text-[#003D5B]">{stats.activos}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7A746E]">
              Activos
            </p>
          </div>
          <div className="rounded-xl bg-[#003D5B]/5 px-3 py-3 text-center">
            <p className="text-2xl font-bold text-[#003D5B]">{stats.sesiones}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7A746E]">
              Sesiones
            </p>
          </div>
          <div className="rounded-xl bg-[#003D5B]/5 px-3 py-3 text-center">
            <p className="text-2xl font-bold text-[#003D5B]">{stats.puntos}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7A746E]">
              Puntos
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}