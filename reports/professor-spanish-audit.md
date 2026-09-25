# Auditoría del Profesor: español

Los seis bancos y baseline.json no son salidas de este generador. La cobertura materializada es de 2480 elementos ortográficos y 640 frases gramaticales. Todos los dictámenes son editoriales o anomalías: no se cotejó ninguna clave con una plantilla oficial.

## Cobertura

```json
{
  "orthography": {
    "official": {
      "editorial": 471,
      "anomaly": 9
    },
    "training": {
      "editorial": 2000,
      "anomaly": 0
    }
  },
  "grammar": {
    "official": {
      "editorial": 139,
      "anomaly": 1
    },
    "training": {
      "editorial": 420,
      "anomaly": 80
    }
  }
}
```

## Revisión lingüística

Se revisaron los 120 contextos ortográficos oficiales, sus 480 elementos (237 M y 243 B), las 140 frases gramaticales oficiales y las familias de entrenamiento. Las correcciones oficiales ortográficas están asignadas por ID y posición, incluidas las dos apariciones de asta. Se verificaron invariantes B/M, diferencias y pertenencia a las familias; se conservan como bankRule las etiquetas de entrenamiento, algunas imprecisas, y se explica la grafía real en el archivo lateral.

Las explicaciones antiguas genéricas no se reutilizan. En particular Dime lo que tengo que hacer y El coche llevo mucho tiempo sin usarlo evitan dos reparaciones incorrectas anteriores. La lectura acarreás se conserva como voseo, sin imponer tuteo.

La consulta normativa de DPD confirmó la doble concordancia con mayoría, la posible simultaneidad del gerundio y los usos cultos compartidos de deber/deber de. Estas familias contienen claves M discutibles y se señalan, sin cambiarlas. Las anomalías no acreditan una nueva clave ni alteran automáticamente la puntuación del banco.

Referencias consultadas: [haber](https://www.rae.es/dpd/haber), [leísmo](https://www.rae.es/dpd/le%C3%ADsmo), [concordancia](https://www.rae.es/dpd/concordancia), [deber](https://www.rae.es/dpd/deber), [gerundio](https://www.rae.es/dpd/gerundio), [delante](https://www.rae.es/dpd/delante), [tilde](https://www.rae.es/dpd/tilde), [dequeísmo](https://www.rae.es/dpd/deque%C3%ADsmo), [elefante](https://www.rae.es/dpd/elefante), [duodécimo](https://www.rae.es/dpd/duod%C3%A9cimo). Las otras referencias de regla son orientación normativa enlazada, sin afirmar cotejo individual de plantilla.

## Anomalías que exigen revisión humana

| Módulo | ID | Clave conservada | Motivo |
|---|---|---|---|
| Ortografía | oficial-5-6:3 | M | Estranaba parece una transcripción dañada. Extrañaba encaja con las comidas en el extranjero, pero no acredita el texto original. |
| Ortografía | oficial-5-8:4 | M | Estravagantante tiene una secuencia duplicada o corrupta; extravagante es una reconstrucción editorial probable. |
| Ortografía | oficial-6-7:1 | M | Llantaba no identifica de forma segura el verbo original. Yantaba (comía) es una lectura posible para la yegua; no está acreditada por una plantilla. |
| Ortografía | oficial-8-1:2 | B | El banco marca B, pero la palabra conservada opíaceos desplaza la tilde; la forma normativa es opiáceos. |
| Ortografía | oficial-11-4:2 | B | El banco marca B para refujio, pero el sustantivo se escribe refugio. |
| Ortografía | oficial-19-7:3 | M | El elemento hatazada no coincide con hatezada en la frase: hay corrupción de transcripción. Atezada es una lectura editorial posible, no una reconstrucción acreditada. |
| Ortografía | oficial-20-8:3 | B | El banco marca B para acerbo, pero un conjunto de normas es un acervo; acerbo significa áspero o cruel. |
| Ortografía | oficial-21-4:3 | M | Estrafios parece una lectura OCR de extraños; el sentido lo permite, pero no garantiza la grafía original. |
| Ortografía | oficial-22-7:1 | M | Cojá no permite recuperar con certeza el tiempo ni la persona originales; cogió encaja con se marchó, pero es una hipótesis editorial. |
| Gramática | oficial-2-8 | M | El banco conserva M, pero detrás de mí está bien formado; la explicación anterior también lo reconocía. No hay una corrección normativa que justifique esa clave. |
| Gramática | nueva-gramatica-041 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-043 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-045 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-047 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-049 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-051 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-053 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-055 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-057 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-059 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-081 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-083 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-085 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-087 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-089 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-091 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-093 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-095 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-097 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-099 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-121 | M | La clave M contradice una concordancia admitida: la mayoría de los aspirantes puede llevar aprobaron o aprobó. La versión singular no invalida la plural. |
| Gramática | nueva-gramatica-123 | M | La clave M contradice una concordancia admitida: la mayoría de los aspirantes puede llevar aprobaron o aprobó. La versión singular no invalida la plural. |
| Gramática | nueva-gramatica-125 | M | La clave M contradice una concordancia admitida: la mayoría de los aspirantes puede llevar aprobaron o aprobó. La versión singular no invalida la plural. |
| Gramática | nueva-gramatica-127 | M | La clave M contradice una concordancia admitida: la mayoría de los aspirantes puede llevar aprobaron o aprobó. La versión singular no invalida la plural. |
| Gramática | nueva-gramatica-129 | M | La clave M contradice una concordancia admitida: la mayoría de los aspirantes puede llevar aprobaron o aprobó. La versión singular no invalida la plural. |
| Gramática | nueva-gramatica-131 | M | La clave M contradice una concordancia admitida: la mayoría de los aspirantes puede llevar aprobaron o aprobó. La versión singular no invalida la plural. |
| Gramática | nueva-gramatica-133 | M | La clave M contradice una concordancia admitida: la mayoría de los aspirantes puede llevar aprobaron o aprobó. La versión singular no invalida la plural. |
| Gramática | nueva-gramatica-135 | M | La clave M contradice una concordancia admitida: la mayoría de los aspirantes puede llevar aprobaron o aprobó. La versión singular no invalida la plural. |
| Gramática | nueva-gramatica-137 | M | La clave M contradice una concordancia admitida: la mayoría de los aspirantes puede llevar aprobaron o aprobó. La versión singular no invalida la plural. |
| Gramática | nueva-gramatica-139 | M | La clave M contradice una concordancia admitida: la mayoría de los aspirantes puede llevar aprobaron o aprobó. La versión singular no invalida la plural. |
| Gramática | nueva-gramatica-281 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-283 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-285 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-287 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-289 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-291 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-293 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-295 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-297 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-299 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-361 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-363 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-365 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-367 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-369 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-371 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-373 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-375 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-377 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-379 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-401 | M | Salir cerrando admite una lectura simultánea o de modo. El enunciado no obliga a interpretar una segunda acción posterior, por lo que la clave M no es inequívoca. |
| Gramática | nueva-gramatica-403 | M | Salir cerrando admite una lectura simultánea o de modo. El enunciado no obliga a interpretar una segunda acción posterior, por lo que la clave M no es inequívoca. |
| Gramática | nueva-gramatica-405 | M | Salir cerrando admite una lectura simultánea o de modo. El enunciado no obliga a interpretar una segunda acción posterior, por lo que la clave M no es inequívoca. |
| Gramática | nueva-gramatica-407 | M | Salir cerrando admite una lectura simultánea o de modo. El enunciado no obliga a interpretar una segunda acción posterior, por lo que la clave M no es inequívoca. |
| Gramática | nueva-gramatica-409 | M | Salir cerrando admite una lectura simultánea o de modo. El enunciado no obliga a interpretar una segunda acción posterior, por lo que la clave M no es inequívoca. |
| Gramática | nueva-gramatica-411 | M | Salir cerrando admite una lectura simultánea o de modo. El enunciado no obliga a interpretar una segunda acción posterior, por lo que la clave M no es inequívoca. |
| Gramática | nueva-gramatica-413 | M | Salir cerrando admite una lectura simultánea o de modo. El enunciado no obliga a interpretar una segunda acción posterior, por lo que la clave M no es inequívoca. |
| Gramática | nueva-gramatica-415 | M | Salir cerrando admite una lectura simultánea o de modo. El enunciado no obliga a interpretar una segunda acción posterior, por lo que la clave M no es inequívoca. |
| Gramática | nueva-gramatica-417 | M | Salir cerrando admite una lectura simultánea o de modo. El enunciado no obliga a interpretar una segunda acción posterior, por lo que la clave M no es inequívoca. |
| Gramática | nueva-gramatica-419 | M | Salir cerrando admite una lectura simultánea o de modo. El enunciado no obliga a interpretar una segunda acción posterior, por lo que la clave M no es inequívoca. |
| Gramática | nueva-gramatica-441 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-443 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-445 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-447 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-449 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-451 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-453 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-455 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-457 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-459 | M | La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional. |
| Gramática | nueva-gramatica-461 | M | Debe de revisar puede expresar suposición y también obligación en el uso culto. El contexto no impone la lectura exclusiva que justificaría M. |
| Gramática | nueva-gramatica-463 | M | Debe de revisar puede expresar suposición y también obligación en el uso culto. El contexto no impone la lectura exclusiva que justificaría M. |
| Gramática | nueva-gramatica-465 | M | Debe de revisar puede expresar suposición y también obligación en el uso culto. El contexto no impone la lectura exclusiva que justificaría M. |
| Gramática | nueva-gramatica-467 | M | Debe de revisar puede expresar suposición y también obligación en el uso culto. El contexto no impone la lectura exclusiva que justificaría M. |
| Gramática | nueva-gramatica-469 | M | Debe de revisar puede expresar suposición y también obligación en el uso culto. El contexto no impone la lectura exclusiva que justificaría M. |
| Gramática | nueva-gramatica-471 | M | Debe de revisar puede expresar suposición y también obligación en el uso culto. El contexto no impone la lectura exclusiva que justificaría M. |
| Gramática | nueva-gramatica-473 | M | Debe de revisar puede expresar suposición y también obligación en el uso culto. El contexto no impone la lectura exclusiva que justificaría M. |
| Gramática | nueva-gramatica-475 | M | Debe de revisar puede expresar suposición y también obligación en el uso culto. El contexto no impone la lectura exclusiva que justificaría M. |
| Gramática | nueva-gramatica-477 | M | Debe de revisar puede expresar suposición y también obligación en el uso culto. El contexto no impone la lectura exclusiva que justificaría M. |
| Gramática | nueva-gramatica-479 | M | Debe de revisar puede expresar suposición y también obligación en el uso culto. El contexto no impone la lectura exclusiva que justificaría M. |

## Límites

La comprobación estructural automática no equivale a revisión lingüística independiente ni a cotejo con originales oficiales. Las reconstrucciones de grafías corruptas se muestran como propuestas editoriales y nunca como certeza documental. El catálogo temático conserva sus filtros y conteos solicitados aunque existan anomalías pedagógicas: resolver las claves requiere una autorización separada.
