import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { Activity, ArrowDownToLine, CalendarDays, CheckCircle2, ChevronDown,
  ClipboardList, Info, Loader2, Plus, Ruler, ShieldAlert, Trash2, X } from 'lucide-react';
import { createMedicion, annulMedicion, listMediciones } from './medicionesApi';
import { activeChronological, buildMeasurementValues, CHART_FIELDS, EMPTY_VALUES,
  formatMeasurement, MEASURE_FIELDS, metricProgress,
  type ChartKey, type MedicionCorporal } from './medicionesLogic';
import { MedicionChart } from './MedicionChart';
import { MedicionAdviceModal } from './MedicionAdviceModal';
import './mediciones.css';

type Props = {
  clienteId: string;
  clienteNombre: string;
  /** Admin puede anular una medición con motivo. Equipo sólo registra y consulta. */
  isAdmin?: boolean;
};

type FormValues = {
  id: string;
  fecha: string;
  sesion_nro: string;
  tratamiento: string;
  observaciones: string;
  values: Record<ChartKey, string>;
};

const newForm = (nextSession = 1): FormValues => ({
  id: crypto.randomUUID(),
  fecha: format(new Date(), 'yyyy-MM-dd'),
  sesion_nro: String(nextSession),
  tratamiento: '',
  observaciones: '',
  values: { ...EMPTY_VALUES },
});

const dateLabel = (iso: string) =>
  new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(iso + 'T12:00:00'));

function Delta({ rows, metric }: { rows: MedicionCorporal[]; metric: ChartKey }) {
  const info = metricProgress(rows, metric);
  if (!info || info.count < 2) {
    return <span className="amore-measure-muted">Sin comparación todavía</span>;
  }
  const unit = metric === 'peso_kg' ? 'kg' : 'cm';
  const prefix = info.change > 0 ? '+' : '';
  return (
    <span className="amore-measure-stat__change">
      {prefix}{info.change.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {unit}
      <small>desde el primer registro comparable</small>
    </span>
  );
}

function AnnulDialog({ clientName, onClose, onConfirm, busy }: {
  clientName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  busy: boolean;
}) {
  const [reason, setReason] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    input.current?.focus();
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [busy, onClose]);
  return createPortal(
    <div className="amore-advice-backdrop">
      <div className="amore-annul-dialog" role="dialog" aria-modal="true"
        aria-labelledby="amore-annul-title">
        <h2 id="amore-annul-title">Anular una medición</h2>
        <p>Se conservará en el historial de {clientName}, pero dejará de computarse en los gráficos.</p>
        <label htmlFor="amore-annul-reason">Motivo de la corrección</label>
        <textarea id="amore-annul-reason" ref={input} rows={3} maxLength={300}
          value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Ej.: registro duplicado por error…" />
        <div className="amore-advice-actions">
          <button type="button" className="amore-measure-secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="amore-measure-danger" disabled={busy || reason.trim().length < 5}
            onClick={() => onConfirm(reason)}>
            {busy ? <Loader2 size={16} className="animate-spin"/> : <ShieldAlert size={16}/>}
            Confirmar anulación
          </button>
        </div>
      </div>
    </div>,document.body);
}

export default function MedicionesPanel({ clienteId, clienteNombre, isAdmin = false }: Props) {
  const [rows, setRows] = useState<MedicionCorporal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [metric, setMetric] = useState<ChartKey>('cintura_cm');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormValues>(() => newForm());
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);
  const [showAnnulled, setShowAnnulled] = useState(false);
  const [annulTarget, setAnnulTarget] = useState<MedicionCorporal | null>(null);
  const [annulBusy, setAnnulBusy] = useState(false);
  const newButton = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await listMediciones(clienteId);
    setRows(result.rows);
    setLoadError(result.error);
    setLoading(false);
  }, [clienteId]);

  useEffect(() => { void load(); }, [load]);

  const active = useMemo(() => activeChronological(rows), [rows]);
  const field = CHART_FIELDS.find((m) => m.key === metric) ?? CHART_FIELDS[0];
  const stats = metricProgress(active, metric);
  const visible = showAnnulled ? rows : rows.filter((m) => !m.anulado_at);
  const nextSession = Math.max(0, ...rows.filter((r) => !r.anulado_at)
    .map((r) => r.sesion_nro ?? 0)) + 1;

  function openNewForm() {
    setForm(newForm(nextSession));
    setActionError(null);
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setActionError(null);
    if (!form.fecha || form.fecha > format(new Date(), 'yyyy-MM-dd')) {
      setActionError('Elegí una fecha válida, hasta hoy.');
      return;
    }
    const session = form.sesion_nro.trim();
    if (session && (!/^\d{1,3}$/.test(session) || Number(session) < 1)) {
      setActionError('La sesión debe ser un entero del 1 al 999.');
      return;
    }
    let values: ReturnType<typeof buildMeasurementValues>;
    try {
      values = buildMeasurementValues(form.values);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Revisá los valores ingresados.');
      return;
    }
    setBusy(true);
    const result = await createMedicion({
      id: form.id,
      cliente_id: clienteId,
      fecha: form.fecha,
      sesion_nro: session ? Number(session) : null,
      tratamiento: form.tratamiento.trim() || null,
      observaciones: form.observaciones.trim() || null,
      ...values,
    });
    setBusy(false);
    if (result.error) { setActionError(result.error); return; }
    setShowForm(false);
    await load();
    // Los tips se abren SIEMPRE después de un alta confirmada por Supabase.
    setShowAdvice(true);
  }

  async function exportPdf() {
    if (!active.length || pdfBusy) return;
    setPdfBusy(true);
    setActionError(null);
    try {
      const { downloadMeasurementReport } = await import('./medicionesPdf');
      await downloadMeasurementReport(clienteNombre, rows, metric, field.label);
    } catch {
      setActionError('No se pudo generar el PDF. Intentá nuevamente.');
    } finally {
      setPdfBusy(false);
    }
  }

  async function confirmAnnul(reason: string) {
    if (!annulTarget || annulBusy) return;
    setAnnulBusy(true);
    setActionError(null);
    const error = await annulMedicion(annulTarget.id, reason);
    setAnnulBusy(false);
    if (error) {setActionError(error);setAnnulTarget(null);return;}
    setAnnulTarget(null);
    await load();
  }

  return (
    <div className="amore-measures">
      <div className="amore-measures__head">
        <div className="amore-measures__heading">
          <span className="amore-measure-eyebrow">AMORE · SEGUIMIENTO CORPORAL</span>
          <h2>Medidas <em>& evolución</em></h2>
          <p>Una historia de cuidado, registro a registro. Sólo el equipo autorizado puede ver estos datos.</p>
        </div>
        <button type="button" ref={newButton} onClick={openNewForm}
          className="amore-measure-primary">
          <Plus size={17} strokeWidth={1.7} aria-hidden="true"/> Nueva medición
        </button>
      </div>

      {loadError ? (
        <div className="amore-measure-error" role="alert">
          <ShieldAlert size={19} aria-hidden="true"/>{loadError}
        </div>
      ) : null}
      {actionError ? (
        <div className="amore-measure-error" role="alert">
          <Info size={18} aria-hidden="true"/>{actionError}
        </div>
      ) : null}

      {showForm ? (
        <form className="amore-measure-form" onSubmit={(e) => void save(e)}>
          <div className="amore-measure-form__title">
            <div>
              <span className="amore-measure-eyebrow">UN NUEVO REGISTRO</span>
              <h3>Tomar las medidas</h3>
            </div>
            <button type="button" disabled={busy} aria-label="Cerrar formulario"
              className="amore-measure-icon-button" onClick={() => setShowForm(false)}>
              <X size={18}/>
            </button>
          </div>
          <p className="amore-measure-form__intro">
            Usá siempre los mismos puntos anatómicos y condiciones comparables. Podés dejar en blanco las zonas que no se midieron.
          </p>
          <div className="amore-measure-form__metadata">
            <label>Fecha
              <input type="date" value={form.fecha} max={format(new Date(), 'yyyy-MM-dd')}
                required disabled={busy} onChange={(e) => setForm((f) => ({ ...f, fecha:e.target.value }))}/>
            </label>
            <label>N.º de sesión (opcional)
              <input type="number" min="1" max="999" step="1" value={form.sesion_nro}
                disabled={busy} onChange={(e) => setForm((f) => ({ ...f, sesion_nro:e.target.value }))}/>
            </label>
            <label>Tratamiento (opcional)
              <input type="text" maxLength={120} value={form.tratamiento}
                placeholder="Ej.: Body Up"
                disabled={busy} onChange={(e) => setForm((f) => ({ ...f, tratamiento:e.target.value }))}/>
            </label>
          </div>
          <div className="amore-measure-form__metrics">
            <label className="amore-measure-form__weight">
              <span>Peso actual <small>kg</small></span>
              <input type="text" inputMode="decimal" maxLength={6} placeholder="Ej.: 64,5"
                value={form.values.peso_kg} disabled={busy}
                onChange={(e) => setForm((f) => ({
                  ...f, values:{ ...f.values, peso_kg:e.target.value },
                }))}/>
            </label>
            <div className="amore-measure-form__zones">
              {MEASURE_FIELDS.map(({ key, label }) => (
                <label key={key}>
                  <span>{label} <small>cm</small></span>
                  <input type="text" inputMode="decimal" maxLength={6}
                    placeholder="Ej.: 85,5" value={form.values[key]}
                    disabled={busy} onChange={(e) => setForm((f) => ({
                      ...f, values:{...f.values,[key]:e.target.value},
                    }))}/>
                </label>
              ))}
            </div>
          </div>
          <label className="amore-measure-form__observations">
            Observaciones (opcional)
            <textarea rows={3} maxLength={1000} value={form.observaciones}
              placeholder="Condiciones de la toma, observaciones relevantes…"
              disabled={busy} onChange={(e) => setForm((f) => ({ ...f, observaciones:e.target.value }))}/>
          </label>
          <div className="amore-measure-form__actions">
            <p><ShieldAlert size={15} aria-hidden="true"/> El historial no se sobrescribe. Los errores se corrigen con una anulación auditada.</p>
            <button type="submit" disabled={busy || !!loadError} className="amore-measure-primary">
              {busy ? <Loader2 size={17} className="animate-spin"/> : <CheckCircle2 size={17}/>}
              {busy ? 'Guardando…' : 'Guardar y ver consejos'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="amore-measure-summary" aria-label="Resumen de evolución">
        <div className="amore-measure-stat">
          <span className="amore-measure-stat__icon"><ClipboardList size={22}/></span>
          <span className="amore-measure-stat__label">Mediciones registradas</span>
          <strong>{loading ? '—' : active.length}</strong>
          <small>Historial disponible</small>
        </div>
        <div className="amore-measure-stat">
          <span className="amore-measure-stat__icon"><CalendarDays size={22}/></span>
          <span className="amore-measure-stat__label">Última toma</span>
          <strong className="amore-measure-stat__date">{active.length ? dateLabel(active[active.length-1].fecha) : '—'}</strong>
          <small>{active.length ? 'Registro más reciente' : 'Aún sin registros'}</small>
        </div>
        <div className="amore-measure-stat">
          <span className="amore-measure-stat__icon"><Activity size={22}/></span>
          <span className="amore-measure-stat__label">Variación · {field.label}</span>
          <strong className="amore-measure-stat__date">
            {stats?.count && stats.count > 1 ? formatMeasurement(stats.change,field.unit) : '—'}
          </strong>
          <small>Última versus primera comparable</small>
        </div>
      </div>

      <div className="amore-measure-chart-card">
        <div className="amore-measure-chart-card__head">
          <div>
            <span className="amore-measure-eyebrow">EVOLUCIÓN POR ZONA</span>
            <h3>Tu evolución, a tu ritmo.</h3>
          </div>
          <label className="amore-measure-select">
            <span>Visualizar</span>
            <select value={metric} onChange={(e) => setMetric(e.target.value as ChartKey)}>
              {CHART_FIELDS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true"/>
          </label>
        </div>
        {loading ? (
          <div className="amore-measure-loading"><Loader2 size={23} className="animate-spin"/> Cargando historial…</div>
        ) : <MedicionChart rows={rows} metric={metric} metricLabel={field.label} unit={field.unit}/>}
        <div className="amore-measure-chart-card__baseline">
          {stats ? (
            <>
              <span>Inicial: <strong>{formatMeasurement(stats.first.value,field.unit)}</strong></span>
              <span>Último: <strong>{formatMeasurement(stats.last.value,field.unit)}</strong></span>
              <Delta rows={rows} metric={metric}/>
            </>
          ) : <p>La primera toma de esta zona establecerá el valor inicial de comparación.</p>}
        </div>
      </div>

      <div className="amore-measure-history">
        <div className="amore-measure-history__head">
          <div>
            <span className="amore-measure-eyebrow">REGISTRO HISTÓRICO</span>
            <h3>Historial completo</h3>
          </div>
          <div className="amore-measure-history__actions">
            {isAdmin && rows.some((r) => r.anulado_at !== null) ? (
              <label className="amore-measure-checkbox">
                <input type="checkbox" checked={showAnnulled}
                  onChange={(e) => setShowAnnulled(e.target.checked)}/>
                Ver anulados
              </label>
            ) : null}
            <button type="button" className="amore-measure-secondary"
              disabled={!active.length || pdfBusy}
              onClick={() => void exportPdf()}>
              {pdfBusy ? <Loader2 size={16} className="animate-spin"/> : <ArrowDownToLine size={16}/>}
              Exportar PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="amore-measure-loading"><Loader2 size={22} className="animate-spin"/> Cargando…</div>
        ) : visible.length === 0 ? (
          <div className="amore-measure-history__empty">
            <span><Ruler size={27}/></span>
            <h4>El primer paso de un seguimiento.</h4>
            <p>Tomá las medidas iniciales para que cada control posterior tenga un punto de comparación.</p>
          </div>
        ) : (
          <div className="amore-measure-history__scroll" tabIndex={0} role="region"
            aria-label="Tabla histórica de mediciones. Desplazamiento horizontal disponible.">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th><th>Sesión</th><th>Peso</th>
                  {MEASURE_FIELDS.map((m) => <th key={m.key}>{m.short}</th>)}
                  <th>Tratamiento / Observaciones</th>
                  {isAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id} className={row.anulado_at ? 'amore-measure-history__annulled' : ''}>
                    <td>{dateLabel(row.fecha)}{row.anulado_at ? <small>ANULADA</small> : null}</td>
                    <td>{row.sesion_nro ?? '—'}</td>
                    <td>{formatMeasurement(row.peso_kg,'kg')}</td>
                    {MEASURE_FIELDS.map((m) => <td key={m.key}>{formatMeasurement(row[m.key])}</td>)}
                    <td>
                      <strong>{row.tratamiento || '—'}</strong>
                      {row.observaciones && <span>{row.observaciones}</span>}
                      {row.anulado_at && <span>Motivo: {row.motivo_anulacion}</span>}
                    </td>
                    {isAdmin && <td>
                      {!row.anulado_at ? (
                        <button type="button" className="amore-measure-history__annul"
                          onClick={() => setAnnulTarget(row)} title="Anular manteniendo trazabilidad">
                          <Trash2 size={15} aria-hidden="true"/> Anular
                        </button>
                      ) : '—'}
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="amore-measure-history__footer">
          <Info size={16} aria-hidden="true"/>
          El peso y los perímetros se comparan por separado. No sumamos centímetros de zonas diferentes ni interpretamos los cambios como resultados clínicos.
        </div>
      </div>

      {showAdvice && <MedicionAdviceModal clientName={clienteNombre}
        onClose={() => {setShowAdvice(false);newButton.current?.focus();}}/>}
      {annulTarget && <AnnulDialog clientName={clienteNombre}
        busy={annulBusy} onClose={() => setAnnulTarget(null)}
        onConfirm={(reason) => void confirmAnnul(reason)}/>}
    </div>
  );
}
