-- 2026-09-23 · AMORE | Seguimiento corporal longitudinal
-- PRE-REQUISITO: 003 (is_portal_admin), 017 (perfiles walk-in).
-- Sólo crear tablas, funciones y permisos. NO lee, migra ni altera fichas clínicas.
-- Desplegar primero en entorno de pruebas. Ejecutar en Supabase SQL editor
-- antes de habilitar el frontend; no incluir datos reales en Git/CI.

begin;

-- Rol acotado: empleado con acceso SOLO al nuevo módulo de mediciones.
-- El panel /admin completo continúa reservado a is_portal_admin().
create table if not exists public.mediciones_operadores (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  activo boolean not null default true,
  creado_por uuid references auth.users(id) on delete set null,
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

alter table public.mediciones_operadores enable row level security;

drop policy if exists mediciones_operadores_select on public.mediciones_operadores;
create policy mediciones_operadores_select
on public.mediciones_operadores for select to authenticated
using (usuario_id = (select auth.uid()) or (select public.is_portal_admin()));

drop policy if exists mediciones_operadores_admin_insert on public.mediciones_operadores;
create policy mediciones_operadores_admin_insert
on public.mediciones_operadores for insert to authenticated
with check ((select public.is_portal_admin()));

drop policy if exists mediciones_operadores_admin_update on public.mediciones_operadores;
create policy mediciones_operadores_admin_update
on public.mediciones_operadores for update to authenticated
using ((select public.is_portal_admin()))
with check ((select public.is_portal_admin()));

-- SECURITY DEFINER se utiliza para validar permisos sin ampliar el acceso
-- a la tabla perfiles_clientes ni a la base de datos del administrador.
create or replace function public.puede_registrar_mediciones()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and (
      public.is_portal_admin()
      or exists (
        select 1 from public.mediciones_operadores mo
        where mo.usuario_id = auth.uid() and mo.activo = true
      )
    );
$$;
revoke all on function public.puede_registrar_mediciones() from public, anon;
grant execute on function public.puede_registrar_mediciones() to authenticated;

-- Un registro por toma de medidas. No sobrescribir mediciones antiguas.
-- Permite clientes de recepción SIN cuenta auth (migración 017).
create table if not exists public.mediciones_corporales (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.perfiles_clientes(id) on delete restrict,
  fecha date not null default current_date,
  sesion_nro integer check (sesion_nro between 1 and 999),
  tratamiento text check (char_length(tratamiento) <= 120),
  peso_kg numeric(5,2) check (peso_kg between 20 and 400),
  brazo_cm numeric(6,2) check (brazo_cm between 10 and 260),
  abdomen_alto_cm numeric(6,2) check (abdomen_alto_cm between 10 and 260),
  cintura_cm numeric(6,2) check (cintura_cm between 10 and 260),
  abdomen_bajo_cm numeric(6,2) check (abdomen_bajo_cm between 10 and 260),
  cadera_alta_cm numeric(6,2) check (cadera_alta_cm between 10 and 260),
  cadera_baja_cm numeric(6,2) check (cadera_baja_cm between 10 and 260),
  muslo_cm numeric(6,2) check (muslo_cm between 10 and 260),
  rodilla_cm numeric(6,2) check (rodilla_cm between 10 and 260),
  observaciones text check (char_length(observaciones) <= 1000),
  registrado_por uuid default auth.uid() references auth.users(id) on delete set null,
  registrado_at timestamptz not null default now(),
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id) on delete set null,
  motivo_anulacion text check (char_length(motivo_anulacion) between 5 and 300),
  constraint mediciones_al_menos_un_valor check (
    num_nonnulls(peso_kg, brazo_cm, abdomen_alto_cm, cintura_cm,
      abdomen_bajo_cm, cadera_alta_cm, cadera_baja_cm, muslo_cm, rodilla_cm) >= 1
  ),
  constraint mediciones_anulacion_completa check (
    (anulado_at is null and anulado_por is null and motivo_anulacion is null)
    or (anulado_at is not null and motivo_anulacion is not null)
  )
);

create index if not exists mediciones_corporales_cliente_fecha_idx
on public.mediciones_corporales(cliente_id, fecha desc, registrado_at desc);

alter table public.mediciones_corporales enable row level security;

drop policy if exists mediciones_equipo_select on public.mediciones_corporales;
create policy mediciones_equipo_select
on public.mediciones_corporales for select to authenticated
using ((select public.puede_registrar_mediciones()));

drop policy if exists mediciones_equipo_insert on public.mediciones_corporales;
create policy mediciones_equipo_insert
on public.mediciones_corporales for insert to authenticated
with check (
  (select public.puede_registrar_mediciones())
  and registrado_por = (select auth.uid())
  and anulado_at is null
  and anulado_por is null
  and motivo_anulacion is null
);

-- Sin policy UPDATE ni DELETE para authenticated: historial inmutable.
-- Sólo el administrador puede anular una entrada, mediante RPC auditada.
create table if not exists public.mediciones_auditoria (
  id uuid primary key default gen_random_uuid(),
  medicion_id uuid not null references public.mediciones_corporales(id) on delete restrict,
  cliente_id uuid not null,
  accion text not null check (accion in ('alta', 'anulacion')),
  actor_id uuid references auth.users(id) on delete set null,
  ocurrido_at timestamptz not null default now(),
  detalle text
);
create index if not exists mediciones_auditoria_medicion_idx
  on public.mediciones_auditoria(medicion_id, ocurrido_at);
alter table public.mediciones_auditoria enable row level security;

drop policy if exists mediciones_auditoria_admin_select on public.mediciones_auditoria;
create policy mediciones_auditoria_admin_select
on public.mediciones_auditoria for select to authenticated
using ((select public.is_portal_admin()));

create or replace function public.registrar_auditoria_mediciones()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.mediciones_auditoria
      (medicion_id, cliente_id, accion, actor_id)
    values (new.id, new.cliente_id, 'alta', auth.uid());
  elsif TG_OP = 'UPDATE' and old.anulado_at is null and new.anulado_at is not null then
    insert into public.mediciones_auditoria
      (medicion_id, cliente_id, accion, actor_id, detalle)
    values (new.id, new.cliente_id, 'anulacion', auth.uid(), new.motivo_anulacion);
  end if;
  return new;
end;
$$;
revoke all on function public.registrar_auditoria_mediciones() from public, anon, authenticated;

drop trigger if exists trg_auditar_mediciones on public.mediciones_corporales;
create trigger trg_auditar_mediciones
after insert or update of anulado_at on public.mediciones_corporales
for each row execute function public.registrar_auditoria_mediciones();

create or replace function public.anular_medicion_corporal(
  p_medicion_id uuid,
  p_motivo text
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_motivo text := btrim(coalesce(p_motivo, ''));
begin
  if not public.is_portal_admin() then
    raise exception 'Sólo un administrador puede anular mediciones.';
  end if;
  if char_length(v_motivo) not between 5 and 300 then
    raise exception 'Ingresá un motivo entre 5 y 300 caracteres.';
  end if;
  update public.mediciones_corporales
     set anulado_at = now(),
         anulado_por = auth.uid(),
         motivo_anulacion = v_motivo
   where id = p_medicion_id and anulado_at is null;
  if not found then
    raise exception 'La medición no existe o ya se anuló.';
  end if;
end;
$$;
revoke all on function public.anular_medicion_corporal(uuid,text) from public, anon;
grant execute on function public.anular_medicion_corporal(uuid,text) to authenticated;

-- Búsqueda restringida para personal; devuelve sólo el dato mínimo
-- necesario para encontrar la ficha sin permitir leer otros datos clínicos.
create or replace function public.buscar_clientes_para_mediciones(p_busqueda text)
returns table (
  id uuid,
  full_name text,
  phone text
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_needle text := btrim(coalesce(p_busqueda,''));
begin
  if not public.puede_registrar_mediciones() then
    raise exception 'No tenés acceso al módulo de mediciones.';
  end if;
  if char_length(v_needle) < 2 or char_length(v_needle) > 80 then
    return;
  end if;
  return query
    select pc.id, coalesce(pc.full_name,''), coalesce(pc.phone,'')
    from public.perfiles_clientes pc
    where pc.full_name ilike '%' || v_needle || '%'
       or pc.phone ilike '%' || v_needle || '%'
    order by pc.full_name asc
    limit 30;
end;
$$;
revoke all on function public.buscar_clientes_para_mediciones(text) from public, anon;
grant execute on function public.buscar_clientes_para_mediciones(text) to authenticated;

-- Administración del permiso por correo exacto. El empleado debe tener
-- previamente una cuenta en Supabase Auth; no se revelan cuentas mediante
-- la interfaz pública.
create or replace function public.configurar_operador_mediciones(
  p_email text,
  p_activo boolean
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid;
begin
  if not public.is_portal_admin() then
    raise exception 'Sólo un administrador puede gestionar accesos.';
  end if;
  if p_email is null or btrim(p_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Ingresá un correo válido.';
  end if;
  select au.id into v_uid
  from auth.users au
  where lower(au.email) = lower(btrim(p_email))
  limit 1;
  if v_uid is null then
    raise exception 'Este correo todavía no tiene una cuenta registrada.';
  end if;
  insert into public.mediciones_operadores(usuario_id, activo, creado_por)
  values (v_uid, coalesce(p_activo,false), auth.uid())
  on conflict(usuario_id)
  do update set activo = excluded.activo, actualizado_at = now();
end;
$$;
revoke all on function public.configurar_operador_mediciones(text,boolean) from public, anon;
grant execute on function public.configurar_operador_mediciones(text,boolean) to authenticated;

create or replace function public.listar_operadores_mediciones()
returns table (usuario_id uuid, email text, activo boolean, creado_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_portal_admin() then
    raise exception 'Sólo un administrador puede ver los accesos.';
  end if;
  return query
  select mo.usuario_id, au.email::text, mo.activo, mo.creado_at
  from public.mediciones_operadores mo
  join auth.users au on au.id = mo.usuario_id
  order by mo.creado_at desc;
end;
$$;
revoke all on function public.listar_operadores_mediciones() from public, anon;
grant execute on function public.listar_operadores_mediciones() to authenticated;

revoke all on public.mediciones_operadores from anon;
revoke all on public.mediciones_corporales from anon;
revoke all on public.mediciones_auditoria from anon;
grant select, insert, update on public.mediciones_operadores to authenticated;
grant select, insert on public.mediciones_corporales to authenticated;
revoke update, delete on public.mediciones_corporales from authenticated;
grant select on public.mediciones_auditoria to authenticated;
revoke insert, update, delete on public.mediciones_auditoria from authenticated;

comment on table public.mediciones_corporales is
 'Seguimiento corporal privado de clientas; medidas independientes de tratamientos y sesiones.';
comment on table public.mediciones_operadores is
 'Personal autorizado exclusivamente para el módulo de mediciones (sin acceso a /admin).';

commit;