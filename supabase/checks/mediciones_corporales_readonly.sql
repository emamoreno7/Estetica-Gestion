-- Verificación NO destructiva tras ejecutar la migración de mediciones.
-- Se ejecuta en SQL editor; no crea clientes ni inserta datos reales.

select table_name, row_security
from information_schema.tables t
join pg_class c on c.relname = t.table_name and c.relnamespace = 'public'::regnamespace
where t.table_schema = 'public'
  and t.table_name in ('mediciones_corporales','mediciones_operadores','mediciones_auditoria')
order by table_name;

select tablename, policyname, cmd, roles
from pg_policies
where schemaname='public'
  and tablename in ('mediciones_corporales','mediciones_operadores','mediciones_auditoria')
order by tablename, cmd;

-- Debe ser true únicamente para las cuentas autorizadas.
-- select public.puede_registrar_mediciones(); -- Ejecutar con JWT auth de prueba.

-- La siguiente condición debe devolver 0:
select count(*) as mediciones_anonimas
from public.mediciones_corporales
where registrado_por is null and anulado_at is null;
