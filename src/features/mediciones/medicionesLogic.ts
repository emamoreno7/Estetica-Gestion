/** Métricas del registro Amore: conservamos el orden de la planilla en papel. */
export const MEASURE_FIELDS = [
  { key: 'brazo_cm', label: 'Brazo', short: 'Brazo', unit: 'cm' },
  { key: 'abdomen_alto_cm', label: 'Abdomen alto', short: 'Abd. alto', unit: 'cm' },
  { key: 'cintura_cm', label: 'Cintura', short: 'Cintura', unit: 'cm' },
  { key: 'abdomen_bajo_cm', label: 'Abdomen bajo', short: 'Abd. bajo', unit: 'cm' },
  { key: 'cadera_alta_cm', label: 'Cadera alta', short: 'Cadera alta', unit: 'cm' },
  { key: 'cadera_baja_cm', label: 'Cadera baja', short: 'Cadera baja', unit: 'cm' },
  { key: 'muslo_cm', label: 'Muslo', short: 'Muslo', unit: 'cm' },
  { key: 'rodilla_cm', label: 'Rodilla', short: 'Rodilla', unit: 'cm' },
] as const;

export type MeasureKey = (typeof MEASURE_FIELDS)[number]['key'];
export type ChartKey = MeasureKey | 'peso_kg';
export const CHART_FIELDS: ReadonlyArray<{ key: ChartKey; label: string; unit: 'cm' | 'kg' }> = [
  { key: 'cintura_cm', label: 'Cintura', unit: 'cm' },
  ...MEASURE_FIELDS.filter((field) => field.key !== 'cintura_cm'),
  { key: 'peso_kg', label: 'Peso', unit: 'kg' },
];

export type MedicionCorporal = {
  id: string;
  cliente_id: string;
  fecha: string;
  sesion_nro: number | null;
  tratamiento: string | null;
  peso_kg: number | null;
  brazo_cm: number | null;
  abdomen_alto_cm: number | null;
  cintura_cm: number | null;
  abdomen_bajo_cm: number | null;
  cadera_alta_cm: number | null;
  cadera_baja_cm: number | null;
  muslo_cm: number | null;
  rodilla_cm: number | null;
  observaciones: string | null;
  registrado_por: string | null;
  registrado_at: string;
  anulado_at: string | null;
  motivo_anulacion: string | null;
};

export type MedicionValues = Partial<Pick<MedicionCorporal, ChartKey>>;
export type MedicionInput = MedicionValues & {
  id: string;
  cliente_id: string;
  fecha: string;
  sesion_nro: number | null;
  tratamiento: string | null;
  observaciones: string | null;
};

export const EMPTY_VALUES: Record<ChartKey, string> = {
  peso_kg: '',
  brazo_cm: '',
  abdomen_alto_cm: '',
  cintura_cm: '',
  abdomen_bajo_cm: '',
  cadera_alta_cm: '',
  cadera_baja_cm: '',
  muslo_cm: '',
  rodilla_cm: '',
};

export function parseOptionalMeasurement(raw: string, key: ChartKey): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+(?:[,.]\d{1,2})?$/.test(trimmed)) {
    throw new Error('Ingresá un número válido (hasta dos decimales).');
  }
  const n = Number(trimmed.replace(',', '.'));
  const [min, max] = key === 'peso_kg' ? [20, 400] : [10, 260];
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(key === 'peso_kg' ? 'El peso debe estar entre 20 y 400 kg.' : 'La medida debe estar entre 10 y 260 cm.');
  }
  return n;
}

export function buildMeasurementValues(
  input: Record<ChartKey, string>,
): Record<ChartKey, number | null> {
  const result = {} as Record<ChartKey, number | null>;
  for (const key of Object.keys(input) as ChartKey[]) {
    result[key] = parseOptionalMeasurement(input[key], key);
  }
  if (Object.values(result).every((n) => n === null)) {
    throw new Error('Registrá al menos una medida o el peso.');
  }
  return result;
}

export function formatMeasurement(value: number | null, unit = 'cm'): string {
  return value === null ? '—' : value.toLocaleString('es-AR', { maximumFractionDigits: 2 }) + ' ' + unit;
}

/** Orden cronológico, sin descartar mediciones históricas en una misma fecha. */
export function activeChronological(rows: MedicionCorporal[]): MedicionCorporal[] {
  return rows.filter((row) => row.anulado_at === null)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) ||
      a.registrado_at.localeCompare(b.registrado_at) || a.id.localeCompare(b.id));
}

export type ChartPoint = { id: string; fecha: string; value: number; sesion_nro: number | null };

export function getChartPoints(rows: MedicionCorporal[], key: ChartKey): ChartPoint[] {
  return activeChronological(rows)
    .filter((row) => row[key] !== null)
    .map((row) => ({ id: row.id, fecha: row.fecha, value: row[key] as number, sesion_nro: row.sesion_nro }));
}

export function metricProgress(rows: MedicionCorporal[], key: ChartKey) {
  const points = getChartPoints(rows, key);
  if (points.length === 0) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const change = Number((last.value - first.value).toFixed(2));
  return { first, last, change, count: points.length };
}
