import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { AdminShell } from './AdminShell';
import { fetchReporteResumen, type ReporteResumen } from './adminReportesApi';

type AdminOutletCtx = { onSignOut: () => void };

function formatARS(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n);
}

function mesActualLabel(): string {
  return format(new Date(), "MMMM yyyy", { locale: esLocale });
}

// ─── Tarjeta de stat principal ───────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  delay,
  accent,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
  accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ?? 0 }}
      className="relative overflow-hidden rounded-3xl p-5 lg:p-6"
      style={{
        background: 'rgba(253,248,245,0.95)',
        border: '1px solid rgba(242,215,213,0.65)',
        boxShadow: '0 12px 40px rgba(0,61,91,0.07)',
      }}
    >
      {/* Círculo decorativo */}
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20"
        style={{ background: accent ?? '#003D5B' }}
      />

      <div className="relative">
        <div
          className="mb-3 inline-flex rounded-2xl p-2.5"
          style={{
            background: `color-mix(in srgb, ${accent ?? '#003D5B'} 12%, transparent)`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: accent ?? '#003D5B' }} />
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/50">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold text-[#003D5B] lg:text-3xl">{value}</p>

        {sub ? (
          <div className="mt-2 flex items-center gap-1.5">
            {trend === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            ) : null}
            <p className="text-xs text-[#7A746E]">{sub}</p>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

// ─── Mini gráfico de barras (sesiones últimos 30 días) ────────
function MiniBarChart({ data }: { data: { fecha: string; cantidad: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-xs text-[#7A746E]">
        Sin sesiones en los últimos 30 días.
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.cantidad), 1);

  return (
    <div className="flex h-24 items-end gap-1">
      {data.map((d) => {
        const pct = (d.cantidad / max) * 100;
        const fechaCorta = format(new Date(d.fecha + 'T12:00:00'), 'd/M', { locale: esLocale });
        return (
          <div key={d.fecha} className="group relative flex flex-1 flex-col items-center gap-0.5">
            <div className="absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded-lg bg-[#003D5B] px-2 py-1 text-[9px] font-semibold text-white group-hover:flex">
              {d.cantidad} · {fechaCorta}
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="w-full min-h-[4px] rounded-t-sm"
              style={{
                background: 'linear-gradient(180deg, #003D5B 0%, #BFC9A2 100%)',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Barra de servicio top ────────────────────────────────────
function ServicioBar({
  nombre,
  cantidad,
  max,
  idx,
}: {
  nombre: string;
  cantidad: number;
  max: number;
  idx: number;
}) {
  const pct = max > 0 ? Math.round((cantidad / max) * 100) : 0;
  const colores = [
    'from-[#003D5B] to-[#005580]',
    'from-[#BFC9A2] to-[#9DB08A]',
    'from-[#F2D7D5] to-[#E8C0BD]',
    'from-[#B8956E] to-[#9A7A58]',
    'from-[#7A746E] to-[#5A5450]',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + idx * 0.07 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="line-clamp-1 text-sm font-semibold text-[#003D5B]">{nombre}</p>
        <span className="shrink-0 text-xs font-bold text-[#003D5B]">
          {cantidad} {cantidad === 1 ? 'tratamiento' : 'tratamientos'}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#003D5B]/8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + idx * 0.07 }}
          className={`h-full rounded-full bg-gradient-to-r ${colores[idx % colores.length]}`}
        />
      </div>
    </motion.div>
  );
}

// ─── Vista principal ──────────────────────────────────────────
export default function AdminReportesView() {
  const { onSignOut } = useOutletContext<AdminOutletCtx>();
  const [reporte, setReporte] = useState<ReporteResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { reporte: r, error: e } = await fetchReporteResumen();
    if (e) setError(e);
    else setReporte(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Comparación de ingresos vs mes anterior
  const diffIngresos =
    reporte && reporte.ingresosMesAnterior > 0
      ? Math.round(
          ((reporte.ingresosMes - reporte.ingresosMesAnterior) / reporte.ingresosMesAnterior) * 100
        )
      : null;

  const trendIngresos =
    diffIngresos === null ? 'neutral' : diffIngresos >= 0 ? 'up' : 'down';

  return (
    <AdminShell
      onSignOut={onSignOut}
      title="Reportes"
      subtitle={`Dashboard de métricas · ${mesActualLabel()}`}
      actions={
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-full border border-[#BFC9A2]/50 bg-white/90 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#003D5B]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </motion.button>
      }
    >
      {/* ── Loading ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-32 text-[#003D5B]/55">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Cargando métricas…</span>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-100 bg-red-50/90 px-5 py-10 text-center text-sm text-red-800">
          {error}
        </div>
      ) : reporte ? (
        <div className="space-y-6">

          {/* ── Fila 1: KPIs principales ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={BarChart3}
              label="Ingresos del mes"
              value={formatARS(reporte.ingresosMes)}
              sub={
                diffIngresos !== null
                  ? `${diffIngresos >= 0 ? '+' : ''}${diffIngresos}% vs mes anterior`
                  : 'Sin datos del mes anterior'
              }
              trend={trendIngresos}
              accent="#003D5B"
              delay={0.05}
            />
            <StatCard
              icon={Users}
              label="Clientes activos"
              value={String(reporte.clientesActivos)}
              sub={`+${reporte.clientesNuevosMes} nuevos este mes`}
              trend="up"
              accent="#BFC9A2"
              delay={0.1}
            />
            <StatCard
              icon={Sparkles}
              label="Tratamientos activos"
              value={String(reporte.tratamientosActivos)}
              sub={`${reporte.tratamientosFinalizadosMes} finalizados este mes`}
              accent="#F2D7D5"
              delay={0.15}
            />
            <StatCard
              icon={CheckCircle2}
              label="Tasa de finalización"
              value={`${reporte.tasaFinalizacion}%`}
              sub="Tratamientos completados vs iniciados"
              accent="#B8956E"
              delay={0.2}
            />
          </div>

          {/* ── Fila 2: Sesiones + Profesional top ── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-3xl p-6"
              style={{
                background: 'rgba(253,248,245,0.95)',
                border: '1px solid rgba(242,215,213,0.65)',
                boxShadow: '0 12px 40px rgba(0,61,91,0.07)',
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/50">
                Sesiones este mes
              </p>
              <p className="mt-1 text-3xl font-bold text-[#003D5B]">{reporte.sesionesMes}</p>
              <p className="mt-1 text-xs text-[#7A746E]">sesiones registradas en el mes</p>

              <div
                className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: 'rgba(191,201,162,0.15)', border: '1px solid rgba(191,201,162,0.3)' }}
              >
                <Award className="h-5 w-5 shrink-0 text-[#003D5B]" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/55">
                    Profesional destacada
                  </p>
                  <p className="truncate text-sm font-bold text-[#003D5B]">
                    {reporte.profesionalTopNombre}
                  </p>
                  <p className="text-[11px] text-[#7A746E]">
                    {reporte.profesionalTopSesiones}{' '}
                    {reporte.profesionalTopSesiones === 1 ? 'sesión' : 'sesiones'} este mes
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Servicios top */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl p-6"
              style={{
                background: 'rgba(253,248,245,0.95)',
                border: '1px solid rgba(242,215,213,0.65)',
                boxShadow: '0 12px 40px rgba(0,61,91,0.07)',
              }}
            >
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/50">
                Servicios más vendidos
              </p>

              {reporte.serviciosTop.length === 0 ? (
                <p className="text-sm text-[#7A746E]">Sin datos de tratamientos aún.</p>
              ) : (
                <div className="space-y-3">
                  {reporte.serviciosTop.map((s, idx) => (
                    <ServicioBar
                      key={s.nombre}
                      nombre={s.nombre}
                      cantidad={s.cantidad}
                      max={reporte.serviciosTop[0].cantidad}
                      idx={idx}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Fila 3: Gráfico sesiones últimos 30 días ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-3xl p-6"
            style={{
              background: 'rgba(253,248,245,0.95)',
              border: '1px solid rgba(242,215,213,0.65)',
              boxShadow: '0 12px 40px rgba(0,61,91,0.07)',
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/50">
                  Actividad — últimos 30 días
                </p>
                <p className="mt-0.5 text-xs text-[#7A746E]">
                  Sesiones registradas por día
                </p>
              </div>
              <span className="rounded-full bg-[#003D5B]/8 px-3 py-1 text-[10px] font-semibold text-[#003D5B]">
                {reporte.sesionesUltimos30.reduce((a, b) => a + b.cantidad, 0)} sesiones
              </span>
            </div>
            <MiniBarChart data={reporte.sesionesUltimos30} />
          </motion.div>

        </div>
      ) : null}
    </AdminShell>
  );
}