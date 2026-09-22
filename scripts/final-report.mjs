import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {loadBanks,read} from './banks.mjs';
const {groups}=loadBanks(),baseline=read('reports/baseline.json'),audit=read('reports/stanley-audit-summary.json'),changes=read('reports/answer-changes.json'),validation=read('reports/bank-validation.json');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const shell=['index.html','assets/css/app.css',...walk('assets/js')];
const initialBytes=shell.reduce((sum,p)=>sum+fs.statSync(p).size,0);
const rows=Object.entries(groups).map(([bank,q])=>({bank,before:baseline.groups[bank].count,after:q.length,eligible:q.filter(q=>!q.excludeRandom&&!q.neutralized).length}));
fs.writeFileSync('reports/bank-counts.json',JSON.stringify(rows,null,2)+'\n');
fs.writeFileSync('reports/final-review.md',`# Informe final para revisión humana

Estado: rama local audit-refactor-guardia-civil. La auditoría inicial se guardó en 7bfd51d; el dictamen humano posterior se entrega en un commit local adicional titulado «Revisión humana de respuestas oficiales ambiguas». Sin push, merge, publicación ni SQL ejecutado.

**Regla preservada y probada: Formato oficial: 20 preguntas · 15 min.** El deadline es de 900 segundos; los intensivos se identifican por separado. Penalización interna exacta: errores / 3.

## Auditoría de contenido

Se terminó la lectura de las 1.235 Stanley pendientes y se registró dictamen para las 1.244. Resultado: ${audit.statuses['editorial-reviewed']} utilizables, ${audit.statuses['reviewed-unusable']} con importación inutilizable y ${audit.statuses['reviewed-ambiguous']} ambiguas con enunciado conservado. Algunas inutilizables también tienen candidatas alternativas. **${audit.sourceReviewRequired} siguen excluidas** y requieren PDF/plantilla y criterio docente para repararlas. Se preservan todas, sin inventar huecos nuevos en esta continuación. La revisión editorial está completa; la verificación de fuente no está hecha.

Hay **${changes.length} cambios efectivos de clave**, ${changes.filter(q=>q.id.startsWith('oficial')).length} oficiales y ${audit.changedKeys} Stanley. Se compara con la clave original por ocurrencia, corrigiendo cuatro falsos cambios que producía el inventario anterior al colisionar IDs. No se modificó ningún enunciado u opción oficial. Se conservaron las 11 variantes Stanley mediante IDs estables con legacyId.

**Dictamen humano sobre las 14 oficiales revisadas: 11 cambios validados, 2 preguntas con múltiples respuestas válidas y 1 sin opción inequívoca.** Las tres anomalías están excluidas de aleatorios y anuladas en sus modelos históricos; ninguna respuesta ni blanco perjudica la nota. En oficial-13-15 se retira c y se conserva b solo como clave histórica importada. Los 13 campos oficiales distintos del original incluyen dos valores representativos de preguntas anuladas, no 13 soluciones únicas aprobadas. Detalle en [official-human-review.md](official-human-review.md).

- Lista íntegra de claves, motivos y confianza: [english-bank-audit.md](english-bank-audit.md) y [answer-changes.json](answer-changes.json).
- Preguntas con alternativas: [ambiguous-questions.json](ambiguous-questions.json).
- Cada entrada inglesa, texto, opciones, estado y candidatos: [english-audit-inventory.json](english-audit-inventory.json).
- Decisiones de lectura Stanley reproducibles: [stanley-review-decisions.json](stanley-review-decisions.json).

Las candidatas de preguntas excluidas no se aceptan automáticamente al puntuar. Los históricos conservan las preguntas neutralizadas y explican la anulación. Los snapshots de intentos antiguos conservan la versión contestada.

## Conteos antes/después

| Banco | Antes | Después | Elegibles aleatorios |
|---|---:|---:|---:|
${rows.map(r=>`| ${r.bank} | ${r.before} | ${r.after} | ${r.eligible} |`).join('\n')}

Total: 3.405 entradas primarias, sin pérdidas. Inglés entrenamiento: 500 generadas + 1.244 Stanley. Los 18 modelos históricos y el bloque de 41 oficiales sueltas conservan su separación; el bloque suelto no aparece como modelo. Se preservan aparte ${baseline.reserves} reservas. Ortografía cuenta frases de cuatro elementos, no debe confundirse una frase con cuatro preguntas inglesas. No hay IDs duplicados dentro de los bancos validados; los módulos mantienen espacios de nombres separados.

## Arquitectura y cambios funcionales

HTML de entrada, CSS, módulos ES y JSON por módulo/origen. Servicios separados para puntuación, deadline, transacciones de ciclos, persistencia, estadísticas y nube. app.js sigue coordinando la interfaz y merece futuras extracciones, sin framework ni build necesario para Pages.

| Problema comprobado antes | Comportamiento posterior |
|---|---|
| Seleccionar/abandonar consumía ciclos; mezcla parcial podía persistirse | Selección provisional; confirmación solo al terminar; rollback sin consumo |
| Cruce de ciclo académico podía duplicar preguntas | Selección única y consumo de pendientes antes de nueva generación |
| Intervalos regalaban tiempo al suspender y recargar | Deadline persistido, recuperación de respuestas/posición, expiración única |
| Error inglés multiplicado por 0,33 | División exacta por 3; blancos cero |
| Estadística confundía aciertos y nota penalizada | Precisión separada; desglose por modo, dificultad, tema y procedencia |
| Nube reemplazaba estado local; logout borraba progreso | Merge, archivo por cuenta, respaldo legacy y errores visibles |
| Sincronización de fallos eliminaba filas de otros módulos | Upsert conjunto y borrados filtrados por usuario y pregunta, con marcadores |
| Historial académico remoto no reconstruía revisión | Reconstrucción compatible; historial inglés compacto con snapshots |
| Fallos de ortografía mezclaban frases y elementos | Cinco frases / veinte elementos evaluables |
| Importaciones con claves erróneas y explicación ficticia | Correcciones trazables y exclusión de entradas inciertas; sin certificar una plantilla inexistente |
| Sin comprobaciones ni recuperación offline | Validador, unidades/regresión, E2E, CI propuesto, caché estática por ruta relativa |

Se añadieron foco visible, controles táctiles, navegación por teclado, modal con foco y escape, y escape de HTML. La CSP elimina la ejecución de handlers inline. La representación visual conserva el diseño existente. La carga inicial de HTML+CSS+JS locales suma ${initialBytes.toLocaleString('es-ES')} bytes frente a ${baseline.bytes.toLocaleString('es-ES')} bytes del HTML anterior (suma de archivos sin compresión; no es una medición de red). Los bancos se descargan al entrar en su módulo; los metadatos editoriales aumentan su tamaño. No se hizo benchmark de hardware móvil.

## Pruebas ejecutadas

| Comprobación | Resultado |
|---|---|
| Validador de seis bancos y modelos/reservas | 3.405 entradas; ${validation.errors.length} errores; ${validation.warnings.length} advertencias históricas documentadas |
| Unidades, regresión y dictamen humano | 54/54 correctas; incluye cuatro pruebas específicas de las 14 oficiales |
| E2E Playwright 1.62.1 + Edge local | 11/11 correctas en e2e-tests.txt; el caso específico de anomalías históricas se volvió a ejecutar y pasó antes del commit |
| Sintaxis JS | correcta; detalle en syntax-check.txt |
| git diff --check | correcto; advertencia de conversión LF/CRLF de Git, sin errores de whitespace |
| Subruta /guardia-civil-ingles/ y recarga offline | correctas en E2E local |
| Sitio público GitHub Pages | no verificado: web no accesible con herramienta web; navegador integrado falló al iniciar; socket HTTPS bloqueado y ampliación de permisos rechazada |
| RLS/RPC de Supabase real | no ejecutadas; revisión y pruebas manuales descritas en supabase/README.md |
| CI remoto / Chromium / Safari / Firefox | no ejecutados en esta sesión |

E2E incluye entrada a módulos, oficial 20/900, puntuación/blancos/revisión, tamaños 20/40/60/100, tres dificultades en nuevo/mixto, selección histórica y exclusión del bloque suelto, abandono, recarga, expiración, ambos módulos académicos, banco de fallos, estadísticas, login simulado, logout con archivo, borrados selectivos, teclado/modal, offline y reintento de subida sin duplicados. No se observaron errores JS ni de consola en esos escenarios. El fallo de red simulado se comunica en interfaz y conserva el intento local.

Las 677 advertencias no equivalen a errores ignorados silenciosamente: están enumeradas en bank-known-warnings.json (huecos ausentes, duplicados de contenido, arrays académicos históricos incompatibles y reservas sin clave). Nuevas advertencias hacen fallar la validación. Pasar el validador no prueba corrección lingüística.

## SQL manual

Ningún SQL se ejecutó ni ninguna tabla de producción se modificó. Revisar y aplicar solo por una persona responsable tras backup y staging:

1. [000-preflight.sql](../supabase/000-preflight.sql): inventario de esquema, RLS, grants, índices y duplicados, solo lectura.
2. [001-rls.sql](../supabase/001-rls.sql): permisos mínimos CRUD para authenticated, restricción a propietario de las tres tablas; revisar impacto de retirar grants de PUBLIC/anon.
3. [002-atomic-cycles.sql](../supabase/002-atomic-cycles.sql): merge transaccional con bloqueo de fila y SECURITY INVOKER; exige question_cycles JSONB. Índice de intentos opcional y comentado; no borra duplicados.

[Guía de migración, matriz A/B y recuperación](../supabase/README.md). Verificar UNIQUE(user_id,question_id), tipos y permisos de secuencias si existen. La RPC debe probarse con PostgreSQL real antes de aprobarla.

## Riesgos y revisión humana antes de publicar

- Revisar las ${changes.length} claves cambiadas, las ${audit.sourceReviewRequired} Stanley excluidas, oficiales ambiguas/neutralizadas y las reparaciones de plantillas/nueve huecos hechas previamente. No hay PDF/plantilla autenticada.
- Sin la RPC propuesta, dos dispositivos pueden perder una actualización concurrente de ciclos. Sin índice único de intentos, dos subidas simultáneas pueden duplicarse. Los clientes antiguos no respetan marcadores de borrado; actualizar todos los dispositivos.
- Los snapshots/localStorage y marcadores pueden crecer; el aviso de cuota y exportación protegen el progreso en memoria, pero cerrar el navegador antes de exportar puede perder lo que no se pudo escribir.
- La selección académica garantiza unicidad, pero no certifica distribución pedagógica por tema o dificultad; revisar este criterio docente por separado.
- Configuración real de Supabase, URLs de Auth y disponibilidad pública de Pages siguen pendientes de comprobación autorizada. Compatibilidad local no demuestra servicio remoto correcto.
- No se instalaron dependencias nuevas: se usó Playwright ya disponible. Falta lockfile reproducible y ejecución del workflow en GitHub. Revisar antes de publicar.
- Mantener una copia/exportación antes de adoptar la nueva persistencia. Cambiar VERSION del service worker cuando se prepare una publicación; no se publicó ninguna versión.

## Reproducción y entrega

Instrucciones exactas en [README.md](../README.md). Iniciar con node scripts/serve.mjs; validar con node scripts/validate-banks.mjs, node --test tests/*.test.mjs y node scripts/check-syntax.mjs. E2E usa las variables documentadas para Playwright/Edge existentes.

El trabajo inicial está en 7bfd51d; el dictamen humano y sus pruebas se entregan en el commit local adicional «Revisión humana de respuestas oficiales ambiguas». Consultar git log para su hash. [change-manifest.json](change-manifest.json) enumera las huellas actuales. No ejecutar scripts antiguos de extracción: se retiraron los prototipos usados una sola vez; baseline.json permanece intacto. No se hizo merge a main, push, publicación ni modificación automática de producción.
`);
const files=['index.html','README.md','AGENTS.md','package.json','manifest.webmanifest','sw.js','.gitignore',...['assets','data','scripts','supabase','tests','.github'].flatMap(walk),...walk('reports').filter(p=>!p.endsWith('change-manifest.json')&&!p.endsWith('.png'))];
fs.writeFileSync('reports/change-manifest.json',JSON.stringify(files.map(p=>({path:p.replaceAll('\\','/'),bytes:fs.statSync(p).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')})),null,2)+'\n');
