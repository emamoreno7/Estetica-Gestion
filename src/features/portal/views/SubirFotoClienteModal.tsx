import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, ImagePlus, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { subirFotoCliente } from '@/lib/portalTratamientosApi';

const MAX_SIZE_MB = 8;

export default function SubirFotoClienteModal(props: {
  tratamientoId: string;
  clienteId: string;
  onClose: () => void;
  onUploaded: () => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');

  const [uploading, setUploading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  function handleFile(f: File | null) {
    setErrMsg(null);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!f.type.startsWith('image/')) {
      setErrMsg('Solo se permiten imágenes (JPG, PNG, WebP).');
      return;
    }
    const sizeMB = f.size / 1024 / 1024;
    if (sizeMB > MAX_SIZE_MB) {
      setErrMsg(`La imagen es muy grande (${sizeMB.toFixed(1)}MB). Máximo ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  const canSubmit = !!(file && !uploading);

  async function subir() {
    if (!canSubmit || !file) return;
    setUploading(true);
    setErrMsg(null);

    const { error } = await subirFotoCliente({
      tratamientoId: props.tratamientoId,
      clienteId: props.clienteId,
      file,
      descripcion: descripcion.trim() || null,
    });

    setUploading(false);

    if (error) {
      setErrMsg(error);
      return;
    }

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
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#BFC9A2]/25 text-[#003D5B]">
              <Camera className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-serif-premium text-xl font-bold text-[#003D5B]">
                Subir mi foto
              </h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#003D5B]/45">
                Tu seguimiento personal
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[#7A746E]">
            Subí una foto para tu autoseguimiento. La verás en tu galería personal con la
            etiqueta <strong>Subida por vos</strong>. El equipo Amore también puede verla para
            asesorarte mejor.
          </p>

          {errMsg ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errMsg}
            </div>
          ) : null}

          {/* Selector de archivo */}
          <section className="mt-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
              Imagen
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
                <img src={preview} alt="Vista previa" className="h-64 w-full object-cover" />
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
                onClick={() => inputRef.current?.click()}
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

          {/* Descripción */}
          <section className="mt-6">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                ¿Querés agregar una nota? (opcional)
              </span>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: cómo te sentís, qué cambios ves, qué zona…"
                rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2 text-sm text-[#003D5B] outline-none"
              />
            </label>
          </section>

          {/* Info de privacidad */}
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#BFC9A2]/12 px-3 py-2.5">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#003D5B]/55" />
            <p className="text-[10px] leading-relaxed text-[#003D5B]/70">
              Tu foto se guarda de forma privada. Solo vos y el equipo de Amore pueden verla.
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
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Subiendo…' : 'Subir foto'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}