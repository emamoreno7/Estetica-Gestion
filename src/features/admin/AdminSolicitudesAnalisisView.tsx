// src/features/admin/AdminSolicitudesAnalisisView.tsx
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MessageSquare,
  Phone,
  X,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { AdminShell } from './AdminShell';
import { useAuth } from '@/context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import {
  getSolicitudesAdmin,
  aprobarSolicitud,
  rechazarSolicitud,
  ANALISIS_EXTRA_POR_APROBACION,
  type SolicitudAnalisisExtra,
  type EstadoSolicitud,
} from '@/lib/analizadorApi';

type FiltroEstado = EstadoSolicitud | 'todas';

const FILTROS: { key: FiltroEstado; label: string; color: string }[] = [
  { key: 'pendiente', label: 'Pendientes', color: '#B8956E' },
  { key: 'aprobada', label: 'Aprobadas', color: '#4a5e2a' },
  { key: 'rechazada', label: 'Rechazadas', color: '#8B3A3A' },
  { key: 'todas', label: 'Todas', color: '#003D5B' },
];

type Ctx = { onSignOut: () => void };

export default function AdminSolicitudesAnalisisView() {
  const { onSignOut } = useOutletContext<Ctx>();
  const { session } = useAuth();
  const adminId = session?.user?.id ?? '';

  const [filtro, setFiltro] = useState<FiltroEstado>('pendiente');
  const [solicitudes, setSolicitudes] = useState<SolicitudAnalisisExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [accionando, setAccionando] = useState<string | null>(null);
  const [modalAccion, setModalAccion] = useState<{
    tipo: 'aprobar' | 'rechazar';
    solicitud: SolicitudAnalisisExtra;
  } | null>(null);

  async function cargar() {
    setLoading(true);
    const { data } = await getSolicitudesAdmin(filtro);
    setSolicitudes(data);
    setLoading(false);
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  async function confirmarAccion(notaAdmin: string) {
    if (!modalAccion || !adminId) return;
    const { tipo, solicitud } = modalAccion;
    setAccionando(solicitud.id);

    const fn = tipo === 'aprobar' ? aprobarSolicitud : rechazarSolicitud;
    const { error } = await fn(solicitud.id, solicitud.cliente_id, adminId, notaAdmin);

    setAccionando(null);
    setModalAccion(null);

    if (error) {
      alert(`Error: ${error}`);
      return;
    }

    void cargar();
  }

  const conteo = useMemo(() => {
    return solicitudes.reduce(
      (acc, s) => {
        acc[s.estado] = (acc[s.estado] ?? 0) + 1;
        return acc;
      },
      {} as Record<EstadoSolicitud, number>
    );
  }, [solicitudes]);

  return (
    <AdminShell
      onSignOut={onSignOut}
      title="Solicitudes de análisis"
      subtitle="Clientes que pidieron desbloquear más análisis IA. Aprobá para sumarles +3 análisis adicionales."
    >
      {/* ── Tarjetas resumen ───────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FILTROS.map((f) => {
          const activo = filtro === f.key;
          const count =
            f.key === 'todas' ? solicitudes.length : conteo[f.key as EstadoSolicitud] ?? 0;

          return (
            <motion.button
              key={f.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFiltro(f.key)}
              className="rounded-2xl p-4 text-left transition"
              style={{
                background: activo ? f.color : 'white',
                color: activo ? 'white' : 'var(--primary-navy)',
                border: `1px solid ${activo ? f.color : 'rgba(0,61,91,0.10)'}`,
                boxShadow: activo
                  ? `0 10px 28px ${f.color}40`
                  : '0 4px 16px rgba(0,61,91,0.05)',
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ opacity: activo ? 0.85 : 0.55 }}
              >
                {f.label}
              </p>
              <p className="text-serif-premium mt-1 text-2xl font-bold">{count}</p>
            </motion.button>
          );
        })}
      </div>

      {/* ── Lista de solicitudes ───────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2"
            style={{
              borderColor: 'var(--primary-navy)',
              borderTopColor: 'transparent',
            }}
          />
        </div>
      ) : solicitudes.length === 0 ? (
        <EmptyState filtro={filtro} />
      ) : (
        <div className="space-y-3">
          {solicitudes.map((s) => (
            <SolicitudCard
              key={s.id}
              solicitud={s}
              loading={accionando === s.id}
              onAprobar={() => setModalAccion({ tipo: 'aprobar', solicitud: s })}
              onRechazar={() => setModalAccion({ tipo: 'rechazar', solicitud: s })}
            />
          ))}
        </div>
      )}

      {/* ── Modal acción ───────────────────────────────────────────── */}
      <AnimatePresence>
        {modalAccion && (
          <ModalAccion
            tipo={modalAccion.tipo}
            solicitud={modalAccion.solicitud}
            loading={accionando === modalAccion.solicitud.id}
            onConfirmar={confirmarAccion}
            onClose={() => setModalAccion(null)}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ filtro }: { filtro: FiltroEstado }) {
  const mensaje =
    filtro === 'pendiente'
      ? 'No hay solicitudes pendientes en este momento. ¡Todo al día!'
      : filtro === 'aprobada'
        ? 'Todavía no aprobaste ninguna solicitud.'
        : filtro === 'rechazada'
          ? 'No hay solicitudes rechazadas.'
          : 'No hay solicitudes registradas aún.';

  return (
    <div
      className="flex flex-col items-center justify-center rounded-3xl py-16 text-center"
      style={{
        background: 'rgba(253,248,245,0.6)',
        border: '1px dashed rgba(0,61,91,0.18)',
      }}
    >
      <div
        className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(191,201,162,0.25)' }}
      >
        <Inbox className="h-7 w-7" style={{ color: 'var(--primary-navy)' }} />
      </div>
      <p
        className="text-serif-premium text-base font-semibold"
        style={{ color: 'var(--primary-navy)' }}
      >
        Sin solicitudes
      </p>
      <p className="mt-1 max-w-xs text-xs" style={{ color: 'var(--text-muted)' }}>
        {mensaje}
      </p>
    </div>
  );
}

// ─── Card de solicitud ──────────────────────────────────────────────────────

function SolicitudCard({
  solicitud,
  loading,
  onAprobar,
  onRechazar,
}: {
  solicitud: SolicitudAnalisisExtra;
  loading: boolean;
  onAprobar: () => void;
  onRechazar: () => void;
}) {
  const config = getEstadoConfig(solicitud.estado);
  const fecha = new Date(solicitud.created_at).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const nombre = solicitud.cliente_nombre?.trim() || 'Cliente';
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl"
      style={{
        background: 'white',
        border: '1px solid rgba(0,61,91,0.08)',
        boxShadow: '0 6px 20px rgba(0,61,91,0.06)',
      }}
    >
      <div className="h-1 w-full" style={{ background: config.color }} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, var(--accent-rose), var(--accent-sage))',
            }}
          >
            {inicial}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4
                className="text-serif-premium truncate text-base font-bold"
                style={{ color: 'var(--primary-navy)' }}
              >
                {nombre}
              </h4>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: `${config.color}20`, color: config.color }}
              >
                <config.icon className="h-3 w-3" />
                {config.label}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              {solicitud.cliente_telefono && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {solicitud.cliente_telefono}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {fecha}
              </span>
            </div>

            {solicitud.mensaje && (
              <div
                className="mt-3 flex items-start gap-2 rounded-2xl p-3"
                style={{
                  background: 'rgba(0,61,91,0.04)',
                  border: '1px solid rgba(0,61,91,0.06)',
                }}
              >
                <MessageSquare
                  className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                  style={{ color: 'var(--primary-navy)' }}
                />
                <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  "{solicitud.mensaje}"
                </p>
              </div>
            )}

            {/* Info de respuesta si ya fue respondida */}
            {solicitud.estado !== 'pendiente' && solicitud.respondido_at && (
              <div
                className="mt-3 rounded-2xl p-3"
                style={{
                  background:
                    solicitud.estado === 'aprobada'
                      ? 'rgba(191,201,162,0.15)'
                      : 'rgba(242,215,213,0.3)',
                  border: `1px solid ${config.color}30`,
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: config.color }}>
                  {solicitud.estado === 'aprobada'
                    ? `Aprobada · +${solicitud.analisis_otorgados} análisis`
                    : 'Rechazada'}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(solicitud.respondido_at).toLocaleString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {solicitud.nota_admin && (
                  <p className="mt-1 text-xs italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    "{solicitud.nota_admin}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botones acción solo si está pendiente */}
        {solicitud.estado === 'pendiente' && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAprobar}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #4a5e2a, #6b8a3f)',
                boxShadow: '0 8px 22px rgba(74,94,42,0.22)',
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Aprobar · +{ANALISIS_EXTRA_POR_APROBACION} análisis
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRechazar}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
              style={{
                color: '#8B3A3A',
                border: '1.5px solid rgba(139,58,58,0.3)',
                background: 'white',
              }}
            >
              <XCircle className="h-4 w-4" />
              Rechazar
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Modal de confirmación ──────────────────────────────────────────────────

function ModalAccion({
  tipo,
  solicitud,
  loading,
  onConfirmar,
  onClose,
}: {
  tipo: 'aprobar' | 'rechazar';
  solicitud: SolicitudAnalisisExtra;
  loading: boolean;
  onConfirmar: (nota: string) => void;
  onClose: () => void;
}) {
  const [nota, setNota] = useState('');

  const esAprobar = tipo === 'aprobar';
  const cfg = esAprobar
    ? {
        titulo: 'Aprobar solicitud',
        descripcion: `Vamos a otorgarle ${ANALISIS_EXTRA_POR_APROBACION} análisis adicionales al cliente.`,
        botonLabel: 'Confirmar aprobación',
        gradient: 'linear-gradient(135deg, #4a5e2a, #6b8a3f)',
        icon: CheckCircle2,
        color: '#4a5e2a',
        placeholder: 'Ej: ¡Disfrutá tus nuevos análisis! Cualquier duda escribinos.',
      }
    : {
        titulo: 'Rechazar solicitud',
        descripcion: 'El cliente recibirá una notificación con tu mensaje.',
        botonLabel: 'Confirmar rechazo',
        gradient: 'linear-gradient(135deg, #8B3A3A, #a85555)',
        icon: XCircle,
        color: '#8B3A3A',
        placeholder: 'Ej: Te invitamos a coordinar una consulta presencial.',
      };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="relative p-6 text-white" style={{ background: cfg.gradient }}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
              <cfg.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-serif-premium text-lg font-bold">{cfg.titulo}</h3>
              <p className="text-xs opacity-90">{solicitud.cliente_nombre ?? 'Cliente'}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {cfg.descripcion}
          </p>

          {esAprobar && (
            <div
              className="mb-4 flex items-start gap-2 rounded-2xl p-3"
              style={{
                background: 'rgba(191,201,162,0.18)',
                border: '1px solid rgba(191,201,162,0.4)',
              }}
            >
              <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#4a5e2a' }} />
              <p className="text-xs leading-relaxed" style={{ color: '#4a5e2a' }}>
                Los análisis se acreditan al cliente <strong>en el momento</strong> y va a recibir
                una notificación automática.
              </p>
            </div>
          )}

          <label
            className="mb-2 block text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--primary-navy)' }}
          >
            Mensaje al cliente (opcional)
          </label>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder={cfg.placeholder}
            className="w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none"
            style={{
              borderColor: 'rgba(0,61,91,0.15)',
              background: 'rgba(253,248,245,0.5)',
            }}
          />
          <p className="mt-1 text-right text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {nota.length}/300
          </p>

          <div className="mt-5 flex gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
              style={{
                color: 'var(--primary-navy)',
                border: '1px solid rgba(0,61,91,0.2)',
                background: 'white',
              }}
            >
              Cancelar
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onConfirmar(nota)}
              disabled={loading}
              className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
              style={{ background: cfg.gradient }}
            >
              {loading ? 'Procesando...' : cfg.botonLabel}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Config visual por estado ───────────────────────────────────────────────

function getEstadoConfig(estado: EstadoSolicitud): {
  label: string;
  color: string;
  icon: typeof Clock;
} {
  switch (estado) {
    case 'pendiente':
      return { label: 'Pendiente', color: '#B8956E', icon: Clock };
    case 'aprobada':
      return { label: 'Aprobada', color: '#4a5e2a', icon: CheckCircle2 };
    case 'rechazada':
      return { label: 'Rechazada', color: '#8B3A3A', icon: XCircle };
  }
}

// Re-export del icon Filter para evitar warning de import no usado
export { Filter, AlertTriangle };