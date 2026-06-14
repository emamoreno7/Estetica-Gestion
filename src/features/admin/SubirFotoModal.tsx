import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  ImagePlus,
  Info,
  Loader2,
  Sparkles,
  Trophy,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';
import {
  subirFotoTratamiento,
  type FotoTipo,
  type TratamientoClienteRow,
} from './adminTratamientosApi';
import { insertNotificacion } from '@/lib/notificacionesApi';

const TIPOS_FOTO: { value: FotoTipo; label: string; descripcion: string; icon: React.ReactNode }[] =
  [
    {
      value: 'inicial',
      label: 'Antes',
      descripcion: 'Foto inicial al comenzar el tratamiento',
      icon: <Camera className="h-4 w-4" />,
    },
    {
      value: 'progreso',
      label: 'Progreso',
      descripcion: 'Evolución durante el tratamiento',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      value: 'final',
      label: 'Después',
      descripcion: 'Resultado final al terminar',
      icon: <Trophy className="h-4 w-4" />,
    },
  ];

const MAX_SIZE_MB = 8;

export default function SubirFotoModal(props: {
  tratamiento: TratamientoClienteRow;
  onClose: () => void;
  onUploaded: () => void | Promise<void>;
}) {
  const { tratamiento } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  const [tipo, setTipo] = useState<FotoTipo>('inicial');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [numeroSesion, setNumeroSesion] = useState('');

  const [uploading, setUploading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  function handleFile(f: File | null) {
    setErrMsg(null);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    // Validar tipo
    if (!f.type.startsWith('image/')) {
      setErrMsg('Solo se permiten imágenes (JPG, PNG, WebP).');
      return;
    }
    // Validar tamaño
    const sizeMB = f.size / 1024 / 1024;
    if (sizeMB > MAX_SIZE_MB) {
      setErrMsg(`La imagen es muy grande (${sizeMB.toFixed(1)}MB). Máximo ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  function abrirSelector() {
    inputRef.current?.click();
  }

  const canSubmit = !!(file && tipo && !uploading);

  async function subir() {
    if (!canSubmit || !file) return;
    setUploading(true);
    setErrMsg(null);

    const sesionNum = numeroSesion ? Number.parseInt(numeroSesion, 10) : null;

    const { error } = await subirFotoTratamiento({
      tratamientoId: tratamiento.id,
      file,
      tipo,
      numeroSesion: sesionNum,
      descripcion: descripcion.trim() || null,
    });

    setUploading(false);

    if (error) {
      setErrMsg(error);
      return;
    }

    // 🔔 Notificar al cliente
    const tipoLabel =
      tipo === 'inicial' ? 'foto inicial' :
      tipo === 'progreso' ? 'foto de progreso' :
      'foto final';

    void insertNotificacion({
      clienteId: tratamiento.cliente_id,
      kind: 'foto_subida',
      title: 'Nueva foto en tu evolución 📸',
      body: `El equipo Amore subió una ${tipoLabel} a tu tratamiento. ¡Entrá a la pestaña Evolución para verla!`,
      tratamientoId: tratamiento.id,
    });

    // Limpiar preview
    if (preview) URL.revokeObjectURL(preview);

    await props.onUploaded();
  }

  return (
    <motion.div
      className="fixed inset-0 z-[930] flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,61,91,0.42)' }}
        onClick={() => !uploading && props.onClose()}
      />
      <motion.div
        layout
        className="pointer-events-auto relative z-[931] flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl shadow-2xl"
        style={{
          border: '1px solid rgba(242,215,213,0.75)',
          background: 'var(--bg-cream, #FDF8F5)',
          boxShadow: '0 32px 64px rgba(0,61,91,0.18)',
        }}
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="max-h-[92vh] overflow-y-auto p-6 sm:p-8">
          <button
            type="button"
            className="absolute right-5 top-5 rounded-full p-2 text-[#003D5B]/45 hover:bg-[#F2D7D5]/45"
            onClick={() => !uploading && props.onClose()}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Encabezado */}
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#B8956E]/20 text-[#8B6F4E]">
              <Camera className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-serif-premium text-xl font-bold text-[#003D5B]">Subir foto</h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#003D5B]/45">
                {tratamiento.servicio_nombre} · {tratamiento.cliente_nombre}
              </p>
            </div>
          </div>

          {errMsg ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errMsg}
            </div>
          ) : null}

          {/* ── Tipo de foto ── */}
          <section className="mt-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
              1 · Tipo de foto
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {TIPOS_FOTO.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition ${
                    tipo === t.value
                      ? 'border-[#003D5B] bg-[#003D5B] text-white shadow'
                      : 'border-[#003D5B]/15 bg-white/85 text-[#003D5B] hover:bg-[#F2D7D5]/25'
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                      tipo === t.value ? 'bg-white/20' : 'bg-[#003D5B]/8'
                    }`}
                  >
                    {t.icon}
                  </span>
                  <span className="text-sm font-bold">{t.label}</span>
                  <span
                    className={`text-[10px] ${
                      tipo === t.value ? 'text-white/75' : 'text-[#7A746E]'
                    }`}
                  >
                    {t.descripcion}
                  </span>
                </button>
              ))}
            </div>
          </section>
                    {/* Aviso comparación antes/después */}
          <div
            className="mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5"
            style={{
              borderColor: 'rgba(184,149,110,0.35)',
              background: 'rgba(184,149,110,0.08)',
            }}
          >
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B8956E]" />
            <p className="text-[10px] leading-relaxed text-[#003D5B]/75">
              <strong className="text-[#003D5B]">Tip:</strong> para que el cliente vea la comparación
              en su pestaña <em>Evolución</em>, necesitás cargar al menos <strong>2 fotos</strong>:
              una <strong>"Antes"</strong> y otra <strong>"Progreso"</strong> o{' '}
              <strong>"Después"</strong>.
            </p>
          </div>

          {/* ── Selector de archivo ── */}
          <section className="mt-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
              2 · Imagen
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            {preview ? (
              <div className="relative overflow-hidden rounded-2xl border border-[#F2D7D5]/75 bg-white/95">
                <img
                  src={preview}
                  alt="Vista previa"
                  className="h-64 w-full object-cover"
                />
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#003D5B]">{file?.name}</p>
                    <p className="text-[10px] text-[#7A746E]">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (preview) URL.revokeObjectURL(preview);
                      setFile(null);
                      setPreview(null);
                      if (inputRef.current) inputRef.current.value = '';
                    }}
                    className="rounded-full border border-[#003D5B]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={abrirSelector}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#003D5B]/25 bg-white/40 py-12 text-[#003D5B] transition hover:border-[#003D5B]/45 hover:bg-white/70"
              >
                <ImagePlus className="h-10 w-10 text-[#B8956E]" />
                <span className="text-sm font-semibold">Tocá para elegir imagen</span>
                <span className="text-[10px] text-[#7A746E]">
                  JPG, PNG o WebP · máx. {MAX_SIZE_MB}MB
                </span>
              </button>
            )}
          </section>

          {/* ── Sesión asociada (opcional) ── */}
          <section className="mt-6">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                Número de sesión asociada (opcional)
              </span>
              <input
                type="number"
                min={1}
                max={tratamiento.sesiones_totales}
                value={numeroSesion}
                onChange={(e) => setNumeroSesion(e.target.value)}
                placeholder={`Ej: ${tratamiento.sesiones_realizadas || 1}`}
                className="mt-1 w-full rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5 text-sm text-[#003D5B] outline-none"
              />
              <p className="mt-1 text-[10px] text-[#7A746E]">
                Si la foto corresponde a una sesión específica.
              </p>
            </label>
          </section>

          {/* ── Descripción ── */}
          <section className="mt-6">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                Descripción (opcional)
              </span>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Zona tratada, observaciones del antes/después…"
                rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2 text-sm text-[#003D5B] outline-none"
              />
            </label>
          </section>

          {/* Info de privacidad */}
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#BFC9A2]/12 px-3 py-2.5">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#003D5B]/55" />
            <p className="text-[10px] leading-relaxed text-[#003D5B]/70">
              Las fotos se guardan de forma privada. Solo el cliente y el equipo de Amore pueden
              verlas.
            </p>
          </div>

          <motion.button
            type="button"
            disabled={!canSubmit}
            whileTap={{ scale: canSubmit ? 0.98 : 1 }}
            onClick={() => void subir()}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white disabled:pointer-events-none disabled:opacity-40"
            style={{
              background: 'linear-gradient(90deg, #BFC9A2 0%, #003D5B 100%)',
              boxShadow: '0 14px 32px rgba(0,61,91,0.20)',
            }}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? 'Subiendo…' : 'Subir foto'}
          </motion.button>

          {!canSubmit && !uploading ? (
            <p className="mt-3 text-center text-[11px] text-[#7A746E]">
              {!file ? 'Elegí una imagen para continuar.' : ''}
            </p>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}