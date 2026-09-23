-- Datos 100 % sintéticos para la base Postgres efímera de CI.
-- No incluye ni consulta la base Supabase de producción.
create schema if not exists auth;
do $do$
begin
  if not exists (select 1 from pg_roles where rolname='authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname='anon') then
    create role anon nologin;
  end if;
end $do$;

create table auth.users (
  id uuid primary key,
  email text not null unique
);

create function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;

create function auth.jwt() returns jsonb
language sql stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb;
$$;

grant usage on schema auth,public to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
grant execute on function auth.jwt() to authenticated,anon;

create table public.perfiles_clientes (
  id uuid primary key,
  full_name text not null,
  phone text not null
);
alter table public.perfiles_clientes enable row level security;
-- El rol authenticated NO recibe SELECT directo a perfiles_clientes.

create function public.is_portal_admin() returns boolean
language sql stable as $$
  select lower(coalesce(auth.jwt()->>'email','')) = 'admin@amore.test';
$$;
revoke execute on function public.is_portal_admin() from public;
grant execute on function public.is_portal_admin() to authenticated;

insert into auth.users(id,email) values
('00000000-0000-4000-8000-000000000001','admin@amore.test'),
('00000000-0000-4000-8000-000000000002','operador@amore.test'),
('00000000-0000-4000-8000-000000000003','cliente@amore.test');

insert into public.perfiles_clientes (id, full_name, phone) values
('00000000-0000-4000-8000-000000000003','Marina Ejemplo','2634000000');
