import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User as AuthUser } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { clienteDisplayName, firstNameOrFriendly } from '@/lib/perfilCliente';
import {
  deriveActiveTreatmentFromPerfil,
  type PortalActiveTreatment,
} from '@/lib/portalTreatment';
import {
  fetchFotosCliente,
  fetchSesionesCliente,
  fetchTratamientosActivosCliente,
  refreshSignedUrl,
  type PortalFotoRow,
  type PortalSesionRow,
  type PortalTratamientoRow,
} from '@/lib/portalTratamientosApi';
import { getImagenServicio } from '@/lib/servicioImagen';

export type PortalSesionLite = {
  nro: number;
  fecha: string;
  estado: 'completada' | 'proxima' | 'programada';
  notas: string;
  foto: string;
};

export type PortalAntesDespues = {
  title: string;
  improvement: string;
  before: string;
  after: string;
};

export type PortalClienteInfo = {
  displayName: string;
  greetingName: string;
  emailShown: string | null;
  phoneDisplay: string | null;
  photoUrl: string | null;
  memberSinceLabel: string;
  loyaltyPoints: number;
  tratamientoInteresLabel: string | null;
};

export type PortalClienteCtxValue = PortalClienteInfo & {
  // Plural — todos los tratamientos activos
  tratamientos: PortalTratamientoRow[];
  tratamientoSeleccionadoIdx: number;
  setTratamientoSeleccionadoIdx: (idx: number) => void;

  // Singular — el tratamiento actualmente seleccionado
  activeTreatment: PortalActiveTreatment | null;
  sessions: PortalSesionLite[];
  beforeAfterPairs: PortalAntesDespues[];
  fotosCliente: PortalFotoRow[];
  tratamientoActivoId: string | null;
  loadingTratamiento: boolean;
  refreshTratamiento: () => Promise<void>;
};

const PortalClienteCtx = createContext<PortalClienteCtxValue | null>(null);

export function usePortalCliente(): PortalClienteCtxValue {
  const v = useContext(PortalClienteCtx);
  if (!v) throw new Error('Portal solo dentro del proveedor cliente');
  return v;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function mapSesionToLite(
  row: PortalSesionRow,
  sesionesRealizadas: number,
  fotos: PortalFotoRow[]
): PortalSesionLite {
  const ahora = new Date();
  const fechaSesion = new Date(row.fecha_sesion + 'T12:00:00');
  const completada = fechaSesion <= ahora || row.numero_sesion <= sesionesRealizadas;
  const esProxima = row.numero_sesion === sesionesRealizadas + 1;
  const foto = fotos.find((f) => f.numero_sesion === row.numero_sesion);

  return {
    nro: row.numero_sesion,
    fecha: row.fecha_sesion,
    estado: completada ? 'completada' : esProxima ? 'proxima' : 'programada',
    notas: row.observaciones ?? 'Sin observaciones',
    foto: foto?.url_foto ?? '',
  };
}

function buildBeforeAfterPairs(
  fotosTodas: PortalFotoRow[],
  servicioNombre: string,
  clienteId: string
): PortalAntesDespues[] {
  const fotos = fotosTodas.filter((f) => f.subida_por !== clienteId);
  if (fotos.length < 2) return [];

  const iniciales = fotos.filter((f) => f.tipo === 'inicial');
  const finales = fotos.filter((f) => f.tipo === 'final');
  const progresos = fotos.filter((f) => f.tipo === 'progreso');

  const pairs: PortalAntesDespues[] = [];

  if (iniciales.length > 0 && finales.length > 0) {
    pairs.push({
      title: `${servicioNombre} · Inicio vs Final`,
      improvement: 'Resultado final',
      before: iniciales[0].url_foto,
      after: finales[finales.length - 1].url_foto,
    });
  }

  if (iniciales.length > 0 && finales.length === 0 && progresos.length > 0) {
    pairs.push({
      title: `${servicioNombre} · Inicio vs Hoy`,
      improvement: 'En progreso',
      before: iniciales[0].url_foto,
      after: progresos[progresos.length - 1].url_foto,
    });
  }

  if (iniciales.length > 0 && progresos.length > 1) {
    progresos.forEach((p, idx) => {
      if (idx === 0) return;
      pairs.push({
        title: `${servicioNombre} · Sesión ${progresos[0].numero_sesion ?? '?'} vs ${p.numero_sesion ?? '?'}`,
        improvement: 'Evolución',
        before: progresos[0].url_foto,
        after: p.url_foto,
      });
    });
  }

  return pairs;
}

function tratamientoToActiveTreatment(
  t: PortalTratamientoRow,
  sesiones: PortalSesionRow[]
): PortalActiveTreatment {
  const proximaSesion = sesiones.find((s) => s.numero_sesion > t.sesiones_realizadas);
  const fechaProxima = proximaSesion?.fecha_sesion ?? t.fecha_inicio;
  const horaProxima = proximaSesion?.hora_sesion ?? '—';

  return {
    id: t.id,
    nombre: t.servicio_nombre,
    categoria: 'Tratamiento Amore',
    descripcion: t.notas || `${t.servicio_nombre} · Plan personalizado`,
    profesional: t.profesional,
    zona: t.zona,
    sucursal: `Sede ${t.zona}`,
    fechaInicio: t.fecha_inicio,
    precio:
      t.precio_total > 0
        ? new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0,
          }).format(t.precio_total)
        : 'Consultá en sede',
    imagen: getImagenServicio(t.servicio_nombre),
    sesionesCompletadas: t.sesiones_realizadas,
    totalSesiones: t.sesiones_totales,
    proximaSesion: fechaProxima,
    horaProxima: horaProxima ? horaProxima.slice(0, 5) : '—',
    fechaPlanPendiente: !proximaSesion,
  };
}

// ═══════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════

export function PortalClienteProvider({
  sessionUser,
  children,
}: {
  sessionUser: AuthUser;
  children: ReactNode;
}) {
  const { perfilCliente } = useAuth();

  const [tratamientosReales, setTratamientosReales] = useState<PortalTratamientoRow[]>([]);
  const [tratamientoSeleccionadoIdx, setTratamientoSeleccionadoIdx] = useState(0);
  const [sesionesReales, setSesionesReales] = useState<PortalSesionRow[]>([]);
  const [fotosReales, setFotosReales] = useState<PortalFotoRow[]>([]);
  const [loadingTratamiento, setLoadingTratamiento] = useState(true);

  async function cargarDetallesTratamiento(tratamientoId: string) {
    const [{ rows: ses }, { rows: fts }] = await Promise.all([
      fetchSesionesCliente(tratamientoId),
      fetchFotosCliente(tratamientoId),
    ]);

    const fotosConUrls = await Promise.all(
      fts.map(async (f) => {
        const nuevaUrl = await refreshSignedUrl(f.storage_path);
        return { ...f, url_foto: nuevaUrl ?? f.url_foto };
      })
    );

    setSesionesReales(ses);
    setFotosReales(fotosConUrls);
  }

  async function cargarTratamiento() {
    setLoadingTratamiento(true);

    const { tratamientos } = await fetchTratamientosActivosCliente(sessionUser.id);
    setTratamientosReales(tratamientos);

    if (tratamientos.length === 0) {
      setSesionesReales([]);
      setFotosReales([]);
      setLoadingTratamiento(false);
      return;
    }

    await cargarDetallesTratamiento(tratamientos[0].id);
    setLoadingTratamiento(false);
  }

  useEffect(() => {
    void cargarTratamiento();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser.id]);

  useEffect(() => {
    const t = tratamientosReales[tratamientoSeleccionadoIdx];
    if (!t) return;
    void cargarDetallesTratamiento(t.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tratamientoSeleccionadoIdx]);

  const value = useMemo<PortalClienteCtxValue>(() => {
    const md = (sessionUser.user_metadata || {}) as Record<string, unknown>;
    const displayName = clienteDisplayName(
      sessionUser.email ?? undefined,
      md,
      perfilCliente?.full_name
    );

    let memberSinceLabel = 'Nuevo miembro Amore';
    if (perfilCliente?.created_at) {
      const d = new Date(perfilCliente.created_at);
      if (!Number.isNaN(d.getTime())) {
        memberSinceLabel = d.toLocaleDateString('es-AR', {
          month: 'long',
          year: 'numeric',
        });
      }
    }

    const photoUrl =
      typeof md.avatar_url === 'string' ? md.avatar_url.trim() || null : null;

    let emailShown: string | null = sessionUser.email ?? null;
    if (emailShown && /^wa_\d+@clients\.amore\.app$/i.test(emailShown)) {
      emailShown = null;
    }

    const phoneDisplay =
      perfilCliente?.phone?.trim() ||
      (typeof md.phone === 'string' ? md.phone.trim() : null) ||
      (typeof md.telefono_whatsapp === 'string' ? md.telefono_whatsapp : null);

    const tratamientoMd =
      (typeof md.tratamiento_interes === 'string' && md.tratamiento_interes.trim()) ||
      perfilCliente?.tratamiento_interes?.trim() ||
      null;

    const tratamientoReal = tratamientosReales[tratamientoSeleccionadoIdx] ?? null;

    const activeTreatment = tratamientoReal
      ? tratamientoToActiveTreatment(tratamientoReal, sesionesReales)
      : deriveActiveTreatmentFromPerfil(perfilCliente ?? null, tratamientoMd);

    const sessions: PortalSesionLite[] = tratamientoReal
      ? sesionesReales.map((s) =>
          mapSesionToLite(s, tratamientoReal.sesiones_realizadas, fotosReales)
        )
      : [];

    const beforeAfterPairs: PortalAntesDespues[] = tratamientoReal
      ? buildBeforeAfterPairs(fotosReales, tratamientoReal.servicio_nombre, sessionUser.id)
      : [];

    const fotosCliente: PortalFotoRow[] = fotosReales.filter(
      (f) => f.subida_por === sessionUser.id
    );

    const loyaltyPoints = tratamientosReales.reduce(
      (acc, t) => acc + (t.puntos_acumulados ?? 0),
      0
    );

    return {
      displayName,
      greetingName: firstNameOrFriendly(displayName),
      emailShown,
      phoneDisplay,
      photoUrl,
      memberSinceLabel,
      loyaltyPoints,
      tratamientoInteresLabel: tratamientoMd,
      tratamientos: tratamientosReales,
      tratamientoSeleccionadoIdx,
      setTratamientoSeleccionadoIdx,
      activeTreatment,
      sessions,
      beforeAfterPairs,
      fotosCliente,
      tratamientoActivoId: tratamientoReal?.id ?? null,
      loadingTratamiento,
      refreshTratamiento: cargarTratamiento,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser, perfilCliente, tratamientosReales, tratamientoSeleccionadoIdx, sesionesReales, fotosReales, loadingTratamiento]);

  return <PortalClienteCtx.Provider value={value}>{children}</PortalClienteCtx.Provider>;
}

// ═══════════════════════════════════════════════════════════════
// HELPER EXPORTADO
// ═══════════════════════════════════════════════════════════════

export function tratamientoProgresoPct(at: {
  sesionesCompletadas: number;
  totalSesiones: number;
}): number {
  if (at.totalSesiones <= 0) return 0;
  return Math.round((at.sesionesCompletadas / at.totalSesiones) * 100);
}