// src/features/portal/views/AnalizadorView.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Camera, History, Lock, ChevronRight, RotateCcw } from 'lucide-react';
import { usePortalCliente } from '@/context/PortalClienteContext';
import { SelectorZona } from '../components/SelectorZona';
import { CapturaFoto } from '../components/CapturaFoto';
import { ResultadoAnalisis } from '../components/ResultadoAnalisis';
import {
  analizarZona,
  guardarAnalisis,
  getAnalisisUsadosPorCliente,
  getHistorialAnalisis,
  puedeAnalizarRegistrado,
  LIMITES_ANALISIS,
  type ZonaCuerpo,
  type ResultadoAnalisisIA,
  type AnalisisRealizado,
} from '@/lib/analizadorApi';
import { useAuth } from '@/context/AuthContext';

// ─── Tipos de paso del flujo ────────────────────────────────────────────────

type Paso = 'intro' | 'zona' | 'foto' | 'analizando' | 'resultado' | 'limite';

// ─── Componente principal ────────────────────────────────────────────────────

export function AnalizadorView() {
  const { greetingName } = usePortalCliente();
  const { session } = useAuth();

  const [paso, setPaso] = useState<Paso>('intro');
  const [zonaSeleccionada, setZonaSeleccionada] = useState<ZonaCuerpo | null>(null);
  const [imagenCapturada, setImagenCapturada] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ResultadoAnalisisIA | null>(null);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [analisisUsados, setAnalisisUsados] = useState(0);
  const [historial, setHistorial] = useState<AnalisisRealizado[]>([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // ── Cargar cantidad de análisis usados al montar ────────────────────────
  useEffect(() => {
    if (!session?.user) return;
    void getAnalisisUsadosPorCliente(session.user.id).then(setAnalisisUsados);
  }, [session?.user]);

  // ── Cargar historial ────────────────────────────────────────────────────
  async function cargarHistorial() {
    if (!session?.user) return;
    setLoadingHistorial(true);
    const { data } = await getHistorialAnalisis(session.user.id);
    setHistorial(data);
    setLoadingHistorial(false);
  }

  // ── Flujo: zona seleccionada → ir a foto ───────────────────────────────
  function handleZonaSeleccionada(zona: ZonaCuerpo) {
    setZonaSeleccionada(zona);
    setPaso('foto');
  }

  // ── Flujo: foto capturada → analizar ───────────────────────────────────
  async function handleFotoCapturada(foto: File) {
    if (!zonaSeleccionada) return;

    // Verificar límite antes de analizar
    if (!puedeAnalizarRegistrado(analisisUsados)) {
      setPaso('limite');
      return;
    }

    setImagenCapturada(foto);
    setErrorMensaje(null);
    setPaso('analizando');

    const { data, error } = await analizarZona(zonaSeleccionada, foto);

    if (error || !data) {
      setErrorMensaje(error?.mensaje ?? 'Error desconocido. Intentá de nuevo.');
      setPaso('foto');
      return;
    }

    setResultado(data);

    // Guardar en DB si está logueado
    if (session?.user) {
      await guardarAnalisis(session.user.id, zonaSeleccionada, data);
      const nuevaCantidad = await getAnalisisUsadosPorCliente(session.user.id);
      setAnalisisUsados(nuevaCantidad);
    }

    setPaso('resultado');
  }

  // ── Flujo: reiniciar ───────────────────────────────────────────────────
  function reiniciar() {
    setZonaSeleccionada(null);
    setImagenCapturada(null);
    setResultado(null);
    setErrorMensaje(null);
    setPaso('intro');
  }

  // ── Renders por paso ───────────────────────────────────────────────────
  const analisisRestantes = LIMITES_ANALISIS.registrado - analisisUsados;
  const puedeAnalizar = analisisRestantes > 0;

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl lg:p-8"
        style={{
          background: 'linear-gradient(135deg, #003D5B 0%, #005580 55%, #004D72 100%)',
          boxShadow: '0 24px 64px rgba(0,61,91,0.28)',
        }}
      >
        <div
          className="absolute -right-12 -top-12 h-48 w-48 rounded-full"
          style={{ background: 'rgba(242,215,213,0.12)' }}
        />
        <div
          className="absolute -bottom-10 right-24 h-28 w-28 rounded-full"
          style={{ background: 'rgba(191,201,162,0.10)' }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 6 }}
        />

        <div className="relative">
          <p
            className="mb-1 text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: 'rgba(242,215,213,0.85)' }}
          >
            Tecnología Amore · IA
          </p>
          <h2 className="text-serif-premium mb-2 text-2xl font-bold text-white lg:text-3xl">
            Analizador de Piel
          </h2>
          <p className="max-w-xl text-sm leading-relaxed" style={{ color: 'rgba(253,248,245,0.85)' }}>
            Hola {greetingName}, sacate una foto de la zona que querés mejorar y nuestra IA
            te recomendará el tratamiento ideal del catálogo Amore.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm"
              style={{
                background: puedeAnalizar ? 'rgba(191,201,162,0.22)' : 'rgba(242,215,213,0.22)',
                border: puedeAnalizar
                  ? '1px solid rgba(191,201,162,0.35)'
                  : '1px solid rgba(242,215,213,0.35)',
              }}
            >
              <Sparkles className="h-4 w-4" style={{ color: puedeAnalizar ? '#BFC9A2' : '#F2D7D5' }} />
              <span className="text-sm font-medium text-white">
                {puedeAnalizar
                  ? `${analisisRestantes} análisis disponible${analisisRestantes !== 1 ? 's' : ''}`
                  : 'Límite alcanzado'}
              </span>
            </div>

            {analisisUsados > 0 && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setMostrarHistorial(!mostrarHistorial);
                  if (!mostrarHistorial) void cargarHistorial();
                }}
                className="flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm text-sm font-medium text-white"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <History className="h-4 w-4" />
                Mis análisis
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Historial colapsable ─────────────────────────────────────── */}
      <AnimatePresence>
        {mostrarHistorial && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-3xl"
            style={{
              background: 'rgba(253,248,245,0.92)',
              border: '1px solid var(--accent-rose)',
              boxShadow: '0 12px 40px rgba(0,61,91,0.08)',
            }}
          >
            <div className="p-6">
              <h3
                className="text-serif-premium mb-4 text-lg font-bold"
                style={{ color: 'var(--primary-navy)' }}
              >
                Historial de análisis
              </h3>

              {loadingHistorial ? (
                <div className="flex items-center justify-center py-8">
                  <div
                    className="h-8 w-8 animate-spin rounded-full border-2"
                    style={{ borderColor: 'var(--primary-navy)', borderTopColor: 'transparent' }}
                  />
                </div>
              ) : historial.length === 0 ? (
                <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No hay análisis previos registrados.
                </p>
              ) : (
                <div className="space-y-3">
                  {historial.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl p-4"
                      style={{
                        background: 'rgba(0,61,91,0.04)',
                        border: '1px solid rgba(0,61,91,0.08)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                          style={{ background: 'rgba(242,215,213,0.4)' }}
                        >
                          {zonaEmoji(item.zona)}
                        </div>
                        <div>
                          <p
                            className="text-sm font-semibold capitalize"
                            style={{ color: 'var(--primary-navy)' }}
                          >
                            {item.zona}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {item.resultado.tratamiento_recomendado}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString('es-AR', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : '—'}
                        </p>
                        <span
                          className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                          style={{
                            background: urgenciaColor(item.resultado.nivel_urgencia).bg,
                            color: urgenciaColor(item.resultado.nivel_urgencia).text,
                          }}
                        >
                          {item.resultado.nivel_urgencia}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Contenido principal por paso ────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* INTRO */}
        {paso === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-4">
              {[
                { num: '1', icon: '📍', label: 'Elegí la zona' },
                { num: '2', icon: '📷', label: 'Sacate una foto' },
                { num: '3', icon: '✨', label: 'Recibí tu análisis' },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-3xl p-4 text-center"
                  style={{
                    background: 'rgba(253,248,245,0.92)',
                    border: '1px solid var(--accent-rose)',
                    boxShadow: '0 8px 32px rgba(0,61,91,0.07)',
                  }}
                >
                  <div className="mb-2 text-2xl">{step.icon}</div>
                  <div
                    className="mb-1 text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'var(--primary-navy)' }}
                  >
                    Paso {step.num}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {step.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {puedeAnalizar ? (
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaso('zona')}
                className="flex w-full items-center justify-center gap-3 rounded-3xl px-6 py-5 text-base font-semibold text-white shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #003D5B, #005580)',
                  boxShadow: '0 16px 48px rgba(0,61,91,0.25)',
                }}
              >
                <Camera className="h-5 w-5" />
                Empezar análisis
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            ) : (
              <LimiteAlcanzado />
            )}

            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              🔒 Tu foto se procesa de forma segura y no se almacena en ningún servidor.
            </p>
          </motion.div>
        )}

        {/* SELECTOR DE ZONA */}
        {paso === 'zona' && (
          <motion.div
            key="zona"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
          >
            <SelectorZona
              onSeleccionar={handleZonaSeleccionada}
              onVolver={() => setPaso('intro')}
            />
          </motion.div>
        )}

        {/* CAPTURA DE FOTO */}
        {paso === 'foto' && zonaSeleccionada && (
          <motion.div
            key="foto"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
          >
            <CapturaFoto
              zona={zonaSeleccionada}
              errorMensaje={errorMensaje}
              onFotoCapturada={handleFotoCapturada}
              onVolver={() => setPaso('zona')}
            />
          </motion.div>
        )}

        {/* ANALIZANDO */}
        {paso === 'analizando' && (
          <motion.div
            key="analizando"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-3xl px-6 py-20 text-center"
            style={{
              background: 'rgba(253,248,245,0.92)',
              border: '1px solid var(--accent-rose)',
              boxShadow: '0 12px 40px rgba(0,61,91,0.08)',
            }}
          >
            <div className="relative mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="h-20 w-20 rounded-full border-4"
                style={{ borderColor: 'var(--accent-rose)', borderTopColor: 'transparent' }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2 rounded-full border-2"
                style={{ borderColor: 'var(--primary-navy)', borderBottomColor: 'transparent' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-7 w-7" style={{ color: 'var(--primary-navy)' }} />
              </div>
            </div>

            <h3
              className="text-serif-premium mb-2 text-xl font-bold"
              style={{ color: 'var(--primary-navy)' }}
            >
              Analizando tu piel
            </h3>
            <p className="max-w-xs text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Nuestra IA está evaluando{' '}
              <span className="font-semibold capitalize">{zonaSeleccionada}</span> y buscando
              el tratamiento ideal para vos...
            </p>

            <div className="mt-8 w-full max-w-xs space-y-2 text-left">
              {[
                'Procesando imagen...',
                'Detectando características de piel...',
                'Consultando catálogo Amore...',
                'Generando recomendación personalizada...',
              ].map((label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.6 }}
                  className="flex items-center gap-3"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.6 + 0.3 }}
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: 'var(--accent-sage)' }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* RESULTADO */}
        {paso === 'resultado' && resultado && zonaSeleccionada && (
          <motion.div
            key="resultado"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <ResultadoAnalisis
              resultado={resultado}
              zona={zonaSeleccionada}
              imagenCapturada={imagenCapturada}
              onReiniciar={reiniciar}
              analisisRestantes={analisisRestantes - 1}
              puedeAnalizar={puedeAnalizar && analisisRestantes > 1}
            />
          </motion.div>
        )}

        {/* LÍMITE ALCANZADO */}
        {paso === 'limite' && (
          <motion.div
            key="limite"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <LimiteAlcanzado onReiniciar={reiniciar} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

// ─── Sub-componente: Límite alcanzado ────────────────────────────────────────

function LimiteAlcanzado({ onReiniciar }: { onReiniciar?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-8 text-center"
      style={{
        background: 'rgba(253,248,245,0.92)',
        border: '1px solid var(--accent-rose)',
        boxShadow: '0 12px 40px rgba(0,61,91,0.08)',
      }}
    >
      <div
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'rgba(242,215,213,0.4)' }}
      >
        <Lock className="h-7 w-7" style={{ color: 'var(--primary-navy)' }} />
      </div>
      <h3
        className="text-serif-premium mb-2 text-xl font-bold"
        style={{ color: 'var(--primary-navy)' }}
      >
        Usaste tus {LIMITES_ANALISIS.registrado} análisis gratuitos
      </h3>
      <p
        className="mx-auto mb-6 max-w-sm text-sm leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        Para recibir un análisis personalizado más profundo y una consulta con nuestras
        especialistas, visitanos en sede o escribinos por WhatsApp.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <motion.a
          href="https://wa.me/5491100000000?text=Hola%20Amore!%20Quiero%20agendar%20una%20consulta%20de%20piel"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white"
          style={{ background: '#25D366', boxShadow: '0 8px 24px rgba(37,211,102,0.25)' }}
        >
          💬 Consulta por WhatsApp
        </motion.a>
        {onReiniciar && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReiniciar}
            className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
            style={{
              color: 'var(--primary-navy)',
              border: '1px solid rgba(0,61,91,0.2)',
              background: 'white',
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Volver al inicio
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Helpers visuales ────────────────────────────────────────────────────────

function zonaEmoji(zona: ZonaCuerpo): string {
  const map: Record<ZonaCuerpo, string> = {
    rostro: '😊',
    cuello: '🦢',
    escote: '✨',
    espalda: '🔙',
    brazos: '💪',
    abdomen: '🌟',
    piernas: '🦵',
    manos: '🤲',
  };
  return map[zona] ?? '📍';
}

function urgenciaColor(nivel: 'bajo' | 'medio' | 'alto'): { bg: string; text: string } {
  const map = {
    bajo: { bg: 'rgba(191,201,162,0.3)', text: '#4a5e2a' },
    medio: { bg: 'rgba(184,149,110,0.2)', text: '#7a5a2a' },
    alto: { bg: 'rgba(242,215,213,0.5)', text: '#8B3A3A' },
  };
  return map[nivel] ?? map.bajo;
}