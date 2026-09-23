"""Pruebas PostgreSQL/RLS con cuatro roles sintéticos. Base EFÍMERA de GitHub CI.
No conectarse a producción ni guardar datos reales.
"""
import os
import uuid
import psycopg
from psycopg import errors

DSN = os.environ["TEST_DATABASE_URL"]
ADMIN = ("00000000-0000-4000-8000-000000000001", "admin@amore.test")
STAFF = ("00000000-0000-4000-8000-000000000002", "operador@amore.test")
CLIENT = ("00000000-0000-4000-8000-000000000003", "cliente@amore.test")

def connect_as(user, role="authenticated"):
    connection = psycopg.connect(DSN, autocommit=True)
    with connection.cursor() as cur:
        cur.execute("set role " + role)
        cur.execute("select set_config('request.jwt.claim.sub', %s, false)", (user[0],))
        cur.execute("select set_config('request.jwt.claims', %s, false)",
                    ('{"email":"' + user[1] + '"}',))
    return connection

def fetch_one(conn, sql, params=None):
    with conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchone()[0]

def assert_denied(fn):
    try:
        fn()
    except (errors.InsufficientPrivilege, errors.RaiseException, errors.ForeignKeyViolation):
        return
    raise AssertionError("Acceso no autorizado fue aceptado")

with connect_as(STAFF) as staff:
    assert fetch_one(staff,"select public.puede_registrar_mediciones()") is False
    assert_denied(lambda:fetch_one(staff,
        "select count(*) from public.buscar_clientes_para_mediciones('Mar')"))

with connect_as(ADMIN) as admin:
    assert fetch_one(admin,"select public.puede_registrar_mediciones()") is True
    with admin.cursor() as cur:
        cur.execute("select public.configurar_operador_mediciones(%s,true)",(STAFF[1],))

medicion_id = str(uuid.uuid4())
with connect_as(STAFF) as staff:
    assert fetch_one(staff,"select public.puede_registrar_mediciones()") is True
    assert fetch_one(staff,"select count(*) from public.buscar_clientes_para_mediciones('Mar')") == 1
    assert fetch_one(staff,"select count(*) from public.buscar_clientes_para_mediciones('%%')") == 0
    assert fetch_one(staff,"select count(*) from public.buscar_clientes_para_mediciones('__')") == 0
    assert fetch_one(staff,"select count(*) from public.mediciones_auditoria") == 0
    assert_denied(lambda:fetch_one(staff,"select count(*) from public.perfiles_clientes"))
    with staff.cursor() as cur:
        cur.execute("""insert into public.mediciones_corporales
            (id,cliente_id,fecha,sesion_nro,cintura_cm,peso_kg)
            values (%s,%s,'2026-09-23',1,86.5,64.8)""", (medicion_id, CLIENT[0]))
        # El acceso a SELECT sobre mediciones se limita a la membresía del equipo.
        cur.execute("select count(*) from public.mediciones_corporales")
        assert cur.fetchone()[0] == 1
        assert_denied(lambda:cur.execute(
            "update public.mediciones_corporales set cintura_cm=40 where id=%s",(medicion_id,)))
        assert_denied(lambda:cur.execute(
            "delete from public.mediciones_corporales where id=%s",(medicion_id,)))
        assert_denied(lambda:cur.execute(
            "select public.anular_medicion_corporal(%s,%s)",(medicion_id,"sin autorización")))

with connect_as(CLIENT) as client:
    assert fetch_one(client,"select public.puede_registrar_mediciones()") is False
    assert fetch_one(client,"select count(*) from public.mediciones_corporales") == 0
    assert_denied(lambda:fetch_one(client,
        """insert into public.mediciones_corporales
           (cliente_id,cintura_cm) values (%s,81) returning 1""", (CLIENT[0],)))
    assert_denied(lambda:fetch_one(client,
        "select count(*) from public.buscar_clientes_para_mediciones('Mar')"))

with connect_as(ADMIN) as admin:
    with admin.cursor() as cur:
        cur.execute("select count(*) from public.mediciones_auditoria where accion='alta'")
        assert cur.fetchone()[0] == 1
        cur.execute("select public.anular_medicion_corporal(%s,%s)",
                    (medicion_id,"Registro duplicado"))
        cur.execute("select anulado_at is not null from public.mediciones_corporales where id=%s",
                    (medicion_id,))
        assert cur.fetchone()[0] is True
        cur.execute("select count(*) from public.mediciones_auditoria where medicion_id=%s",
                    (medicion_id,))
        assert cur.fetchone()[0] == 2
        cur.execute("select public.configurar_operador_mediciones(%s,false)", (STAFF[1],))

with connect_as(STAFF) as staff:
    assert fetch_one(staff,"select public.puede_registrar_mediciones()") is False
    assert fetch_one(staff,"select count(*) from public.mediciones_corporales") == 0

with connect_as(CLIENT, "anon") as anonymous:
    assert_denied(lambda:fetch_one(anonymous,
        "select count(*) from public.mediciones_corporales"))

print("PASS SQL: administración, operador, clienta y anónimo; auditoría y revocación.")
