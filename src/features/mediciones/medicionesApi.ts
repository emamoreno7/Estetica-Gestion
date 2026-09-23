import { supabase } from '@/lib/supabaseClient';
import type { MedicionCorporal, MedicionInput } from './medicionesLogic';

const COLUMNS = [
  'id', 'cliente_id', 'fecha', 'sesion_nro', 'tratamiento', 'peso_kg',
  'brazo_cm', 'abdomen_alto_cm', 'cintura_cm', 'abdomen_bajo_cm',
  'cadera_alta_cm', 'cadera_baja_cm', 'muslo_cm', 'rodilla_cm',
  'observaciones', 'registrado_por', 'registrado_at', 'anulado_at', 'motivo_anulacion',
].join(',');

function displayDbError(error: { code?: string; message: string }): string {
  if (/42P01|PGRST205|schema cache|does not exist/i.test(error.code + ' ' + error.message)) {
    return 'Falta aplicar la migración de Mediciones Corporales en Supabase. Consultá al administrador.';
  }
  if (/42501|permission|row-level security/i.test(error.code + ' ' + error.message)) {
    return 'Tu cuenta no tiene permisos para consultar o registrar estas mediciones.';
  }
  if (error.code === '23503') return 'El cliente indicado ya no existe o tiene referencias incompatibles.';
  return error.message || 'Ocurrió un error al consultar Supabase.';
}

function mapMeasurement(raw: Record<string, unknown>): MedicionCorporal {
  const numeric = (key: string): number | null => raw[key] == null ? null : Number(raw[key]);
  const txt = (key: string): string | null => raw[key] == null ? null : String(raw[key]);
  return {
    id: String(raw.id),
    cliente_id: String(raw.cliente_id),
    fecha: String(raw.fecha),
    sesion_nro: numeric('sesion_nro'),
    tratamiento: txt('tratamiento'),
    peso_kg: numeric('peso_kg'),
    brazo_cm: numeric('brazo_cm'),
    abdomen_alto_cm: numeric('abdomen_alto_cm'),
    cintura_cm: numeric('cintura_cm'),
    abdomen_bajo_cm: numeric('abdomen_bajo_cm'),
    cadera_alta_cm: numeric('cadera_alta_cm'),
    cadera_baja_cm: numeric('cadera_baja_cm'),
    muslo_cm: numeric('muslo_cm'),
    rodilla_cm: numeric('rodilla_cm'),
    observaciones: txt('observaciones'),
    registrado_por: txt('registrado_por'),
    registrado_at: String(raw.registrado_at),
    anulado_at: txt('anulado_at'),
    motivo_anulacion: txt('motivo_anulacion'),
  };
}

export async function listMediciones(clienteId: string): Promise<{
  rows: MedicionCorporal[];
  error: string | null;
}> {
  const { data, error } = await supabase.from('mediciones_corporales')
    .select(COLUMNS).eq('cliente_id', clienteId)
    .order('fecha', { ascending: false })
    .order('registrado_at', { ascending: false });
  return {
    rows: error ? [] : (data ?? []).map((row) => mapMeasurement(row as unknown as Record<string, unknown>)),
    error: error ? displayDbError(error) : null,
  };
}

export async function createMedicion(input: MedicionInput): Promise<{
  item: MedicionCorporal | null; error: string | null;
}> {
  const { data: identity, error: identityError } = await supabase.auth.getUser();
  if (identityError || !identity.user) return { item: null, error: 'Tu sesión expiró. Volvé a ingresar.' };

  const { data, error } = await supabase.from('mediciones_corporales')
    .insert({ ...input, registrado_por: identity.user.id })
    .select(COLUMNS).single();
  return {
    item: data ? mapMeasurement(data as unknown as Record<string, unknown>) : null,
    error: error ? displayDbError(error) : null,
  };
}

export async function annulMedicion(id: string, motivo: string): Promise<string | null> {
  const { error } = await supabase.rpc('anular_medicion_corporal',
    { p_medicion_id: id, p_motivo: motivo.trim() });
  return error ? displayDbError(error) : null;
}

export type ClienteMediciones = { id: string; full_name: string; phone: string };
export type OperadorMediciones = {
  usuario_id: string; email: string; activo: boolean; creado_at: string;
};

export async function canManageMediciones(): Promise<boolean> {
  const { data, error } = await supabase.rpc('puede_registrar_mediciones');
  if (error) return false;
  return data === true;
}

export async function searchMeasurementClients(q: string): Promise<{
  rows: ClienteMediciones[]; error: string | null;
}> {
  const needle = q.trim();
  if (needle.length < 2) return { rows: [], error: null };
  const { data, error } = await supabase.rpc('buscar_clientes_para_mediciones',
    { p_busqueda: needle });
  return {
    rows: error ? [] : (data ?? []) as ClienteMediciones[],
    error: error ? displayDbError(error) : null,
  };
}

export async function listMeasurementOperators(): Promise<{
  rows: OperadorMediciones[]; error: string | null;
}> {
  const { data, error } = await supabase.rpc('listar_operadores_mediciones');
  return {
    rows: error ? [] : (data ?? []) as OperadorMediciones[],
    error: error ? displayDbError(error) : null,
  };
}

export async function setMeasurementOperator(email: string, active: boolean): Promise<string | null> {
  const { error } = await supabase.rpc('configurar_operador_mediciones',
    { p_email: email.trim().toLowerCase(), p_activo: active });
  return error ? displayDbError(error) : null;
}
