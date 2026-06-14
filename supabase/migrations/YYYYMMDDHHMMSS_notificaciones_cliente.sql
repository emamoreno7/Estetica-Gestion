-- ═══════════════════════════════════════════════════════════════
-- TABLA: notificaciones_cliente
-- Almacena notificaciones persistentes para el portal del cliente
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.notificaciones_cliente (
  id            uuid primary key default gen_random_uuid(),

  -- A quién va dirigida (FK al user de auth)
  cliente_id    uuid not null references auth.users(id) on delete cascade,

  -- Tipo de evento
  kind          text not null check (kind in (
                  'cita_confirmada',
                  'admin_mensaje',
                  'sesion_registrada',
                  'foto_subida'
                )),

  title         text not null,
  body          text not null,

  -- Referencias opcionales para navegación futura
  tratamiento_id uuid references public.tratamientos_cliente(id) on delete set null,
  sesion_id      uuid references public.tratamiento_sesiones(id) on delete set null,

  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Índice para fetch rápido por cliente (ordenado por fecha desc)
create index if not exists idx_notif_cliente_id
  on public.notificaciones_cliente (cliente_id, created_at desc);

-- ───────────────────────────────────────────────────────────────
-- RLS: cliente solo ve sus propias notificaciones
--      admin puede insertar para cualquier cliente
-- ───────────────────────────────────────────────────────────────
alter table public.notificaciones_cliente enable row level security;

-- Cliente lee solo las suyas
create policy "cliente_lee_sus_notif"
  on public.notificaciones_cliente
  for select
  using (cliente_id = auth.uid());

-- Cliente puede marcar como leídas (update solo campo read)
create policy "cliente_marca_leidas"
  on public.notificaciones_cliente
  for update
  using (cliente_id = auth.uid())
  with check (cliente_id = auth.uid());

-- Admin puede insertar notificaciones para cualquier cliente
create policy "admin_inserta_notif"
  on public.notificaciones_cliente
  for insert
  with check (is_portal_admin());

-- Admin puede leer todas (para futuros reportes)
create policy "admin_lee_todas_notif"
  on public.notificaciones_cliente
  for select
  using (is_portal_admin());