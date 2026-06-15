import { supabase } from '@/lib/supabaseClient';
import { startOfMonth, endOfMonth, format } from 'date-fns';

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export type ReporteResumen = {
  // Ingresos
  ingresosMes: number;
  ingresosMesAnterior: number;

  // Tratamientos
  tratamientosActivos: number;
  tratamientosFinalizadosMes: number;
  tasaFinalizacion: number; // porcentaje 0-100

  // Sesiones
  sesionesMes: number;
  profesionalTopNombre: string;
  profesionalTopSesiones: number;

  // Clientes
  clientesActivos: number;
  clientesNuevosMes: number;

  // Servicios más vendidos
  serviciosTop: { nombre: string; cantidad: number }[];

  // Sesiones por día (últimos 30 días, para mini gráfico)
  sesionesUltimos30: { fecha: string; cantidad: number }[];
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function mesActualRango() {
  const now = new Date();
  return {
    inicio: format(startOfMonth(now), 'yyyy-MM-dd'),
    fin: format(endOfMonth(now), 'yyyy-MM-dd'),
  };
}

function mesAnteriorRango() {
  const now = new Date();
  const primeroDiaMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    inicio: format(startOfMonth(primeroDiaMesAnterior), 'yyyy-MM-dd'),
    fin: format(endOfMonth(primeroDiaMesAnterior), 'yyyy-MM-dd'),
  };
}

function ultimos30DiasRango() {
  const fin = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 29);
  return {
    inicio: format(inicio, 'yyyy-MM-dd'),
    fin: format(fin, 'yyyy-MM-dd'),
  };
}

// ═══════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════

/** Ingresos del mes actual (suma precio_total de tratamientos creados en el mes) */
async function fetchIngresosMes(inicio: string, fin: string): Promise<number> {
  const { data } = await supabase
    .from('tratamientos_cliente')
    .select('precio_total')
    .gte('created_at', `${inicio}T00:00:00`)
    .lte('created_at', `${fin}T23:59:59`);

  return (data ?? []).reduce((acc, r) => acc + (Number(r.precio_total) || 0), 0);
}

/** Tratamientos activos totales */
async function fetchTratamientosActivos(): Promise<number> {
  const { count } = await supabase
    .from('tratamientos_cliente')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'activo');

  return count ?? 0;
}

/** Tratamientos finalizados en el mes */
async function fetchTratamientosFinalizadosMes(inicio: string, fin: string): Promise<number> {
  const { count } = await supabase
    .from('tratamientos_cliente')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'finalizado')
    .gte('updated_at', `${inicio}T00:00:00`)
    .lte('updated_at', `${fin}T23:59:59`);

  return count ?? 0;
}

/** Total de tratamientos creados en el mes (para calcular tasa) */
async function fetchTratamientosCreadosMes(inicio: string, fin: string): Promise<number> {
  const { count } = await supabase
    .from('tratamientos_cliente')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${inicio}T00:00:00`)
    .lte('created_at', `${fin}T23:59:59`);

  return count ?? 0;
}

/** Sesiones registradas en el mes */
async function fetchSesionesMes(inicio: string, fin: string): Promise<number> {
  const { count } = await supabase
    .from('tratamiento_sesiones')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_sesion', inicio)
    .lte('fecha_sesion', fin);

  return count ?? 0;
}

/** Profesional con más sesiones en el mes */
async function fetchProfesionalTop(
  inicio: string,
  fin: string
): Promise<{ nombre: string; sesiones: number }> {
  const { data } = await supabase
    .from('tratamiento_sesiones')
    .select('profesional')
    .gte('fecha_sesion', inicio)
    .lte('fecha_sesion', fin);

  if (!data || data.length === 0) return { nombre: '—', sesiones: 0 };

  // Contar manualmente en JS
  const conteo = new Map<string, number>();
  for (const r of data) {
    const p = r.profesional ?? 'Sin asignar';
    conteo.set(p, (conteo.get(p) ?? 0) + 1);
  }

  let topNombre = '—';
  let topCant = 0;
  for (const [nombre, cant] of conteo.entries()) {
    if (cant > topCant) {
      topCant = cant;
      topNombre = nombre;
    }
  }

  return { nombre: topNombre, sesiones: topCant };
}

/** Clientes activos (perfiles con status = active) */
async function fetchClientesActivos(): Promise<number> {
  const { count } = await supabase
    .from('perfiles_clientes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  return count ?? 0;
}

/** Clientes nuevos en el mes (perfiles creados en el período) */
async function fetchClientesNuevosMes(inicio: string, fin: string): Promise<number> {
  const { count } = await supabase
    .from('perfiles_clientes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${inicio}T00:00:00`)
    .lte('created_at', `${fin}T23:59:59`);

  return count ?? 0;
}

/** Top 5 servicios más vendidos (por cantidad de tratamientos) */
async function fetchServiciosTop(): Promise<{ nombre: string; cantidad: number }[]> {
  const { data } = await supabase
    .from('tratamientos_cliente')
    .select('servicio_nombre');

  if (!data || data.length === 0) return [];

  const conteo = new Map<string, number>();
  for (const r of data) {
    const s = r.servicio_nombre ?? 'Sin nombre';
    conteo.set(s, (conteo.get(s) ?? 0) + 1);
  }

  return Array.from(conteo.entries())
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);
}

/** Sesiones agrupadas por día en los últimos 30 días */
async function fetchSesionesUltimos30(
  inicio: string,
  fin: string
): Promise<{ fecha: string; cantidad: number }[]> {
  const { data } = await supabase
    .from('tratamiento_sesiones')
    .select('fecha_sesion')
    .gte('fecha_sesion', inicio)
    .lte('fecha_sesion', fin)
    .order('fecha_sesion', { ascending: true });

  if (!data || data.length === 0) return [];

  const conteo = new Map<string, number>();
  for (const r of data) {
    const f = r.fecha_sesion;
    conteo.set(f, (conteo.get(f) ?? 0) + 1);
  }

  return Array.from(conteo.entries())
    .map(([fecha, cantidad]) => ({ fecha, cantidad }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════

/** Trae todos los datos del dashboard de reportes en paralelo */
export async function fetchReporteResumen(): Promise<{
  reporte: ReporteResumen | null;
  error: string | null;
}> {
  try {
    const mesActual = mesActualRango();
    const mesAnterior = mesAnteriorRango();
    const ultimos30 = ultimos30DiasRango();

    const [
      ingresosMes,
      ingresosMesAnterior,
      tratamientosActivos,
      tratamientosFinalizadosMes,
      tratamientosCreadosMes,
      sesionesMes,
      profesionalTop,
      clientesActivos,
      clientesNuevosMes,
      serviciosTop,
      sesionesUltimos30,
    ] = await Promise.all([
      fetchIngresosMes(mesActual.inicio, mesActual.fin),
      fetchIngresosMes(mesAnterior.inicio, mesAnterior.fin),
      fetchTratamientosActivos(),
      fetchTratamientosFinalizadosMes(mesActual.inicio, mesActual.fin),
      fetchTratamientosCreadosMes(mesActual.inicio, mesActual.fin),
      fetchSesionesMes(mesActual.inicio, mesActual.fin),
      fetchProfesionalTop(mesActual.inicio, mesActual.fin),
      fetchClientesActivos(),
      fetchClientesNuevosMes(mesActual.inicio, mesActual.fin),
      fetchServiciosTop(),
      fetchSesionesUltimos30(ultimos30.inicio, ultimos30.fin),
    ]);

    // Tasa de finalización: finalizados / creados este mes * 100
    const tasaFinalizacion =
      tratamientosCreadosMes > 0
        ? Math.round((tratamientosFinalizadosMes / tratamientosCreadosMes) * 100)
        : 0;

    return {
      reporte: {
        ingresosMes,
        ingresosMesAnterior,
        tasaFinalizacion,
        tratamientosActivos,
        tratamientosFinalizadosMes,
        sesionesMes,
        profesionalTopNombre: profesionalTop.nombre,
        profesionalTopSesiones: profesionalTop.sesiones,
        clientesActivos,
        clientesNuevosMes,
        serviciosTop,
        sesionesUltimos30,
      },
      error: null,
    };
  } catch (e) {
    return {
      reporte: null,
      error: e instanceof Error ? e.message : 'Error desconocido al cargar reportes.',
    };
  }
}