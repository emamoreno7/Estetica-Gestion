// src/lib/analizadorApi.ts
// API del Analizador de Piel con IA — Amore Centro Di Bellezza

// ─── Constantes ─────────────────────────────────────────────────────────────

const EDGE_FUNCTION_URL =
  "https://atbbbhpbexrtnlbvvzjb.supabase.co/functions/v1/analizar-zona";

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/** Máximo de análisis permitidos según estado del usuario */
export const LIMITES_ANALISIS = {
  anonimo: 1,
  registrado: 3,
} as const;

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

/**
 * Tipos de error que puede devolver el analizador.
 * - imagen_no_valida: la foto no muestra piel humana / es un objeto / etc
 * - imagen_baja_calidad: borrosa, oscura, pixelada
 * - zona_no_coincide: el usuario eligió rostro pero subió mano (por ej)
 * - limite_anonimo / limite_registrado: superó la cuota
 * - red: sin conexión o error HTTP
 * - desconocido: cualquier otro caso
 */
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

export function puedeAnalizarRegistrado(analisisUsadosEnDB: number): boolean {
  return analisisUsadosEnDB < LIMITES_ANALISIS.registrado;
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

    // ── Manejo de errores con respuesta JSON estructurada ────────────
    if (!response.ok) {
      let errorJson: { codigo?: string; mensaje?: string; error?: string } = {};
      try {
        errorJson = await response.json();
      } catch {
        // No es JSON, fallback al texto
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

      // Si tiene código específico, mapearlo
      if (errorJson.codigo) {
        return {
          data: null,
          error: mapearErrorBackend(
            errorJson.codigo,
            errorJson.mensaje ?? errorJson.error ?? ""
          ),
        };
      }

      // Sin código → error de red genérico
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

    // ── Respuesta OK → parsear resultado ─────────────────────────────
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

import { supabase } from "./supabaseClient";

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

import {
  CITAS_SERVICIOS_RESERVABLES,
  type ServicioReservable,
} from './citasConstants';

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