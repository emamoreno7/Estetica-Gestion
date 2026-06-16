import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Loader2,
  LogOut,
  User,
  UserCircle2,
  X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { useNavigate } from 'react-router-dom';
import { BrandWordmark } from '@/components/branding/BrandWordmark';
import { useAuth } from '@/context/AuthContext';
import { usePortalNotifications } from '@/context/PortalNotificationsContext';
import { notifTargetView } from '@/lib/notificacionesApi';
import { clearLocalAppData } from '@/lib/clearLocalAppData';
import { updatePerfilClienteFields } from '@/lib/perfilCliente';

export type PortalHeaderView = 'inicio' | 'tratamiento' | 'evolucion' | 'citas' | 'perfil' | 'analizador';

/** Subconjunto del contexto portal (evita dependencia circular con App). */
export type PortalHeaderCliente = {
  displayName: string;
  greetingName: string;
  photoUrl: string | null;
};

const HEADER_SURFACE: CSSProperties = {
  background: 'rgba(253,248,245,0.92)',
  backdropFilter: 'blur(32px)',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderColor: 'rgba(242,215,213,0.55)',
  boxShadow: '0 8px 32px rgba(0,61,91,0.06), 0 2px 12px rgba(0,61,91,0.03)',
};

const PANEL_CLASS =
  'absolute right-0 top-full z-[60] mt-2 w-[min(100vw-1.5rem,20rem)] overflow-hidden rounded-2xl border text-left';
const PANEL_STYLE: CSSProperties = {
  borderColor: 'rgba(242,215,213,0.65)',
  background: 'var(--bg-cream)',
  boxShadow: '0 24px 64px rgba(0,61,91,0.12), 0 8px 24px rgba(0,61,91,0.06)',
};

function formatNotifDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM · HH:mm", { locale: es });
  } catch {
    return iso;
  }
}

export function PortalHeader({
  view: _view,
  onNavigate,
  portalCliente,
}: {
  view: PortalHeaderView;
  onNavigate: (v: PortalHeaderView) => void;
  portalCliente: PortalHeaderCliente;
}) {
  void _view;
  const pc = portalCliente;
  const navigate = useNavigate();
  const { session, perfilCliente, refreshPerfil, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead } = usePortalNotifications();

  const uid = session?.user?.id ?? '';

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [nombreEdit, setNombreEdit] = useState('');
  const [telEdit, setTelEdit] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardarMsg, setGuardarMsg] = useState<string | null>(null);

  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editOpen && perfilCliente) {
      setNombreEdit(perfilCliente.full_name ?? '');
      setTelEdit(perfilCliente.phone ?? '');
    }
  }, [editOpen, perfilCliente]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (bellRef.current?.contains(t)) return;
      if (profileRef.current?.contains(t)) return;
      setNotifOpen(false);
      setProfileOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const unreadLabel = useMemo(() => {
    if (unreadCount <= 0) return null;
    if (unreadCount > 9) return '9+';
    return String(unreadCount);
  }, [unreadCount]);

  async function cerrarSesionCompleta() {
    setProfileOpen(false);
    await signOut();
    await clearLocalAppData();
    navigate('/', { replace: true });
  }

  async function guardarPerfil(e: FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setGuardando(true);
    setGuardarMsg(null);
    const { ok, error } = await updatePerfilClienteFields(uid, {
      full_name: nombreEdit,
      phone: telEdit,
    });
    setGuardando(false);
    if (!ok) {
      setGuardarMsg(error ?? 'Error al guardar');
      return;
    }
    await refreshPerfil();
    setGuardarMsg(null);
    setEditOpen(false);
    setProfileOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-30 px-5 py-3 lg:px-8" style={HEADER_SURFACE}>
        <div className="relative mx-auto flex min-h-[72px] max-w-[1600px] items-center justify-between">
          <div className="hidden min-w-[120px] sm:block">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: 'var(--accent-sage)' }}
            >
              Portal cliente
            </p>
            <p className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--primary-navy)' }}>
              Hola, {pc.greetingName}
            </p>
          </div>

          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center sm:flex">
            <div className="pointer-events-auto">
              <BrandWordmark />
            </div>
          </div>

          <div className="flex flex-1 justify-end gap-2 lg:gap-3">
            <div className="relative sm:hidden">
              <BrandWordmark variant="compact" />
            </div>

            <div className="relative" ref={bellRef}>
              <button
                type="button"
                aria-expanded={notifOpen}
                aria-label="Notificaciones"
                className="relative rounded-2xl p-2.5 transition-all hover:bg-[rgba(242,215,213,0.4)]"
                style={{ color: 'var(--primary-navy)' }}
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
              >
                <Bell className="h-5 w-5" />
                {unreadLabel !== null ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{
                      background: '#E53935',
                      boxShadow: '0 4px 12px rgba(229,57,53,0.45)',
                    }}
                  >
                    {unreadLabel}
                  </span>
                ) : null}
              </button>

              <AnimatePresence>
                {notifOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className={PANEL_CLASS}
                    style={PANEL_STYLE}
                  >
                    <div
                      className="flex items-center justify-between border-b px-4 py-3"
                      style={{ borderColor: 'rgba(242,215,213,0.5)' }}
                    >
                      <span
                        className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                        style={{ color: 'var(--primary-navy)' }}
                      >
                        Notificaciones
                      </span>
                      {unreadCount > 0 ? (
                        <button
                          type="button"
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: 'rgba(0,61,91,0.5)' }}
                          onClick={() => markAllRead()}
                        >
                          Marcar leídas
                        </button>
                      ) : null}
                    </div>
                    <div className="max-h-[min(60vh,320px)] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                          No hay mensajes por ahora.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <button
  key={n.id}
  type="button"
  className="w-full border-b px-4 py-3 text-left transition hover:bg-[rgba(242,215,213,0.2)]"
  style={{ borderColor: 'rgba(242,215,213,0.35)' }}
  onClick={() => {
    markAsRead(n.id);
    setNotifOpen(false);
    onNavigate(notifTargetView(n.kind));
  }}
>
                            <div className="flex items-start gap-2">
                              {!n.read ? (
                                <span
                                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                                  style={{ background: '#E53935' }}
                                  aria-hidden
                                />
                              ) : (
                                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-transparent" aria-hidden />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold" style={{ color: 'var(--primary-navy)' }}>
                                  {n.title}
                                </p>
                                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                  {n.body}
                                </p>
                                <p className="mt-1.5 text-[10px]" style={{ color: 'rgba(69,95,112,0.7)' }}>
                                  {formatNotifDate(n.createdAt)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                aria-expanded={profileOpen}
                className="flex items-center gap-2 rounded-2xl border px-2 py-1.5 transition-all sm:px-3 sm:py-2"
                style={{
                  borderColor: 'var(--accent-rose)',
                  background: 'rgba(242,215,213,0.22)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)',
                }}
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                }}
              >
                {pc.photoUrl ? (
                  <img
                    src={pc.photoUrl}
                    alt=""
                    className="h-8 w-8 rounded-xl object-cover"
                    style={{ boxShadow: '0 0 0 2px var(--accent-rose)' }}
                  />
                ) : (
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-rose), var(--accent-sage))',
                      boxShadow: '0 0 0 2px var(--accent-rose)',
                    }}
                    aria-hidden
                  >
                    {pc.greetingName.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="hidden max-w-[140px] text-left lg:block">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--primary-navy)' }}>
                    {pc.displayName}
                  </p>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--accent-sage)' }}>
                    Configuración
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--primary-navy)' }}
                  aria-hidden
                />
              </button>

              <AnimatePresence>
                {profileOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className={PANEL_CLASS}
                    style={{ ...PANEL_STYLE, width: 'min(100vw-1.5rem, 15.5rem)' }}
                  >
                    <div className="p-1">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-[rgba(242,215,213,0.35)]"
                        style={{ color: 'var(--primary-navy)' }}
                        onClick={() => {
                          setEditOpen(true);
                          setProfileOpen(false);
                        }}
                      >
                        <UserCircle2 className="h-4 w-4 shrink-0 opacity-80" />
                        Ver / editar nombre y teléfono
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-[rgba(242,215,213,0.35)]"
                        style={{ color: 'var(--primary-navy)' }}
                        onClick={() => {
                          onNavigate('citas');
                          setProfileOpen(false);
                        }}
                      >
                        <CalendarDays className="h-4 w-4 shrink-0 opacity-80" />
                        Historial de citas
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-[rgba(242,215,213,0.35)]"
                        style={{ color: 'var(--primary-navy)' }}
                        onClick={() => {
                          onNavigate('perfil');
                          setProfileOpen(false);
                        }}
                      >
                        <User className="h-4 w-4 shrink-0 opacity-80" />
                        Mi perfil completo
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-[rgba(242,215,213,0.35)]"
                        style={{ color: 'var(--primary-navy)' }}
                        onClick={() => void cerrarSesionCompleta()}
                      >
                        <LogOut className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                        Cerrar Sesión
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {editOpen ? (
          <motion.div
            className="fixed inset-0 z-[140] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 backdrop-blur-sm"
              style={{ background: 'rgba(0,61,91,0.42)' }}
              aria-label="Cerrar"
              onClick={() => !guardando && setEditOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              className="relative z-[141] w-full max-w-md overflow-hidden rounded-3xl p-6 sm:p-8"
              style={{
                background: 'var(--bg-cream)',
                border: '1px solid rgba(242,215,213,0.65)',
                boxShadow: '0 32px 72px rgba(0,61,91,0.14), 0 12px 28px rgba(0,61,91,0.08)',
              }}
            >
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full p-2 transition hover:bg-[rgba(242,215,213,0.4)]"
                style={{ color: 'var(--primary-navy)' }}
                disabled={guardando}
                onClick={() => setEditOpen(false)}
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-serif-premium pr-10 text-lg font-bold" style={{ color: 'var(--primary-navy)' }}>
                Tus datos en Amore
              </h2>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Estos campos se guardan en tu ficha en Supabase (<strong>perfiles_clientes</strong>). El equipo usa el
                teléfono para coordinar turnos.
              </p>
              <form className="mt-6 space-y-4" onSubmit={(e) => void guardarPerfil(e)}>
                <div>
                  <label
                    className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: 'rgba(0,61,91,0.55)' }}
                  >
                    Nombre completo
                  </label>
                  <input
                    value={nombreEdit}
                    onChange={(e) => setNombreEdit(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[rgba(191,201,162,0.55)]"
                    style={{
                      borderColor: 'rgba(242,215,213,0.75)',
                      background: 'rgba(255,253,251,0.95)',
                      color: 'var(--primary-navy)',
                      boxShadow: 'inset 0 1px 2px rgba(0,61,91,0.04)',
                    }}
                    autoComplete="name"
                    required
                  />
                </div>
                <div>
                  <label
                    className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: 'rgba(0,61,91,0.55)' }}
                  >
                    Teléfono
                  </label>
                  <input
                    value={telEdit}
                    onChange={(e) => setTelEdit(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[rgba(191,201,162,0.55)]"
                    style={{
                      borderColor: 'rgba(242,215,213,0.75)',
                      background: 'rgba(255,253,251,0.95)',
                      color: 'var(--primary-navy)',
                      boxShadow: 'inset 0 1px 2px rgba(0,61,91,0.04)',
                    }}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+54…"
                    required
                  />
                </div>
                {guardarMsg ? <p className="text-xs text-red-600">{guardarMsg}</p> : null}
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(90deg, var(--accent-sage), var(--primary-navy))',
                    boxShadow: '0 12px 32px rgba(0,61,91,0.18)',
                  }}
                >
                  {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {guardando ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
