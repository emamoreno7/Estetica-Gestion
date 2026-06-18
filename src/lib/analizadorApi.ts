// src/lib/analizadorApi.ts
// API del Analizador de Piel con IA — Amore Centro Di Bellezza

import { supabase } from "./supabaseClient";
import {
  CITAS_SERVICIOS_RESERVABLES,
  type ServicioReservable,
} from './citasConstants';

// ─── Constantes ─────────────────────────────────────────────────────────────

const EDGE_FUNCTION_URL =
  "https://atbbbhpbexrtnlbvvzjb.supabase.co/functions/v1/analizar-zona";

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/** Máximo de análisis permitidos según estado del usuario */
export const LIMITES_ANALISIS = {
  anonimo: 1,
  registrado: 3,
} as const;

/** Cantidad fija de análisis que otorga el admin al aprobar una solicitud */
export const ANALISIS_EXTRA_POR_APROBACION = 3;

/** Clave en localStorage para rastrear análisis anónimos */
const LS_KEY_ANONIMO = "amore_analisis_anonimo_count";

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type ZonaCuerpo =
  | "rostro"
  | "cuello"
  | "escote"
  | "espalda"
  | "brazos"
  | "abdomen"
  | "piernas"
  | "manos";

export interface ResultadoAnalisisIA {
  zona: ZonaCuerpo;
  diagnostico: string;
  tratamiento_recomendado: string;
  sesiones_recomendadas: number;
  frecuencia: string;
  tips: string[];
  nivel_urgencia: "bajo" | "medio" | "alto";
}

export interface AnalisisRealizado {
  id?: string;
  cliente_id?: string | null;
  zona: ZonaCuerpo;
  imagen_url?: string | null;
  resultado: ResultadoAnalisisIA;
  created_at?: string;
}

export interface ErrorAnalisis {
  tipo:
    | "limite_anonimo"
    | "limite_registrado"
    | "imagen_no_valida"
    | "imagen_baja_calidad"
    | "zona_no_coincide"
    | "red"
    | "desconocido";
  mensaje: string;
}

// ─── Tipos de solicitudes de análisis extra ────────────────────────────────

export type EstadoSolicitud = "pendiente" | "aprobada" | "rechazada";

export interface SolicitudAnalisisExtra {
  id: string;
  cliente_id: string;
  mensaje: string | null;
  estado: EstadoSolicitud;
  analisis_otorgados: number;
  respondido_por: string | null;
  respondido_at: string | null;
  nota_admin: string | null;
  created_at: string;
  updated_at: string;
  // Datos joineados del cliente (cuando admin lista)
  cliente_nombre?: string | null;
  cliente_email?: string | null;
  cliente_telefono?: string | null;
}

// ─── Control de límites ──────────────────────────────────────────────────────

export function getAnalisisAnonimoUsados(): number {
  const raw = localStorage.getItem(LS_KEY_ANONIMO);
  const parsed = parseInt(raw ?? "0", 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function incrementarAnalisisAnonimo(): void {
  const actual = getAnalisisAnonimoUsados();
  localStorage.setItem(LS_KEY_ANONIMO, String(actual + 1));
}

export function puedeAnalizarAnonimo(): boolean {
  return getAnalisisAnonimoUsados() < LIMITES_ANALISIS.anonimo;
}

/**
 * Versión legacy: solo cuenta el límite base (sin extras).
 * Se mantiene por compatibilidad si algún otro componente lo usa.
 */
export function puedeAnalizarRegistrado(analisisUsadosEnDB: number): boolean {
  return analisisUsadosEnDB < LIMITES_ANALISIS.registrado;
}

/**
 * Versión nueva: incluye análisis extra otorgados por el admin.
 */
export function puedeAnalizarRegistradoConExtras(
  analisisUsadosEnDB: number,
  extrasOtorgados: number
): boolean {
  const limiteTotal = LIMITES_ANALISIS.registrado + extrasOtorgados;
  return analisisUsadosEnDB < limiteTotal;
}

// ─── Conversión de imagen ────────────────────────────────────────────────────

export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Error al leer la imagen"));
    reader.readAsDataURL(file);
  });
}

export function getMediaType(file: File): string {
  const tipo = file.type || "image/jpeg";
  const permitidos = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  return permitidos.includes(tipo) ? tipo : "image/jpeg";
}

// ─── Helper: mapear código de error del backend → ErrorAnalisis ────────────

function mapearErrorBackend(codigo: string, mensaje: string): ErrorAnalisis {
  switch (codigo) {
    case "imagen_no_valida":
      return {
        tipo: "imagen_no_valida",
        mensaje:
          mensaje ||
          "La imagen no muestra piel humana apta para análisis. Probá con una foto clara de la zona.",
      };
    case "imagen_baja_calidad":
      return {
        tipo: "imagen_baja_calidad",
        mensaje:
          mensaje ||
          "La imagen no tiene calidad suficiente. Probá con mejor luz y más cerca.",
      };
    case "zona_no_coincide":
      return {
        tipo: "zona_no_coincide",
        mensaje:
          mensaje ||
          "La zona de la imagen no coincide con la que seleccionaste. Revisá o subí otra foto.",
      };
    default:
      return {
        tipo: "desconocido",
        mensaje: mensaje || "Ocurrió un error inesperado. Intentá más tarde.",
      };
  }
}

// ─── Llamada principal a la Edge Function ────────────────────────────────────

export async function analizarZona(
  zona: ZonaCuerpo,
  imagen: File
): Promise<{ data: ResultadoAnalisisIA | null; error: ErrorAnalisis | null }> {
  try {
    const imagenBase64 = await fileToBase64(imagen);
    const mediaType = getMediaType(imagen);

    const payload = {
      zona,
      imagen_base64: imagenBase64,
      media_type: mediaType,
    };

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorJson: { codigo?: string; mensaje?: string; error?: string } = {};
      try {
        errorJson = await response.json();
      } catch {
        const errorText = await response.text().catch(() => "");
        console.error(
          "[analizadorApi] Edge Function error:",
          response.status,
          errorText
        );
        return {
          data: null,
          error: {
            tipo: "red",
            mensaje: `Error del servidor (${response.status}). Intentá de nuevo.`,
          },
        };
      }

      console.warn(
        "[analizadorApi] Rechazo del backend:",
        response.status,
        errorJson
      );

      if (errorJson.codigo) {
        return {
          data: null,
          error: mapearErrorBackend(
            errorJson.codigo,
            errorJson.mensaje ?? errorJson.error ?? ""
          ),
        };
      }

      return {
        data: null,
        error: {
          tipo: "red",
          mensaje:
            errorJson.mensaje ??
            errorJson.error ??
            `Error del servidor (${response.status}).`,
        },
      };
    }

    const json = await response.json();
    const resultado: ResultadoAnalisisIA = json.resultado ?? json;

    return { data: resultado, error: null };

  } catch (err) {
    console.error("[analizadorApi] Error inesperado:", err);

    if (err instanceof TypeError && err.message.includes("fetch")) {
      return {
        data: null,
        error: {
          tipo: "red",
          mensaje: "Sin conexión. Verificá tu internet e intentá de nuevo.",
        },
      };
    }

    return {
      data: null,
      error: {
        tipo: "desconocido",
        mensaje: "Ocurrió un error inesperado. Por favor intentá más tarde.",
      },
    };
  }
}

// ─── Guardar análisis en Supabase ────────────────────────────────────────────

export async function guardarAnalisis(
  clienteId: string,
  zona: ZonaCuerpo,
  resultado: ResultadoAnalisisIA
): Promise<{ data: AnalisisRealizado | null; error: string | null }> {
  const { data, error } = await supabase
    .from("analisis_piel")
    .insert({
      cliente_id: clienteId,
      zona,
      resultado,
    })
    .select()
    .single();

  if (error) {
    console.error("[analizadorApi] Error guardando análisis:", error);
    return { data: null, error: error.message };
  }

  return { data: data as AnalisisRealizado, error: null };
}

export async function getAnalisisUsadosPorCliente(
  clienteId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("analisis_piel")
    .select("*", { count: "exact", head: true })
    .eq("cliente_id", clienteId);

  if (error) {
    console.error("[analizadorApi] Error contando análisis:", error);
    return 0;
  }

  return count ?? 0;
}

export async function getHistorialAnalisis(
  clienteId: string
): Promise<{ data: AnalisisRealizado[]; error: string | null }> {
  const { data, error } = await supabase
    .from("analisis_piel")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data as AnalisisRealizado[]) ?? [], error: null };
}

// ─── Matching con servicios reservables del portal ──────────────────────────

export function matchServicioReservable(
  nombreRecomendado: string
): ServicioReservable | null {
  const target = nombreRecomendado.trim().toLowerCase();

  const exacto = CITAS_SERVICIOS_RESERVABLES.find(
    (s) => s.toLowerCase() === target
  );
  if (exacto) return exacto;

  const incluye = CITAS_SERVICIOS_RESERVABLES.find((s) => {
    const sLower = s.toLowerCase();
    return target.includes(sLower) || sLower.includes(target);
  });
  if (incluye) return incluye;

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SISTEMA DE SOLICITUDES DE ANÁLISIS EXTRA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Obtiene la cantidad total de análisis extra que el admin le otorgó al cliente.
 * Se lee desde perfiles_clientes.analisis_extra_otorgados.
 */
export async function getAnalisisExtraOtorgados(
  clienteId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("perfiles_clientes")
    .select("analisis_extra_otorgados")
    .eq("id", clienteId)
    .maybeSingle();

  if (error) {
    console.error("[analizadorApi] Error trayendo extras otorgados:", error);
    return 0;
  }

  return (data?.analisis_extra_otorgados as number) ?? 0;
}

/**
 * Crea una nueva solicitud de análisis extra.
 * La constraint en DB impide que haya más de una pendiente por cliente.
 */
export async function crearSolicitudAnalisisExtra(
  clienteId: string,
  mensaje?: string
): Promise<{ data: SolicitudAnalisisExtra | null; error: string | null }> {
  const { data, error } = await supabase
    .from("solicitudes_analisis_extra")
    .insert({
      cliente_id: clienteId,
      mensaje: mensaje?.trim() || null,
      estado: "pendiente",
    })
    .select()
    .single();

  if (error) {
    console.error("[analizadorApi] Error creando solicitud:", error);
    if (error.code === "23505" || error.message.includes("duplicate")) {
      return {
        data: null,
        error: "Ya tenés una solicitud pendiente. Esperá la respuesta del admin.",
      };
    }
    return { data: null, error: error.message };
  }

  return { data: data as SolicitudAnalisisExtra, error: null };
}

/**
 * Devuelve la solicitud pendiente del cliente, o null si no tiene.
 */
export async function getSolicitudPendienteCliente(
  clienteId: string
): Promise<{ data: SolicitudAnalisisExtra | null; error: string | null }> {
  const { data, error } = await supabase
    .from("solicitudes_analisis_extra")
    .select("*")
    .eq("cliente_id", clienteId)
    .eq("estado", "pendiente")
    .maybeSingle();

  if (error) {
    console.error("[analizadorApi] Error trayendo solicitud pendiente:", error);
    return { data: null, error: error.message };
  }

  return { data: data as SolicitudAnalisisExtra | null, error: null };
}

/**
 * Devuelve el historial completo de solicitudes del cliente (últimas 10).
 */
export async function getHistorialSolicitudesCliente(
  clienteId: string
): Promise<{ data: SolicitudAnalisisExtra[]; error: string | null }> {
  const { data, error } = await supabase
    .from("solicitudes_analisis_extra")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data as SolicitudAnalisisExtra[]) ?? [], error: null };
}

// ─── Funciones admin ───────────────────────────────────────────────────────

/**
 * Lista todas las solicitudes, con datos del cliente joineados.
 * Permite filtrar por estado.
 */
export async function getSolicitudesAdmin(
  filtroEstado?: EstadoSolicitud | "todas"
): Promise<{ data: SolicitudAnalisisExtra[]; error: string | null }> {
  let query = supabase
    .from("solicitudes_analisis_extra")
    .select(`
      *,
      perfiles_clientes:cliente_id (
        full_name,
        phone,
        email
      )
    `)
    .order("created_at", { ascending: false });

  if (filtroEstado && filtroEstado !== "todas") {
    query = query.eq("estado", filtroEstado);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[analizadorApi] Error trayendo solicitudes admin:", error);
    return { data: [], error: error.message };
  }

  // Aplanar datos del cliente
  const aplanado: SolicitudAnalisisExtra[] = (data ?? []).map((row: any) => ({
    ...row,
    cliente_nombre: row.perfiles_clientes?.full_name ?? null,
    cliente_telefono: row.perfiles_clientes?.phone ?? null,
    cliente_email: row.perfiles_clientes?.email ?? null,
  }));

  return { data: aplanado, error: null };
}

/**
 * Cuenta cuántas solicitudes pendientes hay (para badge en sidebar admin).
 */
export async function contarSolicitudesPendientes(): Promise<number> {
  const { count, error } = await supabase
    .from("solicitudes_analisis_extra")
    .select("*", { count: "exact", head: true })
    .eq("estado", "pendiente");

  if (error) {
    console.error("[analizadorApi] Error contando pendientes:", error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Aprueba una solicitud:
 * 1) Actualiza el estado a 'aprobada'
 * 2) Suma ANALISIS_EXTRA_POR_APROBACION a perfiles_clientes.analisis_extra_otorgados
 * 3) Crea notificación al cliente
 */
export async function aprobarSolicitud(
  solicitudId: string,
  clienteId: string,
  adminId: string,
  notaAdmin?: string
): Promise<{ data: SolicitudAnalisisExtra | null; error: string | null }> {
  const cantidad = ANALISIS_EXTRA_POR_APROBACION;

  // 1) Marcar solicitud como aprobada
  const { data: solicitud, error: errSolic } = await supabase
    .from("solicitudes_analisis_extra")
    .update({
      estado: "aprobada",
      analisis_otorgados: cantidad,
      respondido_por: adminId,
      respondido_at: new Date().toISOString(),
      nota_admin: notaAdmin?.trim() || null,
    })
    .eq("id", solicitudId)
    .eq("estado", "pendiente")
    .select()
    .single();

  if (errSolic || !solicitud) {
    console.error("[analizadorApi] Error aprobando solicitud:", errSolic);
    return {
      data: null,
      error: errSolic?.message ?? "No se pudo aprobar la solicitud.",
    };
  }

  // 2) Traer extras actuales del cliente
  const extrasActuales = await getAnalisisExtraOtorgados(clienteId);

  // 3) Sumarle los nuevos
  const { error: errPerfil } = await supabase
    .from("perfiles_clientes")
    .update({ analisis_extra_otorgados: extrasActuales + cantidad })
    .eq("id", clienteId);

  if (errPerfil) {
    console.error("[analizadorApi] Error sumando extras al perfil:", errPerfil);
    return {
      data: solicitud as SolicitudAnalisisExtra,
      error: "Solicitud aprobada pero falló al sumar análisis al cliente.",
    };
  }

  // 4) Crear notificación al cliente (no bloqueante)
  try {
    await supabase.from("notificaciones_cliente").insert({
      cliente_id: clienteId,
      tipo: "analisis_extra_aprobado",
      titulo: `¡Te aprobamos ${cantidad} análisis más!`,
      mensaje:
        notaAdmin?.trim() ||
        `Ya podés usar ${cantidad} análisis de piel adicionales en el portal.`,
      leida: false,
    });
  } catch (e) {
    console.warn("[analizadorApi] No se pudo crear notificación:", e);
  }

  return { data: solicitud as SolicitudAnalisisExtra, error: null };
}

/**
 * Rechaza una solicitud (no suma análisis, solo cambia estado).
 */
export async function rechazarSolicitud(
  solicitudId: string,
  clienteId: string,
  adminId: string,
  notaAdmin?: string
): Promise<{ data: SolicitudAnalisisExtra | null; error: string | null }> {
  const { data, error } = await supabase
    .from("solicitudes_analisis_extra")
    .update({
      estado: "rechazada",
      respondido_por: adminId,
      respondido_at: new Date().toISOString(),
      nota_admin: notaAdmin?.trim() || null,
    })
    .eq("id", solicitudId)
    .eq("estado", "pendiente")
    .select()
    .single();

  if (error || !data) {
    console.error("[analizadorApi] Error rechazando solicitud:", error);
    return {
      data: null,
      error: error?.message ?? "No se pudo rechazar la solicitud.",
    };
  }

  // Notificación al cliente
  try {
    await supabase.from("notificaciones_cliente").insert({
      cliente_id: clienteId,
      tipo: "analisis_extra_rechazado",
      titulo: "Solicitud de análisis no aprobada",
      mensaje:
        notaAdmin?.trim() ||
        "Tu solicitud de análisis adicionales no fue aprobada en este momento. Podés consultarnos por WhatsApp.",
      leida: false,
    });
  } catch (e) {
    console.warn("[analizadorApi] No se pudo crear notificación:", e);
  }

  return { data: data as SolicitudAnalisisExtra, error: null };
}