import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { PerfilClienteRow } from '@/lib/perfilCliente';
import { listPerfilesClientesAdmin } from './adminApi';
import { AdminShell } from './AdminShell';
import {
  agruparPorCliente,
  listTratamientosAdmin,
  type ClienteAgrupado,
  type TratamientoClienteRow,
  type TratamientoEstado,
} from './adminTratamientosApi';
import AsignarTratamientoModal from './AsignarTratamientoModal';
import ClienteDrawer from './ClienteDrawer';

type AdminOutletCtx = { onSignOut: () => void };
type FiltroEstado = TratamientoEstado | 'todos';

function estadoChipClass(e: TratamientoEstado): string {
  return {
    activo: 'bg-emerald-50 text-emerald-900',
    finalizado: 'bg-sky-50 text-sky-900',
    pausado: 'bg-amber-50 text-amber-900',
    cancelado: 'bg-red-50 text-red-900',
  }[e];
}

function estadoLabelCorto(e: TratamientoEstado): string {
  return { activo: 'Activo', finalizado: 'Finaliz.', pausado: 'Pausado', cancelado: 'Cancel.' }[e];
}

export default function AdminTratamientosView() {
  const { onSignOut } = useOutletContext<AdminOutletCtx>();

  const [rowsRaw, setRowsRaw] = useState<TratamientoClienteRow[]>([]);
  const [perfiles, setPerfiles] = useState<PerfilClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('activo');

  const [asignarOpen, setAsignarOpen] = useState(false);
  const [drawerCliente, setDrawerCliente] = useState<PerfilClienteRow | null>(null);

  // ─── Cargar tratamientos + perfiles en paralelo ─────────────
  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const [resTrat, resPerf] = await Promise.all([
      listTratamientosAdmin(),
      listPerfilesClientesAdmin(),
    ]);
    if (resTrat.error) setErr(resTrat.error);
    else setRowsRaw(resTrat.rows);
    if (!resPerf.error) setPerfiles(resPerf.rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ─── Agrupar por cliente y filtrar ─────────────────────────
  const gruposFiltrados = useMemo(() => {
    const todos = agruparPorCliente(rowsRaw);
    const q = busqueda.trim().toLowerCase();

    return todos.filter((g) => {
      // Filtro estado: al menos un tratamiento en ese estado
      if (filtroEstado !== 'todos') {
        const tieneEnEstado = g.tratamientos.some((t) => t.estado === filtroEstado);
        if (!tieneEnEstado) return false;
      }
      // Búsqueda
      if (q) {
        const matchNombre = g.cliente_nombre.toLowerCase().includes(q);
        const matchTel = g.cliente_telefono.toLowerCase().includes(q);
        const matchServ = g.tratamientos.some(
          (t) =>
            t.servicio_nombre.toLowerCase().includes(q) ||
            t.profesional.toLowerCase().includes(q)
        );
        if (!matchNombre && !matchTel && !matchServ) return false;
      }
      return true;
    });
  }, [rowsRaw, busqueda, filtroEstado]);

  // ─── Stats (mismas que antes) ───────────────────────────────
  const stats = useMemo(() => {
    const activos = rowsRaw.filter((r) => r.estado === 'activo').length;
    const finalizados = rowsRaw.filter((r) => r.estado === 'finalizado').length;
    const sesionesHechas = rowsRaw.reduce((acc, r) => acc + r.sesiones_realizadas, 0);
    return { total: rowsRaw.length, activos, finalizados, sesionesHechas };
  }, [rowsRaw]);

  // ─── Click en cliente → abrir drawer ────────────────────────
  function abrirDrawerDeCliente(g: ClienteAgrupado) {
    const perfil = perfiles.find((p) => p.id === g.cliente_id);
    if (perfil) {
      setDrawerCliente(perfil);
    } else {
      // Fallback si el perfil no está en la lista (no debería pasar)
      setDrawerCliente({
        id: g.cliente_id,
        full_name: g.cliente_nombre,
        phone: g.cliente_telefono,
        status: 'active',
      });
    }
  }

  return (
    <AdminShell
      onSignOut={onSignOut}
      title="Tratamientos"
      subtitle="Vista agrupada por cliente"
      actions={
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setAsignarOpen(true)}
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
            placeholder="Buscar cliente, servicio o profesional…"
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

      {/* ─── Lista de clientes ─── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#003D5B]/55">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Cargando…</span>
        </div>
      ) : err ? (
        <div className="rounded-3xl border border-red-100 bg-red-50/90 px-5 py-10 text-center text-sm text-red-800">
          {err}
        </div>
      ) : gruposFiltrados.length === 0 ? (
        <div
          className="rounded-3xl border border-[#F2D7D5]/60 bg-[#FDF8F5]/95 px-6 py-16 text-center shadow-md"
          style={{ boxShadow: '0 20px 56px rgba(0,61,91,0.06)' }}
        >
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-[#B8956E]" />
          <p className="text-serif-premium text-lg text-[#003D5B]/75">
            {rowsRaw.length === 0
              ? 'Todavía no hay tratamientos asignados.'
              : 'No se encontraron clientes con esos filtros.'}
          </p>
          <p className="mt-2 text-sm text-[#7A746E]">
            {rowsRaw.length === 0
              ? 'Asigná el primer tratamiento desde el botón "Asignar tratamiento".'
              : 'Probá cambiar los filtros o el término de búsqueda.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {gruposFiltrados.map((g) => (
            <ClienteCard key={g.cliente_id} grupo={g} onOpen={() => abrirDrawerDeCliente(g)} />
          ))}
        </ul>
      )}

      {/* ─── Modales ─── */}
      <AnimatePresence>
        {asignarOpen ? (
          <AsignarTratamientoModal
            onClose={() => setAsignarOpen(false)}
            onCreated={async () => {
              setAsignarOpen(false);
              await load();
            }}
          />
        ) : null}

        {drawerCliente ? (
          <ClienteDrawer
            cliente={drawerCliente}
            onClose={() => {
              setDrawerCliente(null);
              void load();
            }}
          />
        ) : null}
      </AnimatePresence>
    </AdminShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════════════════

function ClienteCard({ grupo, onOpen }: { grupo: ClienteAgrupado; onOpen: () => void }) {
  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left"
      >
        <div
          className="rounded-3xl border border-[#F2D7D5]/65 bg-[#FDF8F5]/98 p-4 shadow-md transition hover:border-[#BFC9A2]/55 hover:shadow-lg sm:p-5"
          style={{ boxShadow: '0 14px 40px rgba(0,61,91,0.07)' }}
        >
          {/* Header del cliente */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, #F2D7D5, #BFC9A2)',
                }}
              >
                {grupo.cliente_nombre.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h3 className="text-serif-premium truncate text-lg font-bold text-[#003D5B]">
                  {grupo.cliente_nombre}
                </h3>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#7A746E]">
                  {grupo.cliente_telefono ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {grupo.cliente_telefono}
                    </span>
                  ) : null}
                  <span>💎 {grupo.puntosTotales} pts</span>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {grupo.cantActivos > 0 ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-900">
                  {grupo.cantActivos} activo{grupo.cantActivos !== 1 ? 's' : ''}
                </span>
              ) : null}
              <ChevronRight className="h-5 w-5 text-[#003D5B]/35" />
            </div>
          </div>

          {/* Mini lista de tratamientos */}
          <ul className="mt-4 space-y-1.5">
            {grupo.tratamientos.slice(0, 4).map((t) => {
              const pct =
                t.sesiones_totales > 0
                  ? Math.round((t.sesiones_realizadas / t.sesiones_totales) * 100)
                  : 0;
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-2 rounded-xl border border-[#F2D7D5]/45 bg-white/70 px-3 py-2"
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#003D5B]/8 text-[10px]">
                    💆
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#003D5B]">
                      {t.servicio_nombre}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#003D5B]/8">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #BFC9A2 0%, #003D5B 100%)',
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-[#003D5B]/65">
                        {t.sesiones_realizadas}/{t.sesiones_totales}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${estadoChipClass(
                      t.estado
                    )}`}
                  >
                    {estadoLabelCorto(t.estado)}
                  </span>
                </li>
              );
            })}
            {grupo.tratamientos.length > 4 ? (
              <li className="px-3 text-[10px] italic text-[#7A746E]">
                + {grupo.tratamientos.length - 4} tratamiento(s) más…
              </li>
            ) : null}
          </ul>

          {/* CTA */}
          <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#003D5B]/70">
            Ver ficha completa
            <ChevronRight className="h-3 w-3" />
          </p>
        </div>
      </button>
    </motion.li>
  );
}

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