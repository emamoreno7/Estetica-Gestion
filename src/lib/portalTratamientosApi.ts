import { supabase } from '@/lib/supabaseClient';

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export type PortalTratamientoRow = {
  id: string;
  cliente_id: string;
  servicio_id: string;
  servicio_nombre: string;
  profesional: string;
  zona: string;
  fecha_inicio: string;
  precio_total: number;
  sesiones_totales: number;
  sesiones_realizadas: number;
  puntos_acumulados: number;
  estado: 'activo' | 'finalizado' | 'pausado' | 'cancelado';
  notas: string | null;
};

export type PortalSesionRow = {
  id: string;
  tratamiento_id: string;
  numero_sesion: number;
  fecha_sesion: string;
  hora_sesion: string | null;
  profesional: string;
  observaciones: string | null;
  puntos_otorgados: number;
};

export type PortalFotoRow = {
  id: string;
  tratamiento_id: string;
  sesion_id: string | null;
  url_foto: string;
  storage_path: string;
  tipo: 'inicial' | 'progreso' | 'final';
  numero_sesion: number | null;
  descripcion: string | null;
  created_at: string;
};

// ═══════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════

/** Obtiene el tratamiento activo (más reciente) del cliente */
export async function fetchTratamientoActivoCliente(clienteId: string): Promise<{
  tratamiento: PortalTratamientoRow | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('tratamientos_cliente')
    .select('*')
    .eq('cliente_id', clienteId)
    .in('estado', ['activo', 'pausado'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { tratamiento: null, error: error.message };
  if (!data) return { tratamiento: null, error: null };

  return {
    tratamiento: {
      ...data,
      precio_total: Number(data.precio_total) || 0,
    } as PortalTratamientoRow,
    error: null,
  };
}

/** Obtiene todas las sesiones de un tratamiento */
export async function fetchSesionesCliente(tratamientoId: string): Promise<{
  rows: PortalSesionRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('tratamiento_sesiones')
    .select('*')
    .eq('tratamiento_id', tratamientoId)
    .order('numero_sesion', { ascending: true });

  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as PortalSesionRow[], error: null };
}

/** Obtiene todas las fotos de un tratamiento */
export async function fetchFotosCliente(tratamientoId: string): Promise<{
  rows: PortalFotoRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('tratamiento_fotos')
    .select('*')
    .eq('tratamiento_id', tratamientoId)
    .order('created_at', { ascending: true });

  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as PortalFotoRow[], error: null };
}

/** Refresca la URL firmada de una foto (las URLs caducan) */
export async function refreshSignedUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('tratamiento-fotos')
    .createSignedUrl(storagePath, 60 * 60 * 24); // 24h
  return data?.signedUrl ?? null;
}