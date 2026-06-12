-- =====================================================
-- 008_tratamientos_cliente.sql
-- Sistema de tratamientos, sesiones y fotos para Amore
-- =====================================================

-- ============ TABLA: tratamientos_cliente ============
CREATE TABLE IF NOT EXISTS public.tratamientos_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  servicio_id TEXT NOT NULL,
  servicio_nombre TEXT NOT NULL,
  profesional TEXT NOT NULL DEFAULT 'Equipo Amore',
  zona TEXT NOT NULL DEFAULT 'Rivadavia',
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  precio_total NUMERIC(10,2) DEFAULT 0,
  sesiones_totales INT NOT NULL DEFAULT 1,
  sesiones_realizadas INT NOT NULL DEFAULT 0,
  puntos_acumulados INT NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','finalizado','pausado','cancelado')),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tratamientos_cliente_id ON public.tratamientos_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tratamientos_estado ON public.tratamientos_cliente(estado);

-- ============ TABLA: tratamiento_sesiones ============
CREATE TABLE IF NOT EXISTS public.tratamiento_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tratamiento_id UUID NOT NULL REFERENCES public.tratamientos_cliente(id) ON DELETE CASCADE,
  numero_sesion INT NOT NULL,
  fecha_sesion DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_sesion TIME,
  profesional TEXT NOT NULL,
  observaciones TEXT,
  puntos_otorgados INT DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sesiones_tratamiento ON public.tratamiento_sesiones(tratamiento_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha ON public.tratamiento_sesiones(fecha_sesion);

-- ============ TABLA: tratamiento_fotos ============
CREATE TABLE IF NOT EXISTS public.tratamiento_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tratamiento_id UUID NOT NULL REFERENCES public.tratamientos_cliente(id) ON DELETE CASCADE,
  sesion_id UUID REFERENCES public.tratamiento_sesiones(id) ON DELETE SET NULL,
  url_foto TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('inicial','progreso','final')),
  numero_sesion INT,
  descripcion TEXT,
  subida_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fotos_tratamiento ON public.tratamiento_fotos(tratamiento_id);
CREATE INDEX IF NOT EXISTS idx_fotos_tipo ON public.tratamiento_fotos(tipo);

-- =====================================================
-- TRIGGER: Actualizar contador de sesiones automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION public.actualizar_sesiones_realizadas()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tratamientos_cliente
    SET 
      sesiones_realizadas = (SELECT COUNT(*) FROM public.tratamiento_sesiones WHERE tratamiento_id = NEW.tratamiento_id),
      puntos_acumulados = (SELECT COALESCE(SUM(puntos_otorgados),0) FROM public.tratamiento_sesiones WHERE tratamiento_id = NEW.tratamiento_id),
      updated_at = now()
    WHERE id = NEW.tratamiento_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tratamientos_cliente
    SET 
      sesiones_realizadas = (SELECT COUNT(*) FROM public.tratamiento_sesiones WHERE tratamiento_id = OLD.tratamiento_id),
      puntos_acumulados = (SELECT COALESCE(SUM(puntos_otorgados),0) FROM public.tratamiento_sesiones WHERE tratamiento_id = OLD.tratamiento_id),
      updated_at = now()
    WHERE id = OLD.tratamiento_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_sesiones ON public.tratamiento_sesiones;
CREATE TRIGGER trg_actualizar_sesiones
AFTER INSERT OR DELETE ON public.tratamiento_sesiones
FOR EACH ROW EXECUTE FUNCTION public.actualizar_sesiones_realizadas();

-- =====================================================
-- POLÍTICAS RLS (usando is_portal_admin() existente)
-- =====================================================
ALTER TABLE public.tratamientos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tratamiento_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tratamiento_fotos ENABLE ROW LEVEL SECURITY;

-- tratamientos_cliente
DROP POLICY IF EXISTS "Cliente ve sus tratamientos" ON public.tratamientos_cliente;
CREATE POLICY "Cliente ve sus tratamientos"
ON public.tratamientos_cliente FOR SELECT
USING (auth.uid() = cliente_id OR public.is_portal_admin());

DROP POLICY IF EXISTS "Admin gestiona tratamientos" ON public.tratamientos_cliente;
CREATE POLICY "Admin gestiona tratamientos"
ON public.tratamientos_cliente FOR ALL
USING (public.is_portal_admin())
WITH CHECK (public.is_portal_admin());

-- tratamiento_sesiones
DROP POLICY IF EXISTS "Cliente ve sus sesiones" ON public.tratamiento_sesiones;
CREATE POLICY "Cliente ve sus sesiones"
ON public.tratamiento_sesiones FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tratamientos_cliente
    WHERE id = tratamiento_sesiones.tratamiento_id
    AND (cliente_id = auth.uid() OR public.is_portal_admin())
  )
);

DROP POLICY IF EXISTS "Admin gestiona sesiones" ON public.tratamiento_sesiones;
CREATE POLICY "Admin gestiona sesiones"
ON public.tratamiento_sesiones FOR ALL
USING (public.is_portal_admin())
WITH CHECK (public.is_portal_admin());

-- tratamiento_fotos
DROP POLICY IF EXISTS "Cliente ve sus fotos" ON public.tratamiento_fotos;
CREATE POLICY "Cliente ve sus fotos"
ON public.tratamiento_fotos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tratamientos_cliente
    WHERE id = tratamiento_fotos.tratamiento_id
    AND (cliente_id = auth.uid() OR public.is_portal_admin())
  )
);

DROP POLICY IF EXISTS "Admin gestiona fotos" ON public.tratamiento_fotos;
CREATE POLICY "Admin gestiona fotos"
ON public.tratamiento_fotos FOR ALL
USING (public.is_portal_admin())
WITH CHECK (public.is_portal_admin());