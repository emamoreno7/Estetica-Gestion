import { useId } from 'react';
import { getChartPoints, type ChartKey, type MedicionCorporal } from './medicionesLogic';

const dateLabel = (iso: string) =>
  new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' })
    .format(new Date(iso + 'T12:00:00'));

type Props = {
  rows: MedicionCorporal[];
  metric: ChartKey;
  metricLabel: string;
  unit: string;
};

export function MedicionChart({ rows, metric, metricLabel, unit }: Props) {
  const rawId = useId().replace(/:/g, '');
  const gradientId = 'amore-measure-gradient-' + rawId;
  const points = getChartPoints(rows, metric);
  if (points.length === 0) {
    return (
      <div className="amore-measure-chart__empty">
        Aún no hay registros de {metricLabel.toLowerCase()}. Elegí otra zona o cargá una nueva medición.
      </div>
    );
  }

  const vals = points.map((point) => point.value);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const margin = Math.max(2, (hi - lo) * 0.3);
  const bottom = Math.floor((lo - margin) * 2) / 2;
  const top = Math.ceil((hi + margin) * 2) / 2;
  const scaleY = (v: number) => 194 - ((v - bottom) / (top - bottom)) * 147;
  const scaleX = (i: number) => points.length < 2 ? 340 : 56 + (i / (points.length - 1)) * 558;
  const trace = points.map((p, i) => (i ? 'L ' : 'M ') +
    scaleX(i).toFixed(1) + ' ' + scaleY(p.value).toFixed(1)).join(' ');
  const area = trace + ' L ' + scaleX(points.length - 1) + ' 194 L ' + scaleX(0) + ' 194 Z';
  const yTicks = [0,1,2,3,4].map((n) => ({
    y: 194 - 147 * n / 4,
    label: (bottom + (top - bottom) * n / 4).toLocaleString('es-AR', { maximumFractionDigits: 1 }),
  }));

  return (
    <div className="amore-measure-chart">
      <svg viewBox="0 0 660 248" role="img" aria-label={
        'Evolución de ' + metricLabel + ': ' +
        points.map((p) => dateLabel(p.fecha) + ' ' + p.value + ' ' + unit).join('; ')
      }>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#AFC2B6" stopOpacity="0.39"/>
            <stop offset="100%" stopColor="#AFC2B6" stopOpacity="0.015"/>
          </linearGradient>
        </defs>
        {yTicks.map(({ y, label }) => (
          <g key={y}>
            <line x1="55" x2="626" y1={y} y2={y} stroke="#e6eae6"
              strokeWidth="1" strokeDasharray="4 6"/>
            <text x="43" y={y + 4} textAnchor="end"
              fill="#76887e" fontFamily="Montserrat, sans-serif" fontSize="10">{label}</text>
          </g>
        ))}
        {points.length > 1 ? (
          <>
            <path d={area} fill={'url(#' + gradientId + ')'} />
            <path d={trace} fill="none" stroke="#73988b" strokeWidth="2.8"
              strokeLinecap="round" strokeLinejoin="round"/>
          </>
        ) : null}
        {points.map((p, i) => (
          <g key={p.id}>
            <circle cx={scaleX(i)} cy={scaleY(p.value)} r="5.5"
              fill="#fff" stroke="#567969" strokeWidth="2.5">
              <title>{dateLabel(p.fecha) + ': ' + p.value + ' ' + unit}</title>
            </circle>
            {(points.length <= 6 || i === 0 || i === points.length - 1) ? (
              <text x={scaleX(i)} y="218" textAnchor="middle"
                fontFamily="Montserrat, sans-serif" fill="#6c7f79" fontSize="10">
                {dateLabel(p.fecha)}
              </text>
            ) : null}
          </g>
        ))}
        <text x="627" y="34" textAnchor="end" fill="#8da298"
          fontFamily="Montserrat, sans-serif" fontSize="10">{unit}</text>
      </svg>
      <p className="amore-measure-chart__note">
        El gráfico muestra únicamente las fechas con registros para esta zona. Las variaciones son orientativas.
      </p>
    </div>
  );
}
