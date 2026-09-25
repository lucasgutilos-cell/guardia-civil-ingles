# Auditoría del Profesor: inglés

Cobertura materializada: **1261 preguntas** (401 oficiales, 500 generadas y 360 Stanley con revisión editorial alta). El generador no modifica los bancos fuente ni `reports/baseline.json`.

## Estado

```json
{
  "bySource": {
    "generated": 500,
    "official": 401,
    "stanley": 360
  },
  "byStatus": {
    "anomaly": 14,
    "editorial": 1247
  },
  "rules": 51,
  "anomalies": 14
}
```

Las 401 entradas oficiales disponen de explicación revisada por ítem y diagnóstico de las cuatro opciones. Las preguntas con varias lecturas admitidas conservan todas sus `validAnswers`; las neutralizadas se presentan como anomalías y nunca como una solución única. Las fichas generadas y Stanley usan el dictamen editorial del banco más una regla pedagógica determinista y fuentes permitidas de British Council/Cambridge.

## Seguridad y límites

El Profesor se ejecuta localmente y no consulta una IA remota. Las fuentes enlazadas respaldan reglas gramaticales, pero no certifican por sí solas la clave de una plantilla histórica. `sourceVerified` permanece en falso porque no se ha cotejado una plantilla oficial autenticada. Los snapshots históricos incompatibles usan el fallback seguro en lugar de fabricar una explicación.

## Anomalías neutralizadas

- **oficial-2-8**: Hay dos huecos y falta el verbo aumentado (p. ej. boosted) antes de their chances; las opciones solo resuelven el segundo segmento.
- **oficial-2-17**: Ninguna opción es correcta: debería ser should sleep u ought to sleep. Se conserva el texto original y se neutraliza la puntuación.
- **oficial-6-15**: Become carece de complemento; no se puede completar la frase con las opciones tal como está importada.
- **oficial-10-5**: El orden de always/usually/never antes de be puede ser enfático. Revisar la instrucción original y el criterio de mejor respuesta.
- **oficial-10-9**: Ambigüedad validada en revisión humana: b) who y d) that son sujetos válidos de la relativa especificativa. Se conserva en el modelo histórico, pero queda anulada para todos: no suma ni resta y no entra en el denominador. Dictamen lingüístico, no plantilla oficial verificada.
- **oficial-10-10**: El segundo hueco exige un sustantivo (p. ej. one), pero las opciones contienen preposiciones. Importación incompatible.
- **oficial-10-11**: Ambigüedad validada en revisión humana: a) is more friendly than y b) is not as friendly as son gramaticales con significados distintos. Sin contexto no hay clave única. Se conserva en el modelo histórico, anulada sin efecto sobre la nota. Dictamen lingüístico, no plantilla oficial verificada.
- **oficial-11-5**: Falta el segundo hueco después de and; las respuestas traen dos segmentos. No se reescribe el original.
- **oficial-11-14**: Falta el sujeto interrogativo What; ninguna opción forma una pregunta completa.
- **oficial-13-5**: El enunciado ya contiene la respuesta the highest building in y no tiene hueco.
- **oficial-13-13**: Working no tiene contexto suficiente: because of working resulta poco natural; requiere cotejo con original.
- **oficial-13-15**: Anomalía validada en revisión humana: ninguna opción es inequívocamente correcta en el texto conservado. Worked hardly no justifica aceptar c como solución definitiva; la combinación esperable well / hard no figura entre las opciones. Se retira la corrección propuesta c y se conserva b únicamente como clave histórica importada, no como solución válida. Pregunta anulada sin efecto sobre la nota; requiere cotejo con la fuente.
- **oficial-15-10**: Falta I en el enunciado y todas las opciones: ninguna forma una oración completa.
- **oficial-16-14**: And, but, because y so pueden formar estructuras gramaticales con relaciones discursivas distintas; contexto insuficiente.
