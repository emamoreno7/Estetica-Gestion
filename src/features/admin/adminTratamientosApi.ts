import { supabase } from '@/lib/supabaseClient';

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export type TratamientoEstado = 'activo' | 'finalizado' | 'pausado' | 'cancelado';
export type FotoTipo = 'inicial' | 'progreso' | 'final';

export type TratamientoClienteRow = {
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
  estado: TratamientoEstado;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Datos del cliente (join)
  cliente_nombre?: string;
  cliente_telefono?: string;
};

export type SesionRow = {
  id: string;
  tratamiento_id: string;
  numero_sesion: number;
  fecha_sesion: string;
  hora_sesion: string | null;
  profesional: string;
  observaciones: string | null;
  puntos_otorgados: number;
  created_at: string;
};

export type FotoRow = {
  id: string;
  tratamiento_id: string;
  sesion_id: string | null;
  url_foto: string;
  storage_path: string;
  tipo: FotoTipo;
  numero_sesion: number | null;
  descripcion: string | null;
  subida_por: string | null;
  created_at: string;
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function mapRlsError(error: { message: string }): string {
  return error.message.includes('row-level security')
    ? 'Sin permisos: verificá que tu email esté en is_portal_admin() y VITE_ADMIN_EMAILS.'
    : error.message;
}

// ═══════════════════════════════════════════════════════════════
// TRATAMIENTOS
// ═══════════════════════════════════════════════════════════════

/** Listar todos los tratamientos (admin ve todo, cliente solo los suyos por RLS) */
export async function listTratamientosAdmin(): Promise<{
  rows: TratamientoClienteRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('tratamientos_cliente')
    .select(`
      *,
      perfiles_clientes:cliente_id (full_name, phone)
    `)
    .order('created_at', { ascending: false });

  if (error) return { rows: [], error: mapRlsError(error) };

  const rows: TratamientoClienteRow[] = (data ?? []).map((r) => {
    const perfil = (r as { perfiles_clientes?: { full_name?: string; phone?: string } })
      .perfiles_clientes;
    return {
      id: r.id,
      cliente_id: r.cliente_id,
      servicio_id: r.servicio_id,
      servicio_nombre: r.servicio_nombre,
      profesional: r.profesional,
      zona: r.zona,
      fecha_inicio: r.fecha_inicio,
      precio_total: Number(r.precio_total) || 0,
      sesiones_totales: r.sesiones_totales,
      sesiones_realizadas: r.sesiones_realizadas,
      puntos_acumulados: r.puntos_acumulados,
      estado: r.estado as TratamientoEstado,
      notas: r.notas,
      created_at: r.created_at,
      updated_at: r.updated_at,
      cliente_nombre: perfil?.full_name ?? 'Cliente Amore',
      cliente_telefono: perfil?.phone ?? '',
    };
  });

  return { rows, error: null };
}

/** Obtener tratamiento por ID */
export async function getTratamientoById(id: string): Promise<{
  tratamiento: TratamientoClienteRow | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('tratamientos_cliente')
    .select(`
      *,
      perfiles_clientes:cliente_id (full_name, phone)
    `)
    .eq('id', id)
    .single();

  if (error) return { tratamiento: null, error: mapRlsError(error) };
  if (!data) return { tratamiento: null, error: 'No encontrado.' };

  const perfil = (data as { perfiles_clientes?: { full_name?: string; phone?: string } })
    .perfiles_clientes;

  return {
    tratamiento: {
      id: data.id,
      cliente_id: data.cliente_id,
      servicio_id: data.servicio_id,
      servicio_nombre: data.servicio_nombre,
      profesional: data.profesional,
      zona: data.zona,
      fecha_inicio: data.fecha_inicio,
      precio_total: Number(data.precio_total) || 0,
      sesiones_totales: data.sesiones_totales,
      sesiones_realizadas: data.sesiones_realizadas,
      puntos_acumulados: data.puntos_acumulados,
      estado: data.estado as TratamientoEstado,
      notas: data.notas,
      created_at: data.created_at,
      updated_at: data.updated_at,
      cliente_nombre: perfil?.full_name ?? 'Cliente Amore',
      cliente_telefono: perfil?.phone ?? '',
    },
    error: null,
  };
}

/** Crear un nuevo tratamiento para un cliente */
export async function crearTratamiento(params: {
  clienteId: string;
  servicioId: string;
  servicioNombre: string;
  profesional: string;
  zona?: string;
  fechaInicio: string;
  precioTotal: number;
  sesionesTotales: number;
  notas?: string | null;
}): Promise<{ tratamiento: TratamientoClienteRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('tratamientos_cliente')
    .insert({
      cliente_id: params.clienteId,
      servicio_id: params.servicioId,
      servicio_nombre: params.servicioNombre,
      profesional: params.profesional,
      zona: params.zona ?? 'Rivadavia',
      fecha_inicio: params.fechaInicio,
      precio_total: params.precioTotal,
      sesiones_totales: params.sesionesTotales,
      notas: params.notas ?? null,
    })
    .select()
    .single();

  if (error) return { tratamiento: null, error: mapRlsError(error) };

  return {
    tratamiento: {
      id: data.id,
      cliente_id: data.cliente_id,
      servicio_id: data.servicio_id,
      servicio_nombre: data.servicio_nombre,
      profesional: data.profesional,
      zona: data.zona,
      fecha_inicio: data.fecha_inicio,
      precio_total: Number(data.precio_total) || 0,
      sesiones_totales: data.sesiones_totales,
      sesiones_realizadas: data.sesiones_realizadas,
      puntos_acumulados: data.puntos_acumulados,
      estado: data.estado as TratamientoEstado,
      notas: data.notas,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
    error: null,
  };
}

/** Actualizar estado del tratamiento */
export async function actualizarEstadoTratamiento(
  id: string,
  estado: TratamientoEstado
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('tratamientos_cliente')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id);

  return { error: error ? mapRlsError(error) : null };
}

/** Eliminar tratamiento (con sus sesiones y fotos por CASCADE) */
export async function eliminarTratamiento(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('tratamientos_cliente').delete().eq('id', id);
  return { error: error ? mapRlsError(error) : null };
}

// ═══════════════════════════════════════════════════════════════
// SESIONES
// ═══════════════════════════════════════════════════════════════

/** Listar sesiones de un tratamiento */
export async function listSesionesByTratamiento(
  tratamientoId: string
): Promise<{ rows: SesionRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('tratamiento_sesiones')
    .select('*')
    .eq('tratamiento_id', tratamientoId)
    .order('numero_sesion', { ascending: true });

  if (error) return { rows: [], error: mapRlsError(error) };

  return { rows: (data ?? []) as SesionRow[], error: null };
}

/** Registrar una nueva sesión (el trigger actualiza contador automáticamente) */
export async function registrarSesion(params: {
  tratamientoId: string;
  numeroSesion: number;
  fechaSesion: string;
  horaSesion?: string | null;
  profesional: string;
  observaciones?: string | null;
  puntosOtorgados?: number;
}): Promise<{ sesion: SesionRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('tratamiento_sesiones')
    .insert({
      tratamiento_id: params.tratamientoId,
      numero_sesion: params.numeroSesion,
      fecha_sesion: params.fechaSesion,
      hora_sesion: params.horaSesion ?? null,
      profesional: params.profesional,
      observaciones: params.observaciones ?? null,
      puntos_otorgados: params.puntosOtorgados ?? 10,
    })
    .select()
    .single();

  if (error) return { sesion: null, error: mapRlsError(error) };
  return { sesion: data as SesionRow, error: null };
}

/** Eliminar sesión (el trigger actualiza contador automáticamente) */
export async function eliminarSesion(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('tratamiento_sesiones').delete().eq('id', id);
  return { error: error ? mapRlsError(error) : null };
}
/** Actualizar fecha/hora/observaciones de una sesión existente */
export async function actualizarSesion(
  sesionId: string,
  cambios: {
    fechaSesion?: string;
    horaSesion?: string | null;
    profesional?: string;
    observaciones?: string | null;
  }
): Promise<{ error: string | null }> {
  const patch: Record<string, unknown> = {};
  if (cambios.fechaSesion !== undefined) patch.fecha_sesion = cambios.fechaSesion;
  if (cambios.horaSesion !== undefined) patch.hora_sesion = cambios.horaSesion;
  if (cambios.profesional !== undefined) patch.profesional = cambios.profesional;
  if (cambios.observaciones !== undefined) patch.observaciones = cambios.observaciones;

  if (Object.keys(patch).length === 0) return { error: null };

  const { error } = await supabase
    .from('tratamiento_sesiones')
    .update(patch)
    .eq('id', sesionId);

  return { error: error ? mapRlsError(error) : null };
}

// ═══════════════════════════════════════════════════════════════
// FOTOS
// ═══════════════════════════════════════════════════════════════

/** Listar fotos de un tratamiento */
export async function listFotosByTratamiento(
  tratamientoId: string
): Promise<{ rows: FotoRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('tratamiento_fotos')
    .select('*')
    .eq('tratamiento_id', tratamientoId)
    .order('created_at', { ascending: true });

  if (error) return { rows: [], error: mapRlsError(error) };
  return { rows: (data ?? []) as FotoRow[], error: null };
}

/** Subir foto al Storage y registrarla en la tabla */
export async function subirFotoTratamiento(params: {
  tratamientoId: string;
  file: File;
  tipo: FotoTipo;
  sesionId?: string | null;
  numeroSesion?: number | null;
  descripcion?: string | null;
}): Promise<{ foto: FotoRow | null; error: string | null }> {
  try {
    // 1. Generar path único
    const ext = params.file.name.split('.').pop() ?? 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const storagePath = `${params.tratamientoId}/${params.tipo}/${fileName}`;

    // 2. Subir al bucket
    const { error: uploadError } = await supabase.storage
      .from('tratamiento-fotos')
      .upload(storagePath, params.file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) return { foto: null, error: `Upload: ${uploadError.message}` };

    // 3. Obtener URL firmada (porque el bucket es privado)
    const { data: urlData } = await supabase.storage
      .from('tratamiento-fotos')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 año

    const urlFoto = urlData?.signedUrl ?? '';

    // 4. Insertar registro en tabla
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('tratamiento_fotos')
      .insert({
        tratamiento_id: params.tratamientoId,
        sesion_id: params.sesionId ?? null,
        url_foto: urlFoto,
        storage_path: storagePath,
        tipo: params.tipo,
        numero_sesion: params.numeroSesion ?? null,
        descripcion: params.descripcion ?? null,
        subida_por: user?.id ?? null,
      })
      .select()
      .single();

    if (error) {
      // Si falla el insert, borrar el archivo subido
      await supabase.storage.from('tratamiento-fotos').remove([storagePath]);
      return { foto: null, error: mapRlsError(error) };
    }

    return { foto: data as FotoRow, error: null };
  } catch (e) {
    return { foto: null, error: e instanceof Error ? e.message : 'Error desconocido.' };
  }
}

/** Eliminar foto (Storage + tabla) */
export async function eliminarFotoTratamiento(
  fotoId: string,
  storagePath: string
): Promise<{ error: string | null }> {
  // 1. Borrar del Storage
  await supabase.storage.from('tratamiento-fotos').remove([storagePath]);

  // 2. Borrar registro
  const { error } = await supabase.from('tratamiento_fotos').delete().eq('id', fotoId);

  return { error: error ? mapRlsError(error) : null };
}

/** Refrescar URL firmada de una foto (por si caducó) */
export async function refreshFotoUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('tratamiento-fotos')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

  return data?.signedUrl ?? null;
}
/** Verifica si un cliente tiene tratamiento activo de un servicio específico */
export async function clienteTieneTratamientoActivo(
  clienteId: string,
  servicioNombre: string
): Promise<{ tiene: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from('tratamientos_cliente')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('estado', 'activo')
    .ilike('servicio_nombre', servicioNombre.trim())
    .limit(1);

  if (error) return { tiene: false, error: error.message };
  return { tiene: (data?.length ?? 0) > 0, error: null };
}