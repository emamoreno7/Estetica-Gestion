// src/features/portal/components/CapturaFoto.tsx
import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Upload, X, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import type { ZonaCuerpo } from '@/lib/analizadorApi';

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  zona: ZonaCuerpo;
  errorMensaje: string | null;
  onFotoCapturada: (foto: File) => Promise<void>;
  onVolver: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ZONA_TIPS: Record<ZonaCuerpo, string> = {
  rostro: 'Buena luz frontal, sin maquillaje si es posible. Mirá directo a la cámara.',
  cuello: 'Foto de perfil o 3/4. Asegurate de que el cuello esté despejado.',
  escote: 'Foto desde arriba con buena iluminación. Ropa que deje el escote visible.',
  espalda: 'Pedile a alguien que te saque la foto. Espalda descubierta.',
  brazos: 'Extendé el brazo y fotografiá la zona de interés.',
  abdomen: 'Foto de frente con buena luz. Evitá ropa ajustada.',
  piernas: 'Foto de frente o de lado según la zona. Buena iluminación.',
  manos: 'Foto del dorso de la mano con luz natural. Palma hacia abajo.',
};

const ZONA_LABELS: Record<ZonaCuerpo, string> = {
  rostro: 'Rostro',
  cuello: 'Cuello',
  escote: 'Escote',
  espalda: 'Espalda',
  brazos: 'Brazos',
  abdomen: 'Abdomen',
  piernas: 'Piernas',
  manos: 'Manos',
};

const MAX_SIZE_MB = 8;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// ─── Componente ──────────────────────────────────────────────────────────────

export function CapturaFoto({ zona, errorMensaje, onFotoCapturada, onVolver }: Props) {
  const inputCamaraRef = useRef<HTMLInputElement>(null);
  const inputGaleriaRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // ── Validar y previsualizar imagen ────────────────────────────────────
  const procesarArchivo = useCallback((file: File) => {
    setErrorLocal(null);

    // Validar tipo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!tiposPermitidos.includes(file.type)) {
      setErrorLocal('Solo se aceptan imágenes JPG, PNG o WebP.');
      return;
    }

    // Validar tamaño
    if (file.size > MAX_SIZE_BYTES) {
      setErrorLocal(`La imagen es muy grande. Máximo ${MAX_SIZE_MB}MB.`);
      return;
    }

    // Generar preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    setArchivoSeleccionado(file);
  }, []);

  // ── Handler de input ──────────────────────────────────────────────────
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    procesarArchivo(file);
    // Resetear input para permitir re-selección del mismo archivo
    e.target.value = '';
  }

  // ── Limpiar selección ─────────────────────────────────────────────────
  function limpiarSeleccion() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setArchivoSeleccionado(null);
    setErrorLocal(null);
  }

  // ── Enviar para análisis ──────────────────────────────────────────────
  async function handleEnviar() {
    if (!archivoSeleccionado || enviando) return;
    setEnviando(true);
    await onFotoCapturada(archivoSeleccionado);
    // No reseteamos enviando acá — el padre cambia el paso
  }

  const errorMostrado = errorLocal ?? errorMensaje;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onVolver}
          disabled={enviando}
          className="flex h-9 w-9 items-center justify-center rounded-2xl disabled:opacity-40"
          style={{
            background: 'rgba(0,61,91,0.07)',
            border: '1px solid rgba(0,61,91,0.12)',
          }}
        >
          <ArrowLeft className="h-4 w-4" style={{ color: 'var(--primary-navy)' }} />
        </motion.button>
        <div>
          <h3
            className="text-serif-premium text-lg font-bold"
            style={{ color: 'var(--primary-navy)' }}
          >
            Foto de {ZONA_LABELS[zona]}
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Usá cámara o subí desde tu galería
          </p>
        </div>
      </div>

      {/* Tip de zona */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 rounded-2xl px-4 py-3"
        style={{
          background: 'rgba(191,201,162,0.2)',
          border: '1px solid rgba(191,201,162,0.4)',
        }}
      >
        <span className="text-lg">💡</span>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--primary-navy)' }}>
          <span className="font-semibold">Consejo: </span>
          {ZONA_TIPS[zona]}
        </p>
      </motion.div>

      {/* Área de captura / preview */}
      <AnimatePresence mode="wait">
        {!preview ? (
          /* ── Sin foto seleccionada ── */
          <motion.div
            key="sin-foto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Botón cámara (nativa en móvil) */}
            <motion.button
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => inputCamaraRef.current?.click()}
              className="flex w-full items-center justify-center gap-3 rounded-3xl px-6 py-6 text-white"
              style={{
                background: 'linear-gradient(135deg, #003D5B, #005580)',
                boxShadow: '0 12px 36px rgba(0,61,91,0.22)',
              }}
            >
              <Camera className="h-6 w-6" />
              <span className="text-base font-semibold">Sacar foto ahora</span>
            </motion.button>

            {/* Input oculto — cámara nativa */}
            <input
              ref={inputCamaraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleInputChange}
            />

            {/* Separador */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: 'rgba(0,61,91,0.1)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                o
              </span>
              <div className="h-px flex-1" style={{ background: 'rgba(0,61,91,0.1)' }} />
            </div>

            {/* Botón galería */}
            <motion.button
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => inputGaleriaRef.current?.click()}
              className="flex w-full items-center justify-center gap-3 rounded-3xl px-6 py-5"
              style={{
                background: 'rgba(253,248,245,0.95)',
                border: '1px solid var(--accent-rose)',
                boxShadow: '0 8px 24px rgba(0,61,91,0.07)',
              }}
            >
              <Upload className="h-5 w-5" style={{ color: 'var(--primary-navy)' }} />
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--primary-navy)' }}
              >
                Elegir desde galería
              </span>
            </motion.button>

            {/* Input oculto — galería */}
            <input
              ref={inputGaleriaRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />

            {/* Zona drag & drop visual (escritorio) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="hidden rounded-3xl border-2 border-dashed py-10 text-center sm:block"
              style={{ borderColor: 'rgba(0,61,91,0.15)' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) procesarArchivo(file);
              }}
            >
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                También podés arrastrar una imagen acá
              </p>
              <p className="mt-1 text-xs" style={{ color: 'rgba(122,116,110,0.6)' }}>
                JPG, PNG o WebP · Máximo {MAX_SIZE_MB}MB
              </p>
            </motion.div>
          </motion.div>
        ) : (
          /* ── Con foto seleccionada ── */
          <motion.div
            key="con-foto"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Preview */}
            <div
              className="relative overflow-hidden rounded-3xl"
              style={{
                border: '2px solid var(--accent-rose)',
                boxShadow: '0 12px 40px rgba(0,61,91,0.12)',
              }}
            >
              <img
                src={preview}
                alt="Vista previa"
                className="w-full object-cover"
                style={{ maxHeight: '320px' }}
              />

              {/* Botón eliminar */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={limpiarSeleccion}
                disabled={enviando}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-40"
                style={{
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <X className="h-4 w-4 text-white" />
              </motion.button>

              {/* Badge zona */}
              <div
                className="absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ background: 'rgba(0,61,91,0.75)', backdropFilter: 'blur(8px)' }}
              >
                📍 {ZONA_LABELS[zona]}
              </div>
            </div>

            {/* Checkmark de foto lista */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{
                background: 'rgba(191,201,162,0.2)',
                border: '1px solid rgba(191,201,162,0.4)',
              }}
            >
              <CheckCircle className="h-5 w-5 flex-shrink-0" style={{ color: '#4a7c2a' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--primary-navy)' }}>
                  Foto lista para analizar
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {archivoSeleccionado
                    ? `${(archivoSeleccionado.size / 1024 / 1024).toFixed(1)} MB · ${archivoSeleccionado.type.split('/')[1].toUpperCase()}`
                    : ''}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={limpiarSeleccion}
                disabled={enviando}
                className="ml-auto flex items-center gap-1 text-xs disabled:opacity-40"
                style={{ color: 'var(--text-muted)' }}
              >
                <RefreshCw className="h-3 w-3" />
                Cambiar
              </motion.button>
            </motion.div>

            {/* Botón analizar */}
            <motion.button
              whileHover={{ scale: enviando ? 1 : 1.02, y: enviando ? 0 : -2 }}
              whileTap={{ scale: enviando ? 1 : 0.98 }}
              onClick={handleEnviar}
              disabled={enviando}
              className="flex w-full items-center justify-center gap-3 rounded-3xl px-6 py-5 text-white disabled:opacity-70"
              style={{
                background: enviando
                  ? 'rgba(0,61,91,0.5)'
                  : 'linear-gradient(135deg, #003D5B, #005580)',
                boxShadow: enviando ? 'none' : '0 12px 36px rgba(0,61,91,0.25)',
                cursor: enviando ? 'not-allowed' : 'pointer',
              }}
            >
              {enviando ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                  />
                  <span className="text-base font-semibold">Enviando...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span>
                  <span className="text-base font-semibold">Analizar con IA</span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {errorMostrado && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 rounded-2xl px-4 py-3"
            style={{
              background: 'rgba(242,215,213,0.4)',
              border: '1px solid rgba(242,215,213,0.8)',
            }}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#8B3A3A' }} />
            <p className="text-sm" style={{ color: '#8B3A3A' }}>
              {errorMostrado}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nota privacidad */}
      <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        🔒 Tu imagen se envía de forma encriptada y no se guarda en ningún servidor
      </p>
    </div>
  );
}