import { supabase } from '@/lib/supabaseClient';

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export type NotifKind =
  | 'cita_confirmada'
  | 'admin_mensaje'
  | 'sesion_registrada'
  | 'foto_subida';

export type NotificacionRow = {
  id: string;
  cliente_id: string;
  kind: NotifKind;
  title: string;
  body: string;
  tratamiento_id: string | null;
  sesion_id: string | null;
  read: boolean;
  created_at: string;
};

// ═══════════════════════════════════════════════════════════════
// FETCH — cliente ve solo las suyas (RLS)
// ═══════════════════════════════════════════════════════════════

export async function fetchNotificacionesCliente(clienteId: string): Promise<{
  rows: NotificacionRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('notificaciones_cliente')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as NotificacionRow[], error: null };
}

// ═══════════════════════════════════════════════════════════════
// MARCAR LEÍDA
// ═══════════════════════════════════════════════════════════════

export async function marcarNotifLeida(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notificaciones_cliente')
    .update({ read: true })
    .eq('id', id);

  return { error: error?.message ?? null };
}

export async function marcarTodasLeidas(clienteId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notificaciones_cliente')
    .update({ read: true })
    .eq('cliente_id', clienteId)
    .eq('read', false);

  return { error: error?.message ?? null };
}

// ═══════════════════════════════════════════════════════════════
// INSERT — lo llama el admin al registrar sesión o subir foto
// ═══════════════════════════════════════════════════════════════

export async function insertNotificacion(params: {
  clienteId: string;
  kind: NotifKind;
  title: string;
  body: string;
  tratamientoId?: string | null;
  sesionId?: string | null;
}): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notificaciones_cliente')
    .insert({
      cliente_id: params.clienteId,
      kind: params.kind,
      title: params.title,
      body: params.body,
      tratamiento_id: params.tratamientoId ?? null,
      sesion_id: params.sesionId ?? null,
    });

  return { error: error?.message ?? null };
}
// ═══════════════════════════════════════════════════════════════
// HELPER — a qué vista del portal lleva cada tipo de notificación
// ═══════════════════════════════════════════════════════════════

export type PortalViewTarget = 'inicio' | 'tratamiento' | 'evolucion' | 'citas' | 'perfil';

export function notifTargetView(kind: NotifKind): PortalViewTarget {
  switch (kind) {
    case 'sesion_registrada':
      return 'tratamiento';
    case 'foto_subida':
      return 'evolucion';
    case 'cita_confirmada':
      return 'citas';
    case 'admin_mensaje':
    default:
      return 'inicio';
  }
}