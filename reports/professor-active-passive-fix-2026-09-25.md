# Refuerzo del Profesor IA — activa/pasiva (2026-09-25)

Durante la prueba manual de `stanley-63-12` se detectó que la respuesta correcta `translated` estaba bien reconstruida, pero la explicación heredaba una regla exclusivamente pasiva por pertenecer la pregunta al bloque histórico `Active / Passive`.

## Corrección aplicada

- Se añadió la regla pedagógica `en-voice-choice`, que obliga a distinguir primero si el sujeto realiza o recibe la acción antes de aplicar una explicación de activa o pasiva.
- `stanley-63-12` ahora explica que **Mr Johnson realiza la acción**, por lo que `Mr Johnson translated this book` está en voz activa, y contrasta con la pasiva `This book was translated by Mr Johnson`.
- También se reforzaron las explicaciones de los ítems activos revisados `stanley-63-17`, `stanley-64-05` y `stanley-64-19` para evitar el mismo sesgo de categoría.
- Se añadió una prueba de regresión que exige que estos ítems se expliquen como voz activa y que `stanley-63-12` contraste explícitamente activa y pasiva.

## Comprobaciones

- Bancos: **3405 preguntas, 0 errores** de validación (677 avisos ya documentados).
- Profesor: **0 errores estructurales**; cobertura 1261 Inglés + 2480 Ortografía + 640 Gramática.
- Pruebas ejecutables sin historial Git: **76/76 superadas**.
- Prueba específica del Profesor: **14/14 superadas**.
- Sintaxis: **36 archivos JavaScript superan la comprobación**.
- Los seis bancos fuente y `reports/baseline.json` conservan exactamente sus hashes SHA-256 respecto al paquete anterior.

## Limitación conocida del paquete transferido

`tests/legacy.test.mjs` y `tests/official-human-review.test.mjs` requieren commits del repositorio Git original y no pueden ejecutarse dentro del ZIP, que no contiene `.git`. No se han sustituido ni falseado esos controles.
