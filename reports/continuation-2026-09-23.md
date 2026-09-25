# Continuación local · Práctica por contenidos y Profesor IA

Fecha de revisión: 23 de septiembre de 2026.

Este paquete continúa el trabajo recibido en `guardia-civil-transfer.zip`. No contiene el directorio `.git`, por lo que aquí no se crea ningún commit ni se toca `main`. Tampoco se ha hecho push, merge, despliegue, publicación ni ejecución de SQL de Supabase.

## Qué queda cerrado en esta continuación

- Se completa el Profesor de inglés que había quedado a medio materializar: `data/professor/english.json`, `english-rules.json` y el catálogo unificado `rules.json`.
- Cobertura inglesa: 1.261 preguntas con ficha local determinista: 401 oficiales, 500 generadas y 360 Stanley con revisión editorial alta.
- Las 14 oficiales neutralizadas se tratan como anomalías: no se muestra una clave histórica como solución única, no generan corrección afirmativa y no perjudican la nota.
- Se corrige la reconstrucción de huecos Stanley con puntos espaciados y el caso de puntuación final duplicada sin modificar el banco fuente.
- Las transformaciones sin hueco, como ejercicios de *reported speech*, se muestran como «Respuesta modelo» en vez de fabricar una falsa diferencia de frase.
- Se regenera y ensambla el Profesor de Ortografía y Gramática con firma de fuente para detectar snapshots incompatibles.
- En Gramática, los resúmenes de corrección pasan de diferencias de letras difíciles de leer (`e → a`, `ieron → o`) a cambios completos y pedagógicos (`le → la`, `hubieron → hubo`, `de que → que`). Se conserva la capitalización de las frases.
- El Profesor sigue siendo 100 % local y determinista: no consulta una IA remota durante el examen. Ante una ficha ausente, incompatible o dudosa, usa un fallback seguro en vez de inventar una explicación.

## Cobertura del Profesor

| Módulo | Cobertura | Editorial | Anomalías |
|---|---:|---:|---:|
| Inglés | 1.261 preguntas | 1.247 | 14 |
| Ortografía | 2.480 elementos | 2.471 | 9 |
| Gramática | 640 frases | 559 | 81 |

Total materializado: **4.381 fichas explicativas**. En Ortografía la unidad es cada elemento B/M de las frases, por eso su cobertura es mayor que el número de preguntas primarias.

`sourceVerified` permanece en `false`: las reglas pedagógicas tienen referencias permitidas, pero este paquete no incluye una plantilla oficial autenticada con la que certificar documentalmente cada clave. El sistema diferencia expresamente revisión editorial de verificación de fuente.

## Comprobaciones finales

- Validador de bancos: **3.405 preguntas; 0 errores; 677 advertencias históricas documentadas**.
- Validador del Profesor: cobertura completa en los tres módulos y **0 errores estructurales**.
- Pruebas unitarias que no dependen del historial Git: **75/75 correctas** sobre scoring, ciclos, contenidos y Profesor.
- Sintaxis JavaScript: **36 archivos correctos** con `node scripts/check-syntax.mjs`.
- Los SHA-256 de los seis bancos fuente y `reports/baseline.json` se comparan contra los valores tomados antes de esta continuación y permanecen idénticos.

Dos archivos de regresión (`tests/legacy.test.mjs` y `tests/official-human-review.test.mjs`) leen commits antiguos mediante `git show`; no pueden ejecutarse desde este ZIP porque el paquete transferido no trae `.git`. Las pruebas E2E de navegador tampoco se vuelven a certificar en este entorno de transferencia: el navegador local bloquea la navegación a loopback. El informe anterior conserva la evidencia de su ejecución en el entorno original, pero no se presenta como una nueva ejecución de esta continuación.

## Regla funcional que no se toca

Se mantiene exactamente **Formato oficial: 20 preguntas · 15 min** (900 segundos). Los intensivos de 40/60/100 permanecen separados. La penalización inglesa interna sigue siendo exactamente `errores / 3`. No se modifica el texto ni las opciones de las preguntas oficiales.

## Archivos principales añadidos o completados

- `scripts/build-professor-english.mjs`
- `scripts/build-professor-spanish.mjs`
- `data/professor/english.json`
- `data/professor/english-rules.json`
- `data/professor/rules.json`
- `assets/js/services/professor.js`
- `assets/js/modules/professor/render.js`
- `tests/professor.test.mjs`
- `reports/professor-english-audit.md`
- `reports/professor-validation.json`
- `reports/continuation-tests.txt` y `reports/continuation-hashes.txt`

El detalle histórico de la auditoría de bancos sigue en `reports/final-review.md`; este documento describe únicamente la continuación realizada sobre el ZIP transferido.
