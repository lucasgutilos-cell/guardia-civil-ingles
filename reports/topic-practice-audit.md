# Auditoría de práctica por contenidos

## Alcance y banco protegido

El catálogo y sus reglas viven en `assets/js/services/topics.js`, módulo puro importable desde navegador y Node, sin acceso a red ni almacenamiento. Los pools contienen referencias a las preguntas conservadas y no las reescriben. La construcción de pools no modifica textos, opciones, claves, exclusiones ni metadatos del banco; tampoco escribe `reports/baseline.json`.

La asociación `questionTopic` clasifica el tema de una pregunta para enlazar desde una explicación. No autoriza su inclusión en entrenamiento: esa decisión corresponde exclusivamente a `buildTopicPools`, que rechaza preguntas oficiales y aplica los filtros adicionales de cada módulo.

## Catálogo y recuentos comprobados

| Módulo | ID | Contenido | Preguntas/frases |
| --- | --- | --- | ---: |
| Inglés | verb-tenses | Tiempos verbales y marcadores temporales | 216 |
| Inglés | conditionals-future | Condicionales y futuro | 125 |
| Inglés | modals-obligation | Modales, obligación y capacidad | 73 |
| Inglés | passive-voice | Voz pasiva | 38 |
| Inglés | relatives-questions | Pronombres, relativas e interrogativas | 79 |
| Inglés | quantifiers-nouns | Artículos, sustantivos y cuantificadores | 100 |
| Inglés | comparison-adverbs | Adjetivos, adverbios y comparación | 56 |
| Inglés | prepositions-patterns | Preposiciones, conectores y patrones verbales | 105 |
| Ortografía | bv | B/V | 68 |
| Ortografía | gj | G/J | 108 |
| Ortografía | h | H | 142 |
| Ortografía | accentuation | Acentuación | 74 |
| Ortografía | csz | C/S/Z | 31 |
| Ortografía | lly | LL/Y | 29 |
| Ortografía | xs-other | X/S y otras grafías | 48 |
| Gramática | agreement-impersonal | Concordancia e impersonales | 120 |
| Gramática | pronouns-relatives | Pronombres y relativos | 80 |
| Gramática | que-regime | Queísmo, dequeísmo y régimen | 100 |
| Gramática | verb-mood | Formas verbales y modo | 100 |
| Gramática | normative-constructions | Construcciones normativas | 100 |

Totales: **792 preguntas inglesas**, **500 frases ortográficas**, **500 frases gramaticales**. Los pools de cada módulo son disjuntos por ID. Las 500 frases ortográficas y las 500 preguntas gramaticales quedan asignadas exactamente una vez a práctica por contenidos.

### Inglés: elegibilidad y deduplicación

- Solo entrenamiento con `answerStatus === "editorial-reviewed"`, `reviewConfidence === "high"`, clave existente en las opciones, `excludeRandom !== true` y sin neutralización.
- Las 500 generadas producen **433** preguntas temáticas al deduplicar exclusivamente por `pregunta.trim()`. Cada grupo conserva el ID lexicográficamente menor. Esta deduplicación no cambia el banco ni otros modos.
- De las 360 Stanley con revisión alta, **359** entran en contenidos. Se exige un hueco explícito de guiones bajos, al menos dos puntos o el carácter `…`. Los puntos separados por espacios también representan un hueco: `stanley-27-20` contiene literalmente `. . . .`.
- Se excluye `stanley-03-03`, cuyo juego de opciones es morning/afternoon/evening/night. Las entradas sin hueco permanecen fuera aunque en el futuro recibieran una revisión alta.
- Las Stanley usan `tipo: "generada"` en el banco histórico. El constructor distingue sus prefijos `stanley-`/`generada-`; no confunde ese campo histórico con procedencia generada.
- No se crea un contenido de estilo indirecto ni se asignan temas desconocidos por una regla residual.

Los nueve temas mixtos siguen los criterios literales del encargo, incluidos los demostrativos en pregunta **u opciones**, los medios de transporte, los cuantificadores y las palabras de la opción admitida en «The one who / Nouns as adjectives». El mapa explícito incorpora el genitivo posesivo como patrón, y las instrucciones/propuestas imperativas junto a modales. No se altera el `tema` almacenado.

### Ortografía

Solo se aceptan frases de entrenamiento de cuatro elementos B/M. El entrenamiento se amplía de tres a **siete bloques específicos**: B/V, G/J, H, Acentuación, C/S/Z, LL/Y y X/S + otras grafías. Las 500 frases nuevas quedan asignadas exactamente una vez sin editar el banco.

Cada frase contiene dos objetivos incorrectos. Para mantener pools disjuntos y, a la vez, asegurar presencia real del contenido que anuncia la tarjeta, la clasificación aplica una prioridad pedagógica estable a las familias menos frecuentes: LL/Y → C/S/Z → X/S/Grafía → H → G/J → Acentuación → B/V. El bloque elegido siempre está presente entre los errores de la frase; el segundo error puede pertenecer a otra familia, conservando el contexto mixto propio del examen. Las frases sin elementos M o con reglas desconocidas quedan fuera.

### Gramática

La asignación se basa en coincidencia exacta de las 25 reglas de entrenamiento, sin inferencias sobre palabras sueltas de la frase. Una regla desconocida devuelve `null`.

## Formatos, modos y ciclos

| Módulo | Sesión | Duración | Aprobación |
| --- | --- | --- | --- |
| Inglés | 20 preguntas | 900 s / 15 min | Puntuación oficial +1, −1/3, blanco 0; APTO desde 8 |
| Ortografía | 5 frases / 20 elementos | 420 s / 7 min | Máximo 5 fallos |
| Gramática | 20 frases | 720 s / 12 min | Máximo 5 fallos |

Se conserva **Formato oficial: 20 preguntas · 15 min**. El nivel temático se presenta como **Nivel examen**.

Los modos son `topic:<topicId>`, `academic_ortografia_topic:<topicId>` y `academic_gramatica_topic:<topicId>`. Su parser solo admite contenidos existentes del módulo correcto. Las etiquetas son `<Módulo> · Contenido · <nombre>`.

Las claves de ciclo independientes son `topic:<module>:<topicId>`. La selección usa las transacciones y `selectCycle` existentes: el borrador no modifica el estado persistido; abandonar conserva la instantánea, finalizar confirma el borrador. No hay duplicados dentro de una sesión. Al cruzar un ciclo se consumen todos los pendientes antes de completar con el siguiente. En voz pasiva, con 38 preguntas, el segundo test de 20 consume las 18 pendientes y toma 2 del ciclo nuevo.

## APTO y dominio

APTO sigue siendo el resultado de un examen. **Dominado** requiere los dos últimos intentos del mismo contenido, ordenados por fecha, aunque existan intentos de otros modos entre ellos:

- Inglés: cada intento con `correct >= 15 && score >= 12`.
- Ortografía y Gramática: cada intento con `correct >= 17`.

La marca permanente es `__mastery:v1:<module>:<topicId> = [timestampISO]`. `updateMastery` devuelve una copia de ciclos, conserva las marcas existentes aunque posteriores resultados empeoren o se compacte el historial y permite recalcular tras fusionar historial. `mergeCycles` conserva la unión de marcas recibidas. No se necesitan columnas ni SQL de Supabase.

`topicAttempts` y `topicSummary` calculan estadísticas de un modo temático exacto: número de intentos, último/mejor resultado, dominio y número de IDs usados del ciclo. Los intentos temáticos pueden identificarse mediante `parseTopicMode` para separarlos de los promedios de simulacros generales.

## Verificación del módulo de dominio

`node --test tests/topics.test.mjs`: **16 pruebas aprobadas, 0 fallos**.

Las pruebas comprueban catálogo y formatos, los 20 recuentos exactos, exclusión de oficiales, referencia y contenido de bancos sin mutación, deduplicación estable, todos los criterios mixtos, huecos/saludos Stanley, cobertura ortográfica completa y asignación única en siete bloques, cobertura gramatical, modos/etiquetas, ciclos en todos los contenidos, frontera de voz pasiva, rollback/commit provisional, umbrales de dominio, permanencia, unión de marcas y estadísticas propias.

Este resultado comprueba el dominio puro. La integración de interfaz, temporizadores, recuperación, historial, fallos, sincronización y offline debe contrastarse con los resultados E2E y de la suite final del encargo; esta auditoría no atribuye esas comprobaciones a las 16 pruebas unitarias anteriores.

## Límites de la evidencia

Los recuentos prueban la aplicación de los criterios de selección pedidos al banco conservado. No equivalen a una nueva auditoría lingüística ni a cotejo con plantilla oficial. Las explicaciones pedagógicas y sus anomalías se documentan de forma independiente en la auditoría del Profesor; este paquete no modifica ninguna clave para resolverlas.
