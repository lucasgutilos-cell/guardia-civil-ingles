# Guardia Civil · práctica

Aplicación estática, sin build. **Formato oficial: 20 preguntas · 15 min**. Los entrenamientos de 40/60/100 preguntas son intensivos, no formatos oficiales. Los modelos históricos conservan sus enunciados y opciones.

## Probar localmente

Requiere Node.js 24. Desde la raíz:

```sh
node scripts/serve.mjs
```

Abrir http://127.0.0.1:4173/guardia-civil-ingles/ . No abrir index.html mediante file://: los módulos y JSON necesitan HTTP. El servidor también permite probar en la raíz. No escribe en Supabase por sí mismo.

## Validación

Sin dependencias adicionales:

```sh
node scripts/validate-banks.mjs
node --test tests/*.test.mjs
node scripts/check-syntax.mjs
```

Para E2E en una instalación nueva, con autorización para descargar dependencias:

```sh
npm install --ignore-scripts
npx playwright install chromium
npm run check
```

La instalación de dependencias no se completó en esta sesión. Las pruebas se ejecutaron con Playwright 1.62.1 ya disponible y Edge instalado. En este equipo se pueden reproducir así, en PowerShell:

```powershell
$env:PLAYWRIGHT_MODULE='C:\Users\lucas\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\index.mjs'
$env:BROWSER_CHANNEL='msedge'
node --test tests/app.e2e.mjs
```

Los tests de navegador usan Supabase simulado y un servidor local en 4184. No usan cuentas reales. El workflow de CI instala Chromium; todavía no se ha ejecutado en GitHub. No se generó lockfile sin una instalación resuelta: revisarlo antes de publicar.

## Estructura

- `assets/js/app.js`: navegación, presentación y coordinación de exámenes.
- `assets/js/services`: puntuación, reloj, ciclos, almacenamiento, estadísticas y adaptador Supabase.
- `assets/js/modules`: explicaciones inglesas y marcado de frases académicas.
- `data`: seis bancos separados por módulo/origen y explicaciones académicas.
- `tests`: regresión frente a bed694d, unidades y recorridos de navegador.
- `reports`: inventario por pregunta, cambios de clave, exclusiones, línea base y resultados.
- `supabase`: SQL manual y guía de revisión; ningún script se aplica automáticamente.

La carga de bancos es diferida por módulo. El historial inglés guarda referencias y snapshots compartidos; se siguen leyendo intentos antiguos con preguntas completas. Las preguntas enviadas a Supabase siguen completas para compatibilidad. El botón de copia de seguridad exporta el estado local, incluidas copias protegidas cuando se detectan datos dañados.

Los ciclos se confirman al finalizar, nunca al seleccionar. El reloj usa una fecha límite persistida. Una recarga restaura respuestas, posición y tiempo restante; una fecha vencida finaliza una sola vez. Las preguntas ambiguas se excluyen de aleatorios y las neutralizadas no puntúan. El banco conserva todas las entradas aunque no sean utilizables.

## Revisión editorial y publicación

Consultar `reports/final-review.md`, `reports/english-bank-audit.md`, `reports/answer-changes.json` y `reports/ambiguous-questions.json`. Las 1.244 Stanley tienen dictamen editorial; 884 requieren cotejo y permanecen excluidas. No existe certificación contra el PDF/plantilla de origen.

`scripts/apply-stanley-review.mjs` reproduce la aplicación del dictamen registrado en `reports/stanley-review-decisions.json` y regenera los informes ingleses. Requiere conservar bed694d en el historial Git. Nunca usar una clave candidata como respuesta automática de una entrada excluida.

GitHub Pages puede servir estos archivos sin transformación, con rutas relativas. La prueba local usa el mismo prefijo del repositorio y comprueba funcionamiento offline. Esto no certifica el despliegue público. El service worker no fuerza activación durante una sesión; cerrar todas las pestañas permite adoptar una versión nueva. Incrementar su VERSION al publicar una nueva versión y volver a probar offline.

No se hizo push, merge ni publicación. Aplicar SQL o publicar exige revisión humana explícita.
