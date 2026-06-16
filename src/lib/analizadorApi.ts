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
  diagnostico: string;           // Descripción breve de lo observado
  tratamiento_recomendado: string; // Nombre del servicio del catálogo Amore
  sesiones_recomendadas: number;
  frecuencia: string;            // Ej: "1 vez por semana"
  tips: string[];                // Array de 3-4 consejos
  nivel_urgencia: "bajo" | "medio" | "alto"; // Para colorear UI
}

export interface AnalisisRealizado {
  id?: string;
  cliente_id?: string | null;    // null si es anónimo
  zona: ZonaCuerpo;
  imagen_url?: string | null;
  resultado: ResultadoAnalisisIA;
  created_at?: string;
}

export interface ErrorAnalisis {
  tipo: "limite_anonimo" | "limite_registrado" | "imagen_invalida" | "red" | "desconocido";
  mensaje: string;
}

// ─── Control de límites ──────────────────────────────────────────────────────

/**
 * Devuelve cuántos análisis anónimos se usaron (desde localStorage).
 */
export function getAnalisisAnonimoUsados(): number {
  const raw = localStorage.getItem(LS_KEY_ANONIMO);
  const parsed = parseInt(raw ?? "0", 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Incrementa el contador de análisis anónimos en localStorage.
 */
export function incrementarAnalisisAnonimo(): void {
  const actual = getAnalisisAnonimoUsados();
  localStorage.setItem(LS_KEY_ANONIMO, String(actual + 1));
}

/**
 * Verifica si el usuario (anónimo o registrado) puede hacer un nuevo análisis.
 * Para registrados, recibe la cantidad de análisis ya guardados en DB.
 */
export function puedeAnalizarAnonimo(): boolean {
  return getAnalisisAnonimoUsados() < LIMITES_ANALISIS.anonimo;
}

export function puedeAnalizarRegistrado(analisisUsadosEnDB: number): boolean {
  return analisisUsadosEnDB < LIMITES_ANALISIS.registrado;
}

// ─── Conversión de imagen ────────────────────────────────────────────────────

/**
 * Convierte un File/Blob a base64 (string sin el prefijo data:...;base64,).
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Removemos el prefijo "data:image/jpeg;base64," etc.
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Error al leer la imagen"));
    reader.readAsDataURL(file);
  });
}

/**
 * Detecta el media type de un File para enviarlo correctamente.
 */
export function getMediaType(file: File): string {
  // Normalizamos: si es webp u otro formato, Claude lo acepta igual
  const tipo = file.type || "image/jpeg";
  const permitidos = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  return permitidos.includes(tipo) ? tipo : "image/jpeg";
}

// ─── Llamada principal a la Edge Function ────────────────────────────────────

/**
 * Envía la imagen a la Edge Function y devuelve el análisis de IA.
 *
 * @param zona     - Zona del cuerpo seleccionada
 * @param imagen   - File capturado desde cámara o galería
 * @returns        - { data: ResultadoAnalisisIA } o { error: ErrorAnalisis }
 */
export async function analizarZona(
  zona: ZonaCuerpo,
  imagen: File
): Promise<{ data: ResultadoAnalisisIA | null; error: ErrorAnalisis | null }> {
  try {
    // 1. Convertir imagen a base64
    const imagenBase64 = await fileToBase64(imagen);
    const mediaType = getMediaType(imagen);

    // 2. Construir payload
    const payload = {
      zona,
      imagen_base64: imagenBase64,
      media_type: mediaType,
    };

    // 3. Llamar a la Edge Function
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // La anon key permite el acceso público (JWT verification desactivado)
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    // 4. Manejar errores HTTP
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[analizadorApi] Edge Function error:", response.status, errorBody);
      return {
        data: null,
        error: {
          tipo: "red",
          mensaje: `Error del servidor (${response.status}). Intentá de nuevo.`,
        },
      };
    }

    // 5. Parsear respuesta
    const json = await response.json();

    // La Edge Function devuelve el objeto directamente o dentro de { resultado }
    const resultado: ResultadoAnalisisIA = json.resultado ?? json;

    return { data: resultado, error: null };

  } catch (err) {
    console.error("[analizadorApi] Error inesperado:", err);

    // Error de red (sin conexión, CORS, etc.)
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

// ─── Guardar análisis en Supabase (para usuarios registrados) ────────────────

import { supabase } from "./supabaseClient";

/**
 * Guarda el resultado del análisis en la tabla `analisis_piel`.
 * Solo se llama si el usuario está logueado.
 *
 * @param clienteId  - UUID del cliente autenticado
 * @param zona       - Zona analizada
 * @param resultado  - Resultado devuelto por la IA
 * @returns          - { data: AnalisisRealizado } o { error }
 */
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
      resultado, // Se guarda como JSONB
    })
    .select()
    .single();

  if (error) {
    console.error("[analizadorApi] Error guardando análisis:", error);
    return { data: null, error: error.message };
  }

  return { data: data as AnalisisRealizado, error: null };
}

/**
 * Obtiene la cantidad de análisis que ya usó un cliente registrado.
 */
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

/**
 * Obtiene el historial de análisis de un cliente (últimos 10).
 */
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