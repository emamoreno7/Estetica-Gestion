import { supabase } from '@/lib/supabaseClient';
import {
  CITA_HORA_FIN,
  CITA_HORA_INICIO,
  CITA_INTERVALO_MIN,
  type ServicioReservable,
} from '@/lib/citasConstants';

export type CitaEstado = 'confirmado' | 'pendiente' | 'realizado' | 'cancelado';

export type CitaClienteRow = {
  id: string;
  cliente_id: string;
  servicio: string;
  fecha: string;
  hora: string;
  estado: CitaEstado;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Franja hh:mm:SS en TZ local (solo hora efectiva como string Postgres time). */
function horaUtcToTimeString(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${pad(h)}:${pad(m)}:00`;
}

/** Genera turnos disponibles 09–20 cada CITA_INTERVALO_MIN. */
export function generarFranjasComerciales(): string[] {
  const out: string[] = [];
  const start = CITA_HORA_INICIO * 60;
  const lastStart = CITA_HORA_FIN * 60 - CITA_INTERVALO_MIN;
  for (let t = start; t <= lastStart; t += CITA_INTERVALO_MIN) {
    out.push(horaUtcToTimeString(t));
  }
  return out;
}

function normalizeTimeRpc(v: unknown): string {
  if (typeof v === 'string') {
    const m = v.match(/^(\d{2}):(\d{2})/);
    if (m) return `${m[1]}:${m[2]}:00`;
    return v.trim();
  }
  return '';
}

/** Clave canónica hh:mm:ss para comparar ocupación vs candidatos locales. */
function slotCanon(h: string): string {
  const m = String(h).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return '';
  const hh = pad(Number(m[1]));
  const mm = pad(Number(m[2]));
  return `${hh}:${mm}:00`;
}

export function filtrarFranjasDisponibles(ocupadas: string[], todas: string[]): string[] {
  const occ = new Set<string>();
  for (const o of ocupadas) {
    const k = slotCanon(normalizeTimeRpc(o));
    if (k) occ.add(k);
  }
  return todas.filter((t) => {
    const k = slotCanon(t);
    return !!k && !occ.has(k);
  });
}
export async function fetchHorasOcupadasPorFecha(
  fechaYmd: string
): Promise<{ horasOcupadas: string[]; error: string | null }> {
  const { data, error } = await supabase.rpc('citas_horas_ocupadas', { p_fecha: fechaYmd });

  if (error) {
    return {
      horasOcupadas: [],
      error: error.message.includes('permission')
        ? 'No pudimos consultar disponibilidad. Revisá la migración SQL y tus permisos.'
        : error.message,
    };
  }

  const lista = Array.isArray(data) ? data : [];
  const horas = lista
    .map((x) => normalizeTimeRpc(x as unknown))
    .filter(Boolean);

  return { horasOcupadas: horas, error: null };
}

function parseSqlDateYmdLocal(ymd: string): Date {
  const [yStr, moStr, dStr] = ymd.split('-');
  const y = Number(yStr);
  const m = Number(moStr);
  const d = Number(dStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return new Date(NaN);
  return new Date(y, m - 1, d);
}

export function parseCitaMomentLocal(c: Pick<CitaClienteRow, 'fecha' | 'hora'>): Date {
  const day = parseSqlDateYmdLocal(c.fecha);
  const hm = c.hora.match(/^(\d{2}):(\d{2})/);
  const h = hm ? Number(hm[1]) : 9;
  const mi = hm ? Number(hm[2]) : 0;
  day.setHours(h, mi, 0, 0);
  return day;
}

/** Próximo turno del cliente desde hoy inclusivo. */
export function esCitaFutura(c: Pick<CitaClienteRow, 'fecha' | 'hora'>): boolean {
  const dt = parseCitaMomentLocal(c);
  return !Number.isNaN(dt.getTime()) && dt.getTime() >= Date.now() - 60_000;
}

export async function fetchProximaCitaCliente(
  clienteId: string
): Promise<{ cita: CitaClienteRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('citas')
    .select('id, cliente_id, servicio, fecha, hora, estado')
    .eq('cliente_id', clienteId)
    .in('estado', ['confirmado', 'pendiente'])
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })
    .limit(24);

  if (error) return { cita: null, error: error.message };

  const rows = (data ?? []) as CitaClienteRow[];
  const futura = rows.find((r) => esCitaFutura(r));
  return { cita: futura ?? null, error: null };
}

export async function insertarReservaCliente(opts: {
  clienteId: string;
  servicio: ServicioReservable | string;
  fechaYmd: string;
  hora: string;
  estado?: CitaEstado;
}): Promise<{ cita: CitaClienteRow | null; error: string | null }> {
  const estado = opts.estado ?? 'confirmado';

  const { data, error } = await supabase
    .from('citas')
    .insert({
      cliente_id: opts.clienteId,
      servicio: opts.servicio,
      fecha: opts.fechaYmd,
      hora: opts.hora,
      estado,
    })
    .select('id, cliente_id, servicio, fecha, hora, estado')
    .single();

  if (error) {
    const dup = `${error.code ?? ''}${error.message}`.toLowerCase();
    const msg =
      dup.includes('unique') || dup.includes('duplicate')
        ? 'Ese horario fue tomado por otra persona. Elegí otra hora.'
        : error.message;
    return { cita: null, error: msg };
  }

  return { cita: data as CitaClienteRow, error: null };
}
// ═══════════════════════════════════════════════════════════════
// ADMIN — Listar y editar citas
// ═══════════════════════════════════════════════════════════════

/** Lista TODAS las citas de un cliente (admin, ordenadas por fecha desc) */
export async function listCitasCliente(clienteId: string): Promise<{
  rows: CitaClienteRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('citas')
    .select('id, cliente_id, servicio, fecha, hora, estado')
    .eq('cliente_id', clienteId)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false });

  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as CitaClienteRow[], error: null };
}

/** Actualiza fecha/hora/estado de una cita (admin) */
export async function actualizarCitaAdmin(
  citaId: string,
  cambios: {
    fecha?: string;
    hora?: string;
    estado?: CitaEstado;
  }
): Promise<{ error: string | null }> {
  const patch: Record<string, unknown> = {};
  if (cambios.fecha !== undefined) patch.fecha = cambios.fecha;
  if (cambios.hora !== undefined) patch.hora = cambios.hora;
  if (cambios.estado !== undefined) patch.estado = cambios.estado;

  if (Object.keys(patch).length === 0) return { error: null };

  const { error } = await supabase.from('citas').update(patch).eq('id', citaId);

  if (error) {
    const dup = `${error.code ?? ''}${error.message}`.toLowerCase();
    const msg =
      dup.includes('unique') || dup.includes('duplicate')
        ? 'Ese horario ya está ocupado por otra cita. Elegí otro.'
        : error.message;
    return { error: msg };
  }

  return { error: null };
}