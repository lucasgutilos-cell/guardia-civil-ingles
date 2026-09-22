# Supabase: revisión manual

No se ha conectado ni modificado producción. La clave frontend es publicable; no hay service-role.

1. Exportar/respaldar las tres tablas desde el proyecto Supabase.
2. Ejecutar manualmente `000-preflight.sql` (solo lectura) y guardar sus resultados: tipos de columnas, grants, políticas, índices y función existente. No continuar si los tipos no coinciden.
3. Ejecutar `001-rls.sql` solo tras esa revisión. Las políticas restrictivas limitan a cada usuario incluso si existe otra política permisiva para authenticated. Se revoca acceso de anon.
4. Comprobar con DOS cuentas que SELECT/INSERT/UPDATE/DELETE ajenos no devuelven ni modifican filas en las tres tablas. Comprobar también sesión anónima. No utilizar service-role para esta prueba: elude RLS.
5. Si `profiles.question_cycles` es jsonb, revisar y aplicar `002-atomic-cycles.sql`. La función usa auth.uid(), SECURITY INVOKER y bloqueo de fila, sin IDs proporcionados por el navegador.
6. Revisar duplicados antes del índice único opcional de attempts. No hay eliminación automática.

El frontend intenta la RPC y conserva una ruta compatible si falta. **Sin RPC no se garantiza la resolución atómica entre dos dispositivos escribiendo simultáneamente.** Las operaciones del mismo navegador se serializan. Un intento local no se elimina al fallar la red: se vuelve a comparar/subir al conectar o iniciar sesión. El índice opcional evita duplicados de subida simultánea; errores se muestran y el historial local sigue disponible.

Los arrays antiguos de ciclos siguen siendo válidos. `__epoch:<modalidad>` contiene un array con su generación; una generación nueva prevalece sobre la anterior, mientras que IDs de la misma generación se unen. `__failureDeletesV1` conserva marcadores de borrado serializados para que un dispositivo desactualizado no resucite fallos. Los clientes antiguos desconocen estos marcadores: actualizar todos los dispositivos antes de depender de esta protección.

Las preguntas se mantienen completas en los JSON enviados a attempts para permitir que clientes antiguos reconstruyan la revisión. La reducción a referencias y snapshots compartidos se aplica al almacenamiento local. No se requiere cambiar la columna questions ni una migración destructiva.

Pruebas de red/login usan un servidor simulado en E2E, no prueban la configuración real del proyecto ni ejecutan SQL.

## Contrato de datos que hay que confirmar

| Tabla | Campos usados | Requisito |
|---|---|---|
| profiles | id, display_name, question_cycles | id UUID único asociado a auth.users; question_cycles JSONB para la RPC |
| attempts | user_id, date, mode, label, total, correct, wrong, blank, score, penalty, elapsed, difficulty, questions, answers | user_id UUID; métricas numéricas; questions/answers JSON o JSONB; date conserva instante ISO |
| failure_bank | user_id, question_id, question, added_at | user_id UUID; question_id texto; question JSON/JSONB; UNIQUE(user_id,question_id) requerido por upsert |

Los arrays de IDs de ciclos son compatibles con la estructura vieja. Si question_cycles es texto o JSON, no aplicar un ALTER TYPE a ciegas: exportar filas, validar el contenido en staging y diseñar una migración específica. La RPC rechaza entradas nulas, objetos guardados malformados y valores que no sean arrays; no los sustituye por un objeto vacío. Los epochs deben ser enteros no negativos. La función puede rechazar valores históricos malformados: conservarlos y revisarlos antes de migrar.

`001` retira grants de PUBLIC, anon y authenticated antes de conceder CRUD a authenticated: esto también retira privilegios como TRUNCATE, que no debe concederse al cliente. Revisar dependencias de otras aplicaciones sobre estas tablas. No modifica filas, pero cambia acceso. Las políticas restrictivas no limitan service_role ni al propietario de tabla. Revisar aparte vistas, funciones SECURITY DEFINER y permisos de secuencias si hay IDs seriales; no se concede acceso global a secuencias.

## Prueba manual en staging, antes de producción

Usar dos cuentas de prueba A y B y la clave publicable con sus JWT; nunca service_role. Preparar una fila de cada tabla para cada cuenta en el entorno de prueba. Guardar IDs y conteos antes/después.

| Operación | Sin sesión | Cuenta A, fila A | Cuenta A, fila B |
|---|---|---|---|
| SELECT | error de permisos o cero filas, nunca datos privados | visible | cero filas |
| INSERT con propietario indicado | denegado | permitido | denegado por WITH CHECK |
| UPDATE | denegado | permitido | cero filas modificadas |
| cambiar propietario A → B | denegado | denegado | denegado |
| DELETE | denegado | permitido sobre fixture | cero filas modificadas |
| RPC de ciclos | denegada | modifica únicamente profiles.id=auth.uid() | no admite un ID ajeno |

Repetir invirtiendo A/B. Tras cada UPDATE/DELETE verificar desde B que su fila no cambió: HTTP 200 sin filas no demuestra por sí solo una autorización incorrecta. No usar registros reales para estas pruebas.

Para concurrencia, enviar dos RPC simultáneas con IDs distintos y el mismo epoch: deben conservar ambos. Enviar después un epoch superior: debe sustituir IDs del ciclo anterior. Una repetición de la misma petición debe ser idempotente. null y un valor de ciclo no array deben fallar sin modificar la fila. Confirmar bloqueo de fila y aislamiento con PostgreSQL real; estos casos todavía no se ejecutaron aquí.

Para historial/fallos, desconectar A, terminar un test, reconectar y confirmar una sola subida. B no debe ver el intento. Eliminar un fallo en un dispositivo y sincronizar un segundo dispositivo antiguo: comprobar que el marcador impide resucitarlo. Un nuevo fallo posterior debe poder volver a registrarse. Todos los dispositivos deben usar el cliente actualizado.

## Aplicación y recuperación

Orden propuesto, siempre manual: backup → preflight → staging → 001 → pruebas RLS → 002 → pruebas RPC → revisión de índices. El índice de attempts está comentado: no resolver duplicados eliminando filas automáticamente. Si falta el índice de failure_bank, diseñarlo solo tras revisar duplicados y claves originales.

Guardar definiciones anteriores de políticas, grants y RPC antes de aplicar. Para revertir, restaurar esas definiciones desde el backup revisado; no desactivar RLS como atajo. La aplicación permite continuar localmente si la nube falla. Comprobar URLs de redirección de Auth para GitHub Pages y localhost desde el panel, sin modificarlas automáticamente.

Referencia: [documentación oficial de RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security). La documentación y SQL son una propuesta revisable; no certifican el esquema ni las políticas que existan en producción.
