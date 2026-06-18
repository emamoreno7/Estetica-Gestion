// src/features/portal/views/AnalizadorView.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Camera,
  History,
  Lock,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  ImageOff,
  Send,
  Clock,
  X,
  CheckCircle2,
} from 'lucide-react';
import { usePortalCliente } from '@/context/PortalClienteContext';
import { SelectorZona } from '../components/SelectorZona';
import { CapturaFoto } from '../components/CapturaFoto';
import { ResultadoAnalisis } from '../components/ResultadoAnalisis';
import {
  analizarZona,
  guardarAnalisis,
  getAnalisisUsadosPorCliente,
  getHistorialAnalisis,
  puedeAnalizarRegistradoConExtras,
  getAnalisisExtraOtorgados,
  getSolicitudPendienteCliente,
  crearSolicitudAnalisisExtra,
  LIMITES_ANALISIS,
  type ZonaCuerpo,
  type ResultadoAnalisisIA,
  type AnalisisRealizado,
  type ErrorAnalisis,
  type SolicitudAnalisisExtra,
} from '@/lib/analizadorApi';
import type { ServicioReservable } from '@/lib/citasConstants';
import { useAuth } from '@/context/AuthContext';

// ─── Tipos de paso del flujo ────────────────────────────────────────────────

type Paso = 'intro' | 'zona' | 'foto' | 'analizando' | 'resultado' | 'rechazo' | 'limite';

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  onReservarServicio?: (servicio: ServicioReservable) => void;
}

// ─── Componente principal ────────────────────────────────────────────────────

export function AnalizadorView({ onReservarServicio }: Props) {
  const { greetingName } = usePortalCliente();
  const { session } = useAuth();

  const [paso, setPaso] = useState<Paso>('intro');
  const [zonaSeleccionada, setZonaSeleccionada] = useState<ZonaCuerpo | null>(null);
  const [imagenCapturada, setImagenCapturada] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ResultadoAnalisisIA | null>(null);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [errorRechazo, setErrorRechazo] = useState<ErrorAnalisis | null>(null);
  const [analisisUsados, setAnalisisUsados] = useState(0);
  const [analisisExtra, setAnalisisExtra] = useState(0);
  const [solicitudPendiente, setSolicitudPendiente] = useState<SolicitudAnalisisExtra | null>(null);
  const [historial, setHistorial] = useState<AnalisisRealizado[]>([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // ── Cargar datos del usuario al montar ──────────────────────────────────
  useEffect(() => {
    if (!session?.user) return;
    void cargarDatosUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user]);

  async function cargarDatosUsuario() {
    if (!session?.user) return;
    const [usados, extras, { data: pendiente }] = await Promise.all([
      getAnalisisUsadosPorCliente(session.user.id),
      getAnalisisExtraOtorgados(session.user.id),
      getSolicitudPendienteCliente(session.user.id),
    ]);
    setAnalisisUsados(usados);
    setAnalisisExtra(extras);
    setSolicitudPendiente(pendiente);
  }

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

    if (!puedeAnalizarRegistradoConExtras(analisisUsados, analisisExtra)) {
      setPaso('limite');
      return;
    }

    setImagenCapturada(foto);
    setErrorMensaje(null);
    setErrorRechazo(null);
    setPaso('analizando');

    const { data, error } = await analizarZona(zonaSeleccionada, foto);

    if (error || !data) {
      const tiposRechazo: ErrorAnalisis['tipo'][] = [
        'imagen_no_valida',
        'imagen_baja_calidad',
        'zona_no_coincide',
      ];

      if (error && tiposRechazo.includes(error.tipo)) {
        setErrorRechazo(error);
        setPaso('rechazo');
      } else {
        setErrorMensaje(error?.mensaje ?? 'Error desconocido. Intentá de nuevo.');
        setPaso('foto');
      }
      return;
    }

    setResultado(data);

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
    setErrorRechazo(null);
    setPaso('intro');
  }

  function reintentarFoto() {
    setErrorMensaje(null);
    setErrorRechazo(null);
    setImagenCapturada(null);
    setPaso('foto');
  }

  function cambiarZona() {
    setErrorMensaje(null);
    setErrorRechazo(null);
    setImagenCapturada(null);
    setZonaSeleccionada(null);
    setPaso('zona');
  }

  function handleReservar(servicio: ServicioReservable) {
    onReservarServicio?.(servicio);
  }

  // ── Calcular límite total y restantes (base + extras) ──────────────────
  const limiteTotal = LIMITES_ANALISIS.registrado + analisisExtra;
  const analisisRestantes = Math.max(0, limiteTotal - analisisUsados);
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
              {analisisExtra > 0 && (
                <span
                  className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: 'rgba(255,255,255,0.18)' }}
                >
                  +{analisisExtra} extra
                </span>
              )}
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
              <LimiteAlcanzado
                clienteId={session?.user?.id ?? null}
                solicitudPendiente={solicitudPendiente}
                onSolicitudCreada={(s) => setSolicitudPendiente(s)}
                onReiniciar={reiniciar}
              />
            )}

            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              🔒 Tu foto se procesa de forma segura y no se almacena en ningún servidor.
            </p>
          </motion.div>
        )}

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
                'Validando imagen...',
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
              onReservar={handleReservar}
              analisisRestantes={analisisRestantes - 1}
              puedeAnalizar={puedeAnalizar && analisisRestantes > 1}
            />
          </motion.div>
        )}

        {paso === 'rechazo' && errorRechazo && (
          <motion.div
            key="rechazo"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <ImagenRechazada
              error={errorRechazo}
              zona={zonaSeleccionada}
              onReintentar={reintentarFoto}
              onCambiarZona={cambiarZona}
              onVolverInicio={reiniciar}
            />
          </motion.div>
        )}

        {paso === 'limite' && (
          <motion.div
            key="limite"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <LimiteAlcanzado
              clienteId={session?.user?.id ?? null}
              solicitudPendiente={solicitudPendiente}
              onSolicitudCreada={(s) => setSolicitudPendiente(s)}
              onReiniciar={reiniciar}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

// ─── Sub-componente: Imagen rechazada ────────────────────────────────────────

function ImagenRechazada({
  error,
  zona,
  onReintentar,
  onCambiarZona,
  onVolverInicio,
}: {
  error: ErrorAnalisis;
  zona: ZonaCuerpo | null;
  onReintentar: () => void;
  onCambiarZona: () => void;
  onVolverInicio: () => void;
}) {
  const { titulo, descripcion, sugerencias, icon: Icon, color } = getRechazoConfig(error.tipo);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl"
      style={{
        background: 'rgba(253,248,245,0.95)',
        border: '1px solid var(--accent-rose)',
        boxShadow: '0 16px 48px rgba(0,61,91,0.10)',
      }}
    >
      <div
        className="h-2 w-full"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
      />

      <div className="p-6 lg:p-8">
        <div className="mb-5 flex justify-center">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl"
            style={{
              background: `${color}22`,
              border: `1.5px solid ${color}55`,
            }}
          >
            <Icon className="h-9 w-9" style={{ color }} />
          </motion.div>
        </div>

        <h3
          className="text-serif-premium mb-2 text-center text-xl font-bold lg:text-2xl"
          style={{ color: 'var(--primary-navy)' }}
        >
          {titulo}
        </h3>

        <p
          className="mx-auto mb-4 max-w-md text-center text-sm leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          {error.mensaje || descripcion}
        </p>

        <div
          className="mx-auto mb-6 flex max-w-md items-start gap-2 rounded-2xl p-3"
          style={{
            background: 'rgba(191,201,162,0.18)',
            border: '1px solid rgba(191,201,162,0.4)',
          }}
        >
          <Sparkles
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            style={{ color: '#4a5e2a' }}
          />
          <p className="text-xs leading-relaxed" style={{ color: '#4a5e2a' }}>
            <strong>No descontamos este intento.</strong> Probá de nuevo cuando quieras,
            tus análisis disponibles siguen intactos.
          </p>
        </div>

        <div className="mx-auto mb-6 max-w-md">
          <p
            className="mb-3 text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--primary-navy)' }}
          >
            Consejos para una buena foto:
          </p>
          <ul className="space-y-2">
            {sugerencias.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-start gap-2 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                <span
                  className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ background: 'var(--primary-navy)' }}
                />
                <span>{s}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReintentar}
            className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #003D5B, #005580)',
              boxShadow: '0 10px 28px rgba(0,61,91,0.22)',
            }}
          >
            <Camera className="h-4 w-4" />
            Sacar otra foto
          </motion.button>

          {error.tipo === 'zona_no_coincide' && zona && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCambiarZona}
              className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
              style={{
                color: 'var(--primary-navy)',
                border: '1.5px solid rgba(0,61,91,0.2)',
                background: 'white',
              }}
            >
              Cambiar zona
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onVolverInicio}
            className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
            style={{
              color: 'var(--text-muted)',
              border: '1.5px solid rgba(122,116,110,0.2)',
              background: 'transparent',
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Volver al inicio
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Sub-componente: Límite alcanzado (con solicitud al admin) ──────────────

function LimiteAlcanzado({
  clienteId,
  solicitudPendiente,
  onSolicitudCreada,
  onReiniciar,
}: {
  clienteId: string | null;
  solicitudPendiente: SolicitudAnalisisExtra | null;
  onSolicitudCreada: (s: SolicitudAnalisisExtra) => void;
  onReiniciar?: () => void;
}) {
  const [modalAbierto, setModalAbierto] = useState(false);

  // Si ya tiene solicitud pendiente, mostrar estado de espera
  if (solicitudPendiente) {
    return (
      <SolicitudPendienteCard
        solicitud={solicitudPendiente}
        onReiniciar={onReiniciar}
      />
    );
  }

  return (
    <>
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
          Usaste todos tus análisis disponibles
        </h3>
        <p
          className="mx-auto mb-6 max-w-sm text-sm leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Podés solicitar análisis adicionales a nuestro equipo y te los desbloqueamos
          en el momento, o consultarnos directamente por WhatsApp.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {clienteId && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setModalAbierto(true)}
              className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #003D5B, #005580)',
                boxShadow: '0 10px 28px rgba(0,61,91,0.22)',
              }}
            >
              <Send className="h-4 w-4" />
              Pedir más análisis
            </motion.button>
          )}

          <motion.a
            href="https://wa.me/5491100000000?text=Hola%20Amore!%20Quiero%20agendar%20una%20consulta%20de%20piel"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white"
            style={{ background: '#25D366', boxShadow: '0 8px 24px rgba(37,211,102,0.25)' }}
          >
            💬 WhatsApp
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
              Volver
            </motion.button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {modalAbierto && clienteId && (
          <ModalSolicitarAnalisis
            clienteId={clienteId}
            onClose={() => setModalAbierto(false)}
            onCreada={(s) => {
              onSolicitudCreada(s);
              setModalAbierto(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Sub-componente: Card de solicitud pendiente ────────────────────────────

function SolicitudPendienteCard({
  solicitud,
  onReiniciar,
}: {
  solicitud: SolicitudAnalisisExtra;
  onReiniciar?: () => void;
}) {
  const fecha = new Date(solicitud.created_at).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl"
      style={{
        background: 'rgba(253,248,245,0.95)',
        border: '1px solid var(--accent-rose)',
        boxShadow: '0 16px 48px rgba(0,61,91,0.10)',
      }}
    >
      <div className="h-2 w-full bg-gradient-to-r from-[#B8956E] to-[#D4B896]" />

      <div className="p-6 lg:p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(184,149,110,0.2)', border: '1.5px solid rgba(184,149,110,0.4)' }}
        >
          <Clock className="h-7 w-7" style={{ color: '#B8956E' }} />
        </motion.div>

        <h3
          className="text-serif-premium mb-2 text-xl font-bold"
          style={{ color: 'var(--primary-navy)' }}
        >
          Tu solicitud está en revisión
        </h3>
        <p
          className="mx-auto mb-4 max-w-sm text-sm leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Nuestro equipo revisará tu pedido a la brevedad. Cuando se apruebe vas a recibir
          una notificación y se desbloquearán automáticamente.
        </p>

        {solicitud.mensaje && (
          <div
            className="mx-auto mb-4 max-w-md rounded-2xl p-3 text-left"
            style={{ background: 'rgba(0,61,91,0.04)', border: '1px solid rgba(0,61,91,0.08)' }}
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--primary-navy)' }}>
              Tu mensaje:
            </p>
            <p className="text-xs leading-relaxed italic" style={{ color: 'var(--text-muted)' }}>
              "{solicitud.mensaje}"
            </p>
          </div>
        )}

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Solicitado el <strong>{fecha}</strong>
        </p>

        {onReiniciar && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReiniciar}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
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

// ─── Modal: Solicitar más análisis ──────────────────────────────────────────

function ModalSolicitarAnalisis({
  clienteId,
  onClose,
  onCreada,
}: {
  clienteId: string;
  onClose: () => void;
  onCreada: (s: SolicitudAnalisisExtra) => void;
}) {
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  async function handleEnviar() {
    setEnviando(true);
    setError(null);

    const { data, error: err } = await crearSolicitudAnalisisExtra(clienteId, mensaje);

    if (err || !data) {
      setError(err ?? 'No se pudo crear la solicitud. Intentá de nuevo.');
      setEnviando(false);
      return;
    }

    setExito(true);
    setTimeout(() => {
      onCreada(data);
    }, 1200);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        style={{ boxShadow: '0 24px 64px rgba(0,61,91,0.25)' }}
      >
        {/* Header */}
        <div
          className="relative p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #003D5B, #005580)' }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-serif-premium text-lg font-bold">Pedir más análisis</h3>
              <p className="text-xs opacity-90">Te respondemos en el día</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {exito ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-6 text-center"
            >
              <div
                className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(191,201,162,0.3)' }}
              >
                <CheckCircle2 className="h-7 w-7" style={{ color: '#4a5e2a' }} />
              </div>
              <h4
                className="text-serif-premium mb-1 text-lg font-bold"
                style={{ color: 'var(--primary-navy)' }}
              >
                ¡Solicitud enviada!
              </h4>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Te avisamos apenas el admin la apruebe.
              </p>
            </motion.div>
          ) : (
            <>
              <p
                className="mb-4 text-sm leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                Contanos brevemente por qué necesitás más análisis (opcional). Esto nos
                ayuda a responderte más rápido.
              </p>

              <label
                className="mb-2 block text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--primary-navy)' }}
              >
                Tu mensaje (opcional)
              </label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                maxLength={300}
                rows={4}
                placeholder="Ej: Quiero analizar mi cuello y mis brazos también..."
                className="w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2"
                style={{
                  borderColor: 'rgba(0,61,91,0.15)',
                  background: 'rgba(253,248,245,0.5)',
                }}
              />
              <p
                className="mt-1 text-right text-[10px]"
                style={{ color: 'var(--text-muted)' }}
              >
                {mensaje.length}/300
              </p>

              {error && (
                <div
                  className="mt-3 flex items-start gap-2 rounded-2xl p-3"
                  style={{
                    background: 'rgba(242,215,213,0.4)',
                    border: '1px solid rgba(139,58,58,0.3)',
                  }}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#8B3A3A' }} />
                  <p className="text-xs leading-relaxed" style={{ color: '#8B3A3A' }}>
                    {error}
                  </p>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  disabled={enviando}
                  className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
                  style={{
                    color: 'var(--primary-navy)',
                    border: '1px solid rgba(0,61,91,0.2)',
                    background: 'white',
                  }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleEnviar}
                  disabled={enviando}
                  className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #003D5B, #005580)',
                    boxShadow: '0 10px 28px rgba(0,61,91,0.22)',
                  }}
                >
                  {enviando ? 'Enviando...' : 'Enviar solicitud'}
                </motion.button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Configuración visual del rechazo según tipo de error ────────────────────

function getRechazoConfig(tipo: ErrorAnalisis['tipo']): {
  titulo: string;
  descripcion: string;
  sugerencias: string[];
  icon: typeof ImageOff;
  color: string;
} {
  switch (tipo) {
    case 'imagen_no_valida':
      return {
        titulo: 'No pudimos analizar la imagen',
        descripcion:
          'La foto no parece mostrar piel humana apta para análisis estético.',
        sugerencias: [
          'Asegurate de que la foto sea de la zona del cuerpo que querés consultar',
          'Evitá enviar imágenes de objetos, paisajes, animales o capturas de pantalla',
          'La zona debe estar bien visible y enfocada',
        ],
        icon: ImageOff,
        color: '#B8956E',
      };

    case 'imagen_baja_calidad':
      return {
        titulo: 'La foto necesita mejor calidad',
        descripcion: 'No pudimos analizar la imagen con la confianza suficiente.',
        sugerencias: [
          'Sacá la foto con buena luz natural (de día, cerca de una ventana)',
          'Acercate más a la zona, que ocupe gran parte de la imagen',
          'Mantené el celular firme para que no salga borrosa',
          'Evitá sombras fuertes y reflejos',
        ],
        icon: AlertTriangle,
        color: '#B8956E',
      };

    case 'zona_no_coincide':
      return {
        titulo: 'La zona no coincide con la foto',
        descripcion:
          'Detectamos una zona del cuerpo distinta a la que seleccionaste.',
        sugerencias: [
          'Verificá que la foto sea de la zona que elegiste',
          'O cambiá la zona seleccionada para que coincida con la imagen',
        ],
        icon: AlertTriangle,
        color: '#003D5B',
      };

    default:
      return {
        titulo: 'No pudimos completar el análisis',
        descripcion: 'Ocurrió un inconveniente al procesar tu foto.',
        sugerencias: [
          'Intentá nuevamente con otra foto',
          'Verificá tu conexión a internet',
        ],
        icon: AlertTriangle,
        color: '#7A746E',
      };
  }
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