import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import type { CitaClienteRow } from '@/lib/citasApi';
import { parseCitaMomentLocal } from '@/lib/citasApi';
import { useAuth } from '@/context/AuthContext';
import {
  fetchNotificacionesCliente,
  insertNotificacion,
  marcarNotifLeida,
  marcarTodasLeidas,
  type NotificacionRow,
} from '@/lib/notificacionesApi';

// ═══════════════════════════════════════════════════════════════
// TIPOS PÚBLICOS — misma interfaz de antes, PortalHeader no cambia
// ═══════════════════════════════════════════════════════════════

export type PortalNotificationKind =
  | 'cita_confirmada'
  | 'admin_mensaje'
  | 'sesion_registrada'
  | 'foto_subida';

export type PortalNotificationItem = {
  id: string;
  kind: PortalNotificationKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

type PortalNotificationsCtx = {
  notifications: PortalNotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  notifyCitaConfirmada: (cita: CitaClienteRow) => void;
  refresh: () => Promise<void>;
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const PortalNotificationsContext = createContext<PortalNotificationsCtx | null>(null);

function fechaCitaHumana(cita: CitaClienteRow): string {
  try {
    const d = parseCitaMomentLocal(cita);
    return format(d, "d 'de' MMMM, HH:mm 'hs'", { locale: es });
  } catch {
    return `${cita.fecha} · ${String(cita.hora).slice(0, 5)} hs`;
  }
}

function rowToItem(row: NotificacionRow): PortalNotificationItem {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    read: row.read,
  };
}

// ═══════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════

export function PortalNotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const clienteId = session?.user?.id ?? null;

  const [notifications, setNotifications] = useState<PortalNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Fetch desde Supabase ───────────────────────────────────
  const refresh = useCallback(async () => {
    if (!clienteId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { rows } = await fetchNotificacionesCliente(clienteId);
    setNotifications(rows.map(rowToItem));
    setLoading(false);
  }, [clienteId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ─── Marcar leída — optimista + persiste en Supabase ───────
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    void marcarNotifLeida(id);
  }, []);

  // ─── Marcar todas leídas ────────────────────────────────────
  const markAllRead = useCallback(() => {
    if (!clienteId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    void marcarTodasLeidas(clienteId);
  }, [clienteId]);

  // ─── Cita confirmada desde el wizard del portal ─────────────
  const notifyCitaConfirmada = useCallback(
    (cita: CitaClienteRow) => {
      if (!clienteId) return;
      const when = fechaCitaHumana(cita);
      const title = 'Cita confirmada ✓';
      const body = `Tu turno de ${cita.servicio} quedó registrado para ${when}. Podés revisarlo en Mis citas.`;

      // Mostrar inmediatamente en UI
      const localItem: PortalNotificationItem = {
        id: `cita-local-${cita.id ?? Date.now()}`,
        kind: 'cita_confirmada',
        title,
        body,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [localItem, ...prev]);

      // Persistir en Supabase en background
      void insertNotificacion({ clienteId, kind: 'cita_confirmada', title, body });
    },
    [clienteId]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo<PortalNotificationsCtx>(
    () => ({
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllRead,
      notifyCitaConfirmada,
      refresh,
    }),
    [notifications, unreadCount, loading, markAsRead, markAllRead, notifyCitaConfirmada, refresh]
  );

  return (
    <PortalNotificationsContext.Provider value={value}>
      {children}
    </PortalNotificationsContext.Provider>
  );
}

export function usePortalNotifications(): PortalNotificationsCtx {
  const ctx = useContext(PortalNotificationsContext);
  if (!ctx)
    throw new Error('usePortalNotifications debe usarse dentro de PortalNotificationsProvider');
  return ctx;
}