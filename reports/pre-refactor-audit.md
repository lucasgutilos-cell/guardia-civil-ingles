# Auditoría previa

Base: bed694d. Backup reproducible: git show bed694d:index.html. Huella SHA-256, IDs, hashes de textos/opciones y modelos completos en baseline.json. No se incluye otra copia de 3 MB en producción.

HTML: 3165688 bytes; CSS, bancos y funciones globales inline; Supabase JS v2 sin versión fija por CDN. Sin build, tests ni CI.

- englishOfficial: 401
- englishTraining: 1744
- orthographyOfficial: 120
- grammarOfficial: 140
- orthographyTraining: 500
- grammarTraining: 500

19 bloques ingleses; 15 reservas separadas (varias sin ID/clave). El selector filtra historico!==false. Los IDs ausentes en reservas se conservan como ausencia original, no se usan para puntuar.

## Caracterización

Inglés: official/new/mixed/exam/failures; 20/40/60/100 a 45 segundos por pregunta, histórico de otro tamaño sin límite; APTO >=40%, error ×0.33, blanco cero. Académicos: B/M, 420/720 segundos, máximo 5 errores; entrenamiento por dificultad y fallos desbloqueados con 20 preguntas distintas. Histórico conserva preguntas; reservas fuera de tests.

Persistencia: gcEnglishHistory (máximo 50, preguntas completas), gcEnglishFailures, gcEnglishQuestionCycles, gcAcademicFailures_ortografia/gramatica, gcAcademicDifficulty. Supabase profiles(id,display_name,question_cycles), attempts(user_id,date,mode,label,total,correct,wrong,blank,score,penalty,elapsed,difficulty,questions,answers), failure_bank(user_id,question_id,question,added_at). No existe esquema SQL en el repositorio; tipos y políticas reales requieren revisión manual.

## Defectos comprobables por lectura

- start no toma snapshot antes de pickPool: abandono inglés no revierte el ciclo.
- Selección mixta persiste su primera mitad aunque la segunda falle.
- academicTake puede repetir un ID al cruzar ciclo; otras variantes reinician descartando pendientes.
- intervalos descuentan un segundo por callback y regalan tiempo en suspensión.
- logout borra datos locales; carga nube reemplaza historial y fallos sin merge.
- syncFailuresCloud borra toda la tabla del usuario, incluidos otros módulos.
- académico envía ciclos provisionales antes de terminar.
- historial académico remoto no reconstruye detalles y rompe revisión.
- estadística inglesa llama aciertos al porcentaje penalizado.
- ortografía de fallos puntúa total fijo 20 aunque seleccione hasta 20 frases (80 elementos).
- respuestas heurísticas etiquetadas Profesor IA; condicionales se clasifican todos como first conditional.
- fallback CDN simula escrituras exitosas sin persistir nada.
- no recuperación de examen ni manejo de cuota.

La auditoría lingüística y las limitaciones de evidencia se documentan por separado; una comprobación estructural no demuestra corrección gramatical.
