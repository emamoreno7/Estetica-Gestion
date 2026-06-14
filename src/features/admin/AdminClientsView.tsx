import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldOff,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { getPortalAdminEmails, getPortalAdminUserIds } from '@/config/admin';
import type { PerfilClienteRow, PerfilRowStatus } from '@/lib/perfilCliente';
import {
  consentimientoEstaFirmado,
  listConsentimientosAdmin,
  type ConsentimientoRow,
} from '@/lib/consentimiento';
import {
  descargarConsentimientoPdf,
  imprimirConsentimientoPdf,
} from '@/lib/consentimientoPdf';
import { FichaClinicaModal } from '@/components/FichaClinicaModal';
import { AdminShell } from './AdminShell';
import {
  bloquearCliente,
  eliminarPerfilCliente,
  listPerfilesClientesAdmin,
} from './adminApi';
import ActivateClientModal from './ActivateClientModal';
import ClienteDrawer from './ClienteDrawer';

type AdminOutletCtx = { onSignOut: () => void };

type StatusFilter = 'all' | PerfilRowStatus;
const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'active', label: 'Activos' },
  { id: 'blocked', label: 'Bloqueados' },
];

function StatusPill({ status }: { status: PerfilRowStatus }) {
  const base = 'rounded-full px-3 py-1 text-[11px] font-semibold capitalize';
  if (status === 'active')
    return <span className={`${base} bg-[#BFC9A2]/35 text-[#003D5B]`}>Activo</span>;
  if (status === 'pending')
    return <span className={`${base} bg-amber-100/95 text-amber-900`}>Pendiente</span>;
  return <span className={`${base} bg-[#F2D7D5]/75 text-[#003D5B]`}>Bloqueado</span>;
}

function statusFromParam(raw: string | null): StatusFilter {
  if (raw === 'pending' || raw === 'active' || raw === 'blocked') return raw;
  return 'all';
}

export default function AdminClientsView() {
  const { onSignOut } = useOutletContext<AdminOutletCtx>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState<PerfilClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [actionErr, setActionErr] = useState<string | null>(null);

  const [activateTarget, setActivateTarget] = useState<PerfilClienteRow | null>(null);

  // Consentimientos por cliente_id
  const [consentMap, setConsentMap] = useState<Map<string, ConsentimientoRow>>(new Map());
  const [consentView, setConsentView] = useState<{ row: PerfilClienteRow; consent: ConsentimientoRow } | null>(
    null
  );
  const [fichaTarget, setFichaTarget] = useState<PerfilClienteRow | null>(null);
  const [drawerTarget, setDrawerTarget] = useState<PerfilClienteRow | null>(null);
  const [pdfBusy, setPdfBusy] = useState<'download' | 'print' | null>(null);

  const statusFilter = statusFromParam(searchParams.get('status'));

  async function onDescargar(row: PerfilClienteRow, c: ConsentimientoRow) {
    if (pdfBusy) return;
    setPdfBusy('download');
    try {
      await descargarConsentimientoPdf({ full_name: row.full_name, phone: row.phone }, c);
    } finally {
      setPdfBusy(null);
    }
  }

  async function onImprimir(row: PerfilClienteRow, c: ConsentimientoRow) {
    if (pdfBusy) return;
    setPdfBusy('print');
    try {
      await imprimirConsentimientoPdf({ full_name: row.full_name, phone: row.phone }, c);
    } finally {
      setPdfBusy(null);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    const { rows: r, error } = await listPerfilesClientesAdmin();
    if (error) setListError(error);
    else setRows(r);
    setLoading(false);

    // Cargar consentimientos en paralelo (no bloquea la tabla si falla)
    if (!error && r.length > 0) {
      const { map } = await listConsentimientosAdmin(r.map((x) => x.id));
      setConsentMap(map);
    } else {
      setConsentMap(new Map());
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function setStatus(next: StatusFilter) {
    const sp = new URLSearchParams(searchParams);
    if (next === 'all') sp.delete('status');
    else sp.set('status', next);
    setSearchParams(sp, { replace: true });
  }

  const counts = useMemo(() => {
    let pending = 0;
    let active = 0;
    let blocked = 0;
    for (const r of rows) {
      if (r.status === 'pending') pending++;
      else if (r.status === 'active') active++;
      else if (r.status === 'blocked') blocked++;
    }
    return { all: rows.length, pending, active, blocked };
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!needle) return true;
      return [p.full_name, p.phone].some((f) => f.toLowerCase().includes(needle));
    });
  }, [rows, q, statusFilter]);

  async function onBlock(id: string) {
    setActionErr(null);
    if (!window.confirm('¿Bloquear el acceso al portal para este cliente?')) return;
    const { error } = await bloquearCliente(id);
    if (error) {
      setActionErr(error);
      return;
    }
    await load();
  }

  async function onDelete(id: string) {
    setActionErr(null);
    if (
      !window.confirm(
        '¿Eliminar la ficha en el portal? El usuario seguirá existiendo en auth; podrá volver a registrarse.'
      )
    )
      return;
    const { error } = await eliminarPerfilCliente(id);
    if (error) {
      setActionErr(error);
      return;
    }
    await load();
  }

  const admins = getPortalAdminEmails();
  const adminIds = getPortalAdminUserIds();

  return (
    <AdminShell
      onSignOut={onSignOut}
      title="Clientes"
      subtitle="Activá altas pendientes, gestioná accesos y consultá fichas registradas en el portal."
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
      {admins.length === 0 && adminIds.length === 0 ? (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/95 px-4 py-3 text-sm text-amber-950">
          Configurá <code className="text-xs">VITE_ADMIN_EMAILS</code> en <code>.env</code>; debe coincidir con
          <code className="text-xs"> is_portal_admin()</code> (migración 003).
        </p>
      ) : null}

      {actionErr ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionErr}
        </div>
      ) : null}

      {/* Buscador + filtros */}
      <div className="mb-6 flex flex-col gap-3">
        <label className="relative flex items-center">
          <Search className="pointer-events-none absolute left-5 h-5 w-5 text-[#003D5B]/35" />
          <input
            type="search"
            placeholder="Buscar por nombre o teléfono…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-3xl border border-[#003D5B]/10 bg-white/90 py-4 pl-14 pr-6 text-sm text-[#003D5B] shadow-sm outline-none transition focus:border-[#F2D7D5] focus:ring-2 focus:ring-[#F2D7D5]/60"
            style={{ boxShadow: '0 8px 32px rgba(0,61,91,0.06)' }}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const isActive = tab.id === statusFilter;
            const n =
              tab.id === 'all'
                ? counts.all
                : tab.id === 'pending'
                ? counts.pending
                : tab.id === 'active'
                ? counts.active
                : counts.blocked;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatus(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                  isActive
                    ? 'bg-[#003D5B] text-white shadow'
                    : 'border border-[#003D5B]/12 bg-white/85 text-[#003D5B]/75 hover:bg-white'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] tabular-nums ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#F2D7D5]/45 text-[#003D5B]'
                  }`}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="overflow-hidden rounded-3xl border border-[#F2D7D5]/55 bg-[#FDF8F5]/95 shadow-xl backdrop-blur-sm"
        style={{ boxShadow: '0 24px 64px rgba(0,61,91,0.08)' }}
      >
        <div className="border-b border-[#F2D7D5]/50 px-6 py-5">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-[#003D5B]/55" />
            <h2 className="text-serif-premium text-lg font-bold text-[#003D5B]">Directorio de fichas portal</h2>
          </div>
          <p className="mt-1 text-xs text-[#7A746E]">
            Tabla Supabase · <strong>perfiles_clientes</strong> · {filtered.length} registro(s) mostrado(s)
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-[#003D5B]/55">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando listado…</span>
          </div>
        ) : listError ? (
          <div className="px-6 py-16 text-center text-sm text-red-700">{listError}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#F2D7D5]/40 bg-gradient-to-r from-[#fffefd] to-[#FDF8F5]">
                  <th className="whitespace-nowrap px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#003D5B]/55">
                    Nombre
                  </th>
                  <th className="whitespace-nowrap px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#003D5B]/55">
                    Teléfono
                  </th>
                  <th className="min-w-[140px] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#003D5B]/55">
                    Estado
                  </th>
                  <th className="min-w-[150px] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#003D5B]/55">
                    Consentimiento
                  </th>
                  <th className="whitespace-nowrap px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-[#003D5B]/55">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2D7D5]/35">
                {filtered.map((p) => (
                  <motion.tr
                    key={p.id}
                    layout
                    className="transition-colors hover:bg-[#FFFDFB]/95"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="px-6 py-4 font-semibold text-[#003D5B]">{p.full_name}</td>
                    <td className="px-6 py-4 text-[#7A746E]">{p.phone}</td>
                    <td className="px-6 py-4">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const c = consentMap.get(p.id);
                        const ok = consentimientoEstaFirmado(c ?? null);
                        if (ok && c) {
                          return (
                            <button
                              type="button"
                              onClick={() => setConsentView({ row: p, consent: c })}
                              className="inline-flex items-center gap-1.5 rounded-full bg-[#BFC9A2]/30 px-3 py-1.5 text-[11px] font-semibold text-[#003D5B] transition hover:bg-[#BFC9A2]/50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Firmado
                            </button>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-semibold text-amber-900">
                            <ShieldAlert className="h-3.5 w-3.5" /> Pendiente
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setFichaTarget(p)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#003D5B]/15 bg-white px-3 py-2 text-[11px] font-semibold text-[#003D5B] hover:bg-[#F2D7D5]/20"
                        >
                          <ClipboardList className="h-3.5 w-3.5" /> Ficha
                        </button>
                                                <button
                          type="button"
                          onClick={() => setDrawerTarget(p)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#003D5B] px-3 py-2 text-[11px] font-semibold text-white hover:opacity-90"
                        >
                          <UserCheck className="h-3.5 w-3.5" /> Ver completa
                        </button>
                        {(p.status === 'pending' || p.status === 'blocked') && (
                          <button
                            type="button"
                            onClick={() => setActivateTarget(p)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#BFC9A2] to-[#003D5B] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-white shadow-md"
                          >
                            <UserCheck className="h-3.5 w-3.5" />{' '}
                            {p.status === 'blocked' ? 'Reactivar' : 'Activar'}
                          </button>
                        )}
                        {p.status !== 'blocked' && (
                          <button
                            type="button"
                            onClick={() => void onBlock(p.id)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#003D5B]/15 bg-white px-3 py-2 text-[11px] font-semibold text-[#003D5B]"
                          >
                            <ShieldOff className="h-3.5 w-3.5" /> Bloquear
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void onDelete(p.id)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-800"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Eliminar
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 ? (
              <p className="py-14 text-center text-sm text-[#7A746E]">
                No hay registros para este criterio de búsqueda.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <ActivateClientModal
        open={activateTarget !== null}
        cliente={activateTarget}
        onClose={() => setActivateTarget(null)}
        onActivated={() => void load()}
      />

      <AnimatePresence>
        {fichaTarget ? (
          <FichaClinicaModal
            clienteId={fichaTarget.id}
            clienteNombre={fichaTarget.full_name}
            isAdmin
            onClose={() => {
              setFichaTarget(null);
              void load();
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {consentView ? (
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
              style={{ background: 'rgba(0,61,91,0.42)' }}
              onClick={() => setConsentView(null)}
            />
            <motion.div
              className="relative z-[941] w-full max-w-md overflow-hidden rounded-3xl bg-[#FDF8F5] p-6 shadow-2xl sm:p-7"
              style={{ border: '1px solid rgba(242,215,213,0.75)', boxShadow: '0 28px 56px rgba(0,61,91,0.18)' }}
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
            >
              <button
                type="button"
                className="absolute right-5 top-5 rounded-full p-2 text-[#003D5B]/45 hover:bg-[#F2D7D5]/45"
                onClick={() => setConsentView(null)}
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="mb-3 flex items-center gap-2.5">
                <div className="rounded-xl bg-[#003D5B] p-2">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-serif-premium text-lg font-bold text-[#003D5B]">
                    Consentimiento informado
                  </h3>
                  <p className="text-[11px] text-[#7A746E]">{consentView.row.full_name}</p>
                </div>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[#7A746E]">Firmado por</dt>
                  <dd className="text-right font-semibold text-[#003D5B]">
                    {consentView.consent.nombre_firma}
                  </dd>
                </div>
                {consentView.consent.dni ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#7A746E]">DNI</dt>
                    <dd className="text-right font-semibold text-[#003D5B]">{consentView.consent.dni}</dd>
                  </div>
                ) : null}
                {consentView.consent.fecha_nacimiento ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#7A746E]">Fecha de nacimiento</dt>
                    <dd className="text-right font-semibold text-[#003D5B]">
                      {format(
                        new Date(`${consentView.consent.fecha_nacimiento}T00:00:00`),
                        "d 'de' MMMM yyyy",
                        { locale: esLocale }
                      )}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt className="text-[#7A746E]">Fecha de firma</dt>
                  <dd className="text-right font-semibold text-[#003D5B]">
                    {consentView.consent.firmado_at
                      ? format(new Date(consentView.consent.firmado_at), "d 'de' MMMM yyyy · HH:mm", {
                          locale: esLocale,
                        })
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#7A746E]">Versión</dt>
                  <dd className="text-right font-semibold text-[#003D5B]">{consentView.consent.version}</dd>
                </div>
                {consentView.consent.firmado_por_admin ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#7A746E]">Origen</dt>
                    <dd className="text-right font-semibold text-[#003D5B]">Cargado por recepción</dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-4 space-y-2">
                {[
                  ['Declaración de salud', consentView.consent.declara_salud],
                  ['Consentimiento del tratamiento', consentView.consent.acepta_tratamiento],
                  ['Tratamiento de datos (Ley 25.326)', consentView.consent.acepta_datos],
                ].map(([label, ok]) => (
                  <div
                    key={String(label)}
                    className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-[#003D5B]"
                  >
                    <CheckCircle2 className={`h-4 w-4 ${ok ? 'text-[#4A6741]' : 'text-[#7A746E]/40'}`} />
                    {label}
                  </div>
                ))}
              </div>

              {consentView.consent.contraindicaciones ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                    Condiciones declaradas por el cliente
                  </p>
                  <p className="mt-1 text-sm text-amber-950">{consentView.consent.contraindicaciones}</p>
                </div>
              ) : null}

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={pdfBusy !== null}
                  onClick={() => void onImprimir(consentView.row, consentView.consent)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#003D5B]/15 bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#003D5B] disabled:opacity-50"
                >
                  {pdfBusy === 'print' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  Imprimir
                </button>
                <button
                  type="button"
                  disabled={pdfBusy !== null}
                  onClick={() => void onDescargar(consentView.row, consentView.consent)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#003D5B] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white disabled:opacity-50"
                >
                  {pdfBusy === 'download' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Descargar PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
            <AnimatePresence>
        {drawerTarget ? (
          <ClienteDrawer
            cliente={drawerTarget}
            onClose={() => {
              setDrawerTarget(null);
              void load();
            }}
          />
        ) : null}
      </AnimatePresence>
    </AdminShell>
  );
}
