-- Verificación NO destructiva tras aplicar la migración 20260923213000.
-- Ejecutar con rol postgres en SQL Editor; no inserta datos ni altera pacientes.

select c.relname as tabla, c.relrowsecurity as rls_activo
from pg_class c
where c.relnamespace = 'public'::regnamespace
  and c.relname in ('mediciones_corporales','mediciones_operadores','mediciones_auditoria')
order by tabla;

select tablename, policyname, cmd, roles
from pg_policies
where schemaname='public'
  and tablename in ('mediciones_corporales','mediciones_operadores','mediciones_auditoria')
order by tablename, cmd;

-- Todos los conteos deben ser 0. Esta consulta no expone nombres ni métricas.
select count(*) as mediciones_activas_sin_actor
from public.mediciones_corporales
where registrado_por is null and anulado_at is null;

-- Verificar en staging con distintos JWT (admin, empleado autorizado,
-- empleado revocado y clienta) las políticas SELECT/INSERT/UPDATE/DELETE:
-- clienta: 0 filas, no insertar.
-- empleado autorizado: sólo SELECT/INSERT; no UPDATE/DELETE ni anular.
-- empleado revocado: sin acceso a ninguna medición.
-- administrador: SELECT/INSERT y RPC de anulación con motivo obligatorio.
