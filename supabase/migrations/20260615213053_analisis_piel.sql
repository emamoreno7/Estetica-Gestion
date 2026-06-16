-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: analisis_piel
-- Tabla para guardar los análisis de piel realizados con IA
-- Referencia: profiles.id (uuid)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS public.analisis_piel (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  zona          text NOT NULL CHECK (zona IN (
                  'rostro', 'cuello', 'escote', 'espalda',
                  'brazos', 'abdomen', 'piernas', 'manos'
                )),
  resultado     jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_analisis_piel_cliente_id
  ON public.analisis_piel (cliente_id);

CREATE INDEX IF NOT EXISTS idx_analisis_piel_created_at
  ON public.analisis_piel (created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE public.analisis_piel ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS

-- El cliente solo ve sus propios análisis
CREATE POLICY "cliente_ve_sus_analisis"
  ON public.analisis_piel
  FOR SELECT
  USING (auth.uid() = cliente_id);

-- El cliente solo inserta sus propios análisis
CREATE POLICY "cliente_inserta_sus_analisis"
  ON public.analisis_piel
  FOR INSERT
  WITH CHECK (auth.uid() = cliente_id);

-- El admin puede ver todos los análisis
CREATE POLICY "admin_ve_todos_analisis"
  ON public.analisis_piel
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- 5. Comentarios descriptivos
COMMENT ON TABLE public.analisis_piel IS
  'Análisis de piel realizados por IA (Claude Vision) desde el portal';

COMMENT ON COLUMN public.analisis_piel.cliente_id IS
  'NULL si el análisis fue hecho por un visitante anónimo (no se guarda en DB)';

COMMENT ON COLUMN public.analisis_piel.zona IS
  'Zona del cuerpo analizada';

COMMENT ON COLUMN public.analisis_piel.resultado IS
  'JSON con diagnóstico, tratamiento, sesiones, frecuencia y tips devueltos por IA';