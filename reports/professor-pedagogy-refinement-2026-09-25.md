# Refinamiento pedagógico del Profesor IA — 2026-09-25

## Motivo

La revisión visual del usuario detectó dos patrones mejorables: una explicación de Inglés que asociaba en exceso la categoría temática con la voz pasiva, y explicaciones de Ortografía demasiado genéricas para palabras concretas. La corrección de Inglés ya estaba incluida en el paquete reforzado. Esta iteración refina Ortografía y Gramática sin modificar los bancos de preguntas.

## Cambios realizados

- Ortografía: las explicaciones ya no presentan cambios de letras como reglas generales cuando solo describen la grafía de una palabra concreta.
- Ortografía: `conminaba`, `residuos` y `envergadura` tienen ahora razonamiento, trampa, truco y ejemplo específicos y pedagógicos.
- Ortografía: el fallback de todas las demás entradas usa recordatorios y ejemplos ligados a la palabra revisada, en lugar de ejemplos genéricos no relacionados.
- Gramática: `digámosle` explica ahora de forma explícita `digamos + le → digámosle` y la tilde esdrújula.
- Gramática: `usarle → usarlo` explica de forma explícita que el pronombre retoma una cosa masculina y que corresponde `lo`.
- Se añadieron pruebas de regresión para impedir que estos ejemplos vuelvan a degradarse a explicaciones genéricas.

## Comprobaciones

- Bancos: 3.405 preguntas; 0 errores de validación.
- Profesor IA: 1.261 registros de Inglés, 2.480 de Ortografía y 640 de Gramática; 0 errores estructurales.
- JavaScript: 36 archivos superan el control de sintaxis.
- Pruebas ejecutables sin historial Git: 77/77 superadas.
- Hashes de los seis bancos y `reports/baseline.json`: idénticos al paquete reforzado anterior.
- Smoke test HTTP local: `index.html` y el sidecar de Ortografía se sirven correctamente bajo `/guardia-civil-ingles/`.

## Límites del entorno

El paquete transferido no incluye `.git`. Por ello, dos pruebas históricas que llaman a `git show` no se pueden ejecutar aquí; no fallan por una regresión de la aplicación, sino porque falta el repositorio Git original. Las pruebas E2E de navegador tampoco se ejecutan en este entorno porque Playwright no está instalado/disponible. No se ha hecho push, merge, publicación ni se ha aplicado SQL de Supabase.
