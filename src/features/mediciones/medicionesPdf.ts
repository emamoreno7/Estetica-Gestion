import { activeChronological, getChartPoints, MEASURE_FIELDS, type ChartKey, type MedicionCorporal } from './medicionesLogic';

const AR_DATE = (date: string) =>
  new Intl.DateTimeFormat('es-AR', { year: 'numeric', month: 'short', day: '2-digit' })
    .format(new Date(date + 'T12:00:00'));

export async function downloadMeasurementReport(
  clientName: string,
  rows: MedicionCorporal[],
  metric: ChartKey,
  metricLabel: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const safe = clientName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().slice(0, 65);
  const active = activeChronological(rows);
  const navy: [number, number, number] = [16, 58, 77];
  const sage: [number, number, number] = [112, 151, 135];
  const text: [number, number, number] = [84, 104, 111];

  const header = (title: string) => {
    doc.setFillColor(251, 248, 245);
    doc.rect(0, 0, 297, 210, 'F');
    doc.setTextColor(...navy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('AMORE', 17, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setCharSpace(1.6);
    doc.text('CENTRO DI BELLEZZA', 17, 28);
    doc.setCharSpace(0);
    doc.setDrawColor(221, 214, 205);
    doc.line(17, 34, 280, 34);
    doc.setTextColor(...navy);
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 17, 45);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(clientName, 17, 52);
    doc.setTextColor(...text);
    doc.setFontSize(8);
    doc.text('Generado el ' + AR_DATE(new Date().toISOString().slice(0, 10)), 280, 45, { align: 'right' });
    doc.setFontSize(7);
    doc.text('Documento privado. Compartir únicamente con autorización de la clienta.', 17, 200);
    doc.text('Registro estético: no constituye diagnóstico médico.', 280, 200, { align: 'right' });
  };

  header('Historial de medidas');
  const points = getChartPoints(active, metric);
  if (points.length) {
    doc.setFontSize(12);
    doc.setTextColor(...navy);
    doc.text('Evolución · ' + metricLabel, 17, 66);
    doc.setFontSize(9);
    doc.setTextColor(...text);
    const unit = metric === 'peso_kg' ? 'kg' : 'cm';
    doc.text(points.length + ' registro(s) de ' + metricLabel.toLowerCase() +
      ' · ' + points[0].value + ' ' + unit + ' inicial · ' +
      points[points.length - 1].value + ' ' + unit + ' último', 17, 73);

    const vals = points.map((p) => p.value);
    const lo = Math.min(...vals) - 2;
    const hi = Math.max(...vals) + 2;
    const x = (i: number) => points.length > 1 ? 24 + (i / (points.length - 1)) * 246 : 145;
    const y = (v: number) => 154 - ((v - lo) / (hi - lo)) * 65;
    doc.setDrawColor(222, 229, 224);
    for (let j = 0; j < 4; j++) doc.line(24, 89 + j * 21, 270, 89 + j * 21);
    doc.setDrawColor(...sage);
    doc.setLineWidth(0.8);
    for (let i = 1; i < points.length; i++) doc.line(x(i-1), y(points[i-1].value), x(i), y(points[i].value));
    for (let i = 0; i < points.length; i++) {
      doc.setFillColor(...sage);
      doc.circle(x(i), y(points[i].value), 1.6, 'F');
    }
    doc.setTextColor(...text);
    doc.text(AR_DATE(points[0].fecha), 24, 167);
    doc.text(AR_DATE(points[points.length-1].fecha), 270, 167, { align: 'right' });
  } else {
    doc.setFontSize(10);
    doc.text('Sin registros para esta zona.', 17, 67);
  }

  const widths = [22, 18, 20, ...MEASURE_FIELDS.map(() => 24.5)];
  const starts: number[] = [17];
  widths.forEach((w, i) => starts.push(starts[i] + w));
  const cols = ['Fecha', 'Sesión', 'Peso', ...MEASURE_FIELDS.map((m) => m.short)];
  let yRow = 70;
  const drawTableHeader = () => {
    doc.setFillColor(...navy);doc.rect(17, yRow, 260, 11, 'F');
    doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(7);
    cols.forEach((col,i) => doc.text(col, starts[i]+1.5, yRow+7));
    yRow += 11;
    doc.setFont('helvetica','normal');
  };
  doc.addPage();header('Detalle por fecha');drawTableHeader();
  active.forEach((m, idx) => {
    if (yRow > 181) { doc.addPage();header('Detalle por fecha · continuación'); yRow = 61; drawTableHeader(); }
    if (idx % 2) {doc.setFillColor(246,246,241);doc.rect(17,yRow,260,8,'F');}
    doc.setTextColor(...navy);doc.setFontSize(7);
    const n = (value: number | null) => value === null ? '—' : String(value).replace('.',',');
    const values = [AR_DATE(m.fecha).replace(' de ',' '), m.sesion_nro?.toString() ?? '—', n(m.peso_kg),
      ...MEASURE_FIELDS.map((field)=>n(m[field.key]))];
    values.forEach((value,i)=>doc.text(value,starts[i]+1.4,yRow+5.2));
    yRow += 8;
  });
  doc.save('amore-medidas-' + safe + '.pdf');
}
