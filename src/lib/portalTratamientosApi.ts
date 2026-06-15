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
  subida_por: string | null;
  created_at: string;
};

// ═══════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════

/** Obtiene el tratamiento activo (más reciente) del cliente */
/** Obtiene TODOS los tratamientos activos/pausados del cliente */
export async function fetchTratamientosActivosCliente(clienteId: string): Promise<{
  tratamientos: PortalTratamientoRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('tratamientos_cliente')
    .select('*')
    .eq('cliente_id', clienteId)
    .in('estado', ['activo', 'pausado'])
    .order('created_at', { ascending: false });

  if (error) return { tratamientos: [], error: error.message };

  const tratamientos = (data ?? []).map((d) => ({
    ...d,
    precio_total: Number(d.precio_total) || 0,
  })) as PortalTratamientoRow[];

  return { tratamientos, error: null };
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
// ═══════════════════════════════════════════════════════════════
// CLIENTE SUBE SU PROPIA FOTO
// ═══════════════════════════════════════════════════════════════

export async function subirFotoCliente(params: {
  tratamientoId: string;
  clienteId: string;
  file: File;
  descripcion?: string | null;
}): Promise<{ foto: PortalFotoRow | null; error: string | null }> {
  try {
    // 1. Path único dentro del bucket
    const ext = params.file.name.split('.').pop() ?? 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const storagePath = `${params.tratamientoId}/cliente/${fileName}`;

    // 2. Subir al Storage
    const { error: uploadError } = await supabase.storage
      .from('tratamiento-fotos')
      .upload(storagePath, params.file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) return { foto: null, error: `Upload: ${uploadError.message}` };

    // 3. URL firmada (bucket privado)
    const { data: urlData } = await supabase.storage
      .from('tratamiento-fotos')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 año

    const urlFoto = urlData?.signedUrl ?? '';

    // 4. Insertar registro en tabla
    const { data, error } = await supabase
      .from('tratamiento_fotos')
      .insert({
        tratamiento_id: params.tratamientoId,
        sesion_id: null,
        url_foto: urlFoto,
        storage_path: storagePath,
        tipo: 'progreso',
        numero_sesion: null,
        descripcion: params.descripcion ?? null,
        subida_por: params.clienteId,
      })
      .select()
      .single();

    if (error) {
      // Rollback del archivo si falla el insert
      await supabase.storage.from('tratamiento-fotos').remove([storagePath]);
      return { foto: null, error: error.message };
    }

    return { foto: data as PortalFotoRow, error: null };
  } catch (e) {
    return { foto: null, error: e instanceof Error ? e.message : 'Error desconocido.' };
  }
}