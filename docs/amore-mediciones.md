# Amore · Medidas y evolución

Registro longitudinal de ocho perímetros corporales y peso opcional vinculado a perfiles_clientes.
El gráfico compara una misma zona entre fechas; no suma circunferencias ni promete resultados.

## Experiencia

- Admin: Administración → Clientes → Ver completa → Medidas y evolución.
- Empleado autorizado: ingresar y abrir /equipo/medidas; el login lo dirige allí tras verificar el permiso Supabase.
- Altas asociadas al JWT del usuario, fecha y sesión opcional. Las filas no se sobreescriben.
- Tras guardar correctamente, popup con consejos generales para comunicar o copiar.
- El admin puede anular con motivo; la auditoría conserva alta y anulación.
- PDF privado generado localmente en el navegador; no envía datos clínicos a terceros.
- Mediciones no visibles en portal cliente durante esta fase.

## Despliegue seguro de base de datos

1. Crear backup e identificar el proyecto Supabase correcto.
2. Ejecutar la migración 20260923213000_mediciones_corporales.sql primero en staging.
3. Ejecutar las consultas no destructivas de supabase/checks/mediciones_corporales_readonly.sql.
4. Probar JWT de admin, empleado autorizado, revocado y cliente normal; UPDATE y DELETE deben denegarse.
5. Autorizar correos existentes en Supabase Auth mediante pantalla Equipo o RPC configurar_operador_mediciones.
6. Verificar historial por cliente y popup posterior a respuesta exitosa.
7. Aplicar migración validada en producción antes de fusionar el frontend.

GitHub Pages no ejecuta SQL. No fusionar ni habilitar la nueva pestaña hasta validar RLS.
Consejos de hidratación, actividad y alimentación son generales; verificar contraindicaciones individuales.

## Posterior

Compartir opcionalmente resumen de solo lectura en el portal con consentimiento explícito.