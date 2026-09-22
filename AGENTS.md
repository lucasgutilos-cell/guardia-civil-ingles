# Reglas del proyecto

- Preservar `Formato oficial: 20 preguntas · 15 min` y 900 segundos para 20 preguntas inglesas. Intensivos e históricos deben identificarse por separado.
- No editar enunciados/opciones oficiales: el validador compara hashes con bed694d. No eliminar preguntas ni reservas. Documentar cambios de claves y colisiones de IDs.
- No confundir revisión estructural, dictamen lingüístico y verificación de fuente. candidateAnswers nunca equivale a validAnswers. Las entradas inciertas siguen excluidas.
- Nunca aplicar SQL de producción, publicar, hacer merge o push a main sin autorización explícita. Los archivos de supabase son manuales.
- Conservar historial, fallos y ciclos antiguos. Nuevos formatos deben tener lectura compatible y recuperación ante errores de almacenamiento.
- Seleccionar preguntas en una transacción provisional; confirmar al finalizar. Relojes basados en deadline persistido, no decrementos por intervalo.
- Separar precisión de puntuación penalizada. Usar errores / 3 exacto internamente.
- Escapar contenido antes de insertarlo como HTML. Mantener CSP y controles por teclado. No añadir dependencias de producción para funciones locales sencillas.
- Antes de entregar: validador, pruebas unitarias/regresión, sintaxis y E2E. Documentar exactamente qué no pudo verificarse. No regenerar ni sobrescribir baseline.json.
- Mantener los informes de revisión actualizados y no interpretar las advertencias históricas documentadas como permiso para introducir otras.
