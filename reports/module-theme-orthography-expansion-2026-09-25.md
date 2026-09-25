# Identidad visual por módulo y ampliación de Ortografía — 2026-09-25

## Cambios de interfaz
- Inglés usa identidad azul en hero, navegación activa, paneles, botones primarios, progreso, test, revisión y Profesor.
- Ortografía usa identidad naranja en los mismos puntos, manteniendo B/M en verde/rojo por significado.
- Gramática usa identidad morada en los mismos puntos, manteniendo Correcta/Incorrecta y APTO/NO APTO en colores semánticos.
- El encabezado GC conserva el verde institucional; la línea inferior adopta el acento del módulo.
- Se añadió un indicador del número de contenidos y se pulieron hover, bordes, fondos, foco y tarjetas de práctica.

## Ortografía: práctica por contenidos
| Contenido | Frases |
| --- | ---: |
| B/V | 68 |
| G/J | 108 |
| H | 142 |
| Acentuación | 74 |
| C/S/Z | 31 |
| LL/Y | 29 |
| X/S y otras grafías | 48 |

Total: **500 frases**, asignadas una sola vez a los siete bloques. No se ha editado ninguna pregunta, respuesta ni archivo de banco.

## Verificación
- `validate-banks`: 3405 preguntas, 0 errores, 677 advertencias documentadas.
- `validate-professor`: 0 errores.
- Suite ejecutable sin historial Git: 77/77 pruebas aprobadas.
- Sintaxis: 36 archivos JavaScript aprobados.
- Arranque local y ruta `/guardia-civil-ingles/` comprobados por HTTP.
- Las dos pruebas históricas que usan `git show` no pueden ejecutarse porque el paquete no contiene `.git`.
- E2E de navegador no ejecutable en este entorno: falta Playwright (`Instala dependencias o define PLAYWRIGHT_MODULE...`).

## Integridad de bancos
799499eca4fca86044ffc474519e03763fdf17ec81b65d2a3483af586ae4fc6b  data/english/official.json
fc8196516e1b0fd2968875e2a2c465f90f22bfb4bae8cb1787bdbd2c070b4107  data/english/training.json
fa919a34e04716d0a2f3bb9310e4856ea706e581d409c9503a54ed48d1d792f9  data/orthography/official.json
d0082d823fa5ac67405924702c42e24bc3c05ebb632871cad6b61d8a976925ee  data/orthography/training.json
cc046f397d1f84524fe22eaeefb356c56819bd2f8e41fe00badedc535dd18e7e  data/grammar/official.json
0aff3d235465390149d4e0a58cdcdf8e9ad7a83d8a4c2ec3a1588e860ab4c891  data/grammar/training.json
c35e032cae7ebecb7fd4f2a32dd7a3703c6488b9a87a16a0536c1e1fb664bf3a  reports/baseline.json
