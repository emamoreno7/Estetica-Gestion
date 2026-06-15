import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,       // ← agregar
  Calculator,
  CalendarDays,
  HeartPulse,
  Home,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { countPerfilesPendientesAdmin } from './adminApi';
import { countInsumosSinVerificar } from './adminAuditoriaApi';

const PENDING_REFRESH_MS = 60_000;
const AUDIT_REFRESH_MS = 5 * 60_000;
const AUDIT_DIAS_UMBRAL = 7;

type BadgeKey = 'pending' | 'audit';

type Item = {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
  badgeKey?: BadgeKey;
};

const ITEMS: Item[] = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/aprobar-usuarios', label: 'Aprobar usuarios', icon: UserCheck, badgeKey: 'pending' },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/admin/tratamientos', label: 'Tratamientos', icon: HeartPulse },
  { to: '/admin/servicios', label: 'Servicios', icon: Sparkles },
  { to: '/admin/costos', label: 'Costos y precios', icon: Calculator },
  { to: '/admin/auditoria-precios', label: 'Auditoría precios', icon: ShieldAlert, badgeKey: 'audit' },
  { to: '/admin/reportes', label: 'Reportes', icon: BarChart3 },  // ← nuevo
];

type Props = {
  children: ReactNode;
  onSignOut: () => void;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
};

/** Layout admin: sidebar fija (desktop) + topbar (mobile) con identidad del admin y salir. */
export function AdminShell({ children, onSignOut, title, subtitle, actions }: Props) {
  const { session } = useAuth();
  const location = useLocation();

  const email = session?.user?.email ?? '';
  const initial = (email.split('@')[0] || 'A').charAt(0).toUpperCase();

  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [auditCount, setAuditCount] = useState<number | null>(null);

  /**
   * Polling silencioso de contadores para alimentar badges del sidebar.
   * Pausa cuando la pestaña no es visible; refresh inmediato al volver.
   * - Pendientes: cada 60s (cambia con cada alta nueva)
   * - Auditoría: cada 5min (cambia rara vez)
   */
  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    let pendingTimer: ReturnType<typeof setInterval> | null = null;
    let auditTimer: ReturnType<typeof setInterval> | null = null;

    async function refreshPending() {
      const n = await countPerfilesPendientesAdmin();
      if (!cancelled) setPendingCount(n);
    }
    async function refreshAudit() {
      const n = await countInsumosSinVerificar(AUDIT_DIAS_UMBRAL);
      if (!cancelled) setAuditCount(n);
    }
    function start() {
      if (pendingTimer === null) pendingTimer = setInterval(() => void refreshPending(), PENDING_REFRESH_MS);
      if (auditTimer === null) auditTimer = setInterval(() => void refreshAudit(), AUDIT_REFRESH_MS);
    }
    function stop() {
      if (pendingTimer !== null) {
        clearInterval(pendingTimer);
        pendingTimer = null;
      }
      if (auditTimer !== null) {
        clearInterval(auditTimer);
        auditTimer = null;
      }
    }

    void refreshPending();
    void refreshAudit();
    if (document.visibilityState === 'visible') start();

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        void refreshPending();
        void refreshAudit();
        start();
      } else {
        stop();
      }
    }

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [session?.user]);

  function badgeFor(item: Item): number {
    if (item.badgeKey === 'pending' && typeof pendingCount === 'number') return pendingCount;
    if (item.badgeKey === 'audit' && typeof auditCount === 'number') return auditCount;
    return 0;
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-cream)' }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -left-32 top-0 h-80 w-80 rounded-full blur-3xl"
          style={{ background: 'rgba(242,215,213,0.35)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl"
          style={{ background: 'rgba(191,201,162,0.25)' }}
        />
      </div>

      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r lg:flex"
        style={{
          background: 'rgba(253,248,245,0.96)',
          borderColor: 'rgba(242,215,213,0.55)',
          boxShadow: '6px 0 32px rgba(0,61,91,0.05)',
        }}
      >
        <div className="px-6 pb-6 pt-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#003D5B]/45">
            Backoffice
          </p>
          <p className="text-serif-premium mt-1 text-lg font-bold text-[#003D5B]">Amore</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {ITEMS.map((item) => {
            const badge = badgeFor(item);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#003D5B] text-white shadow-md'
                      : 'text-[#003D5B]/75 hover:bg-[#F2D7D5]/30 hover:text-[#003D5B]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#003D5B]/55'}`} />
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 ? (
                      <span
                        aria-label={`${badge} pendientes`}
                        className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                          isActive ? 'bg-white/25 text-white' : 'bg-amber-200/90 text-amber-950'
                        }`}
                      >
                        {badge > 99 ? '99+' : badge}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-[#F2D7D5]/55 p-4">
          <div
            className="mb-3 flex items-center gap-3 rounded-2xl border px-3 py-2.5"
            style={{
              borderColor: 'rgba(242,215,213,0.6)',
              background: 'rgba(255,253,251,0.85)',
            }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, var(--accent-rose), var(--accent-sage))' }}
              aria-hidden
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#003D5B]/45">
                Sesión activa
              </p>
              <p className="truncate text-xs font-semibold text-[#003D5B]" title={email}>
                {email || 'Admin'}
              </p>
            </div>
          </div>

          <Link
            to="/"
            className="mb-2 flex items-center justify-center gap-2 rounded-2xl border border-[#003D5B]/12 bg-white/80 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#003D5B]"
          >
            <Home className="h-3.5 w-3.5" /> Ir al sitio
          </Link>

          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#003D5B] py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-lg"
          >
            <LogOut className="h-3.5 w-3.5" /> Salir
          </button>
        </div>
      </aside>

      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-3 lg:hidden"
        style={{
          background: 'rgba(253,248,245,0.92)',
          borderColor: 'rgba(242,215,213,0.55)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#003D5B]/45">Amore Backoffice</p>
          <p className="text-sm font-bold text-[#003D5B]">{title ?? 'Administración'}</p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#003D5B] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white shadow"
        >
          <LogOut className="h-3.5 w-3.5" /> Salir
        </button>
      </header>

      <nav
        className="sticky top-[57px] z-20 flex gap-1 overflow-x-auto border-b px-3 py-2 lg:hidden"
        style={{
          background: 'rgba(253,248,245,0.92)',
          borderColor: 'rgba(242,215,213,0.55)',
        }}
      >
        {ITEMS.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          const badge = badgeFor(item);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                isActive
                  ? 'bg-[#003D5B] text-white shadow'
                  : 'border border-[#003D5B]/12 bg-white/85 text-[#003D5B]/75'
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
              {badge > 0 ? (
                <span
                  aria-label={`${badge} pendientes`}
                  className={`inline-flex min-w-[1.1rem] items-center justify-center rounded-full px-1 py-0.5 text-[9px] font-bold tabular-nums ${
                    isActive ? 'bg-white/25 text-white' : 'bg-amber-200/90 text-amber-950'
                  }`}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <main className="relative z-10 lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {/* Header desktop: titulo + subtitulo + acciones, todo junto */}
          {(title || subtitle || actions) && (
            <motion.header
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 hidden flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:flex"
            >
              <div>
                {title ? (
                  <h1 className="text-serif-premium text-3xl font-bold text-[#003D5B] sm:text-[2rem]">
                    {title}
                  </h1>
                ) : null}
                {subtitle ? (
                  <p className="mt-2 max-w-2xl text-sm text-[#7A746E]">{subtitle}</p>
                ) : null}
              </div>
              {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
            </motion.header>
          )}

          {/* Mobile/tablet: subtitulo + acciones (titulo ya esta en el topbar) */}
          {(subtitle || actions) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex flex-col gap-3 lg:hidden"
            >
              {subtitle ? (
                <p className="text-xs text-[#7A746E]">{subtitle}</p>
              ) : null}
              {actions ? (
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
              ) : null}
            </motion.div>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}
