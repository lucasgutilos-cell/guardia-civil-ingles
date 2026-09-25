// Pure topic catalog and domain rules. Bank objects are never changed here.
const catalog = {
  english: [
    ['verb-tenses', 'Tiempos verbales y marcadores temporales', 'Presente, pasado, tiempos perfectos y marcadores de tiempo.', 216],
    ['conditionals-future', 'Condicionales y futuro', 'Condiciones y distintas formas de hablar del futuro.', 125],
    ['modals-obligation', 'Modales, obligación y capacidad', 'Capacidad, obligación, instrucciones y propuestas con imperativo.', 73],
    ['passive-voice', 'Voz pasiva', 'Relación entre sujeto, acción y formas de la pasiva.', 38],
    ['relatives-questions', 'Pronombres, relativas e interrogativas', 'Referencias a personas y cosas, preguntas y question tags.', 79],
    ['quantifiers-nouns', 'Artículos, sustantivos y cuantificadores', 'Cantidad, existencia, posesión con have, número y demostrativos.', 100],
    ['comparison-adverbs', 'Adjetivos, adverbios y comparación', 'Adjetivos, adverbios, comparativos y superlativos.', 56],
    ['prepositions-patterns', 'Preposiciones, conectores y patrones verbales', 'Preposiciones, gerundio, infinitivo, colocaciones y patrón del genitivo.', 105]
  ],
  ortografia: [
    ['bv', 'B/V', 'Contrastes puros de b y v para fijar la grafía correcta dentro de la frase.', 68],
    ['gj', 'G/J', 'Foco en g y j, con combinaciones frecuentes y contexto real de examen.', 108],
    ['h', 'H', 'H inicial e intercalada en palabras conflictivas, con contexto mixto de examen.', 142],
    ['accentuation', 'Acentuación', 'Tildes, hiatos y acentuación de palabras que suelen inducir a error.', 74],
    ['csz', 'C/S/Z', 'Distingue c, s y z en palabras de grafía próxima y uso frecuente.', 31],
    ['lly', 'LL/Y', 'Contrasta ll e y en formas frecuentes y palabras de examen.', 29],
    ['xs-other', 'X/S y otras grafías', 'Practica x/s y otras grafías menos frecuentes que suelen pasar desapercibidas.', 48]
  ],
  gramatica: [
    ['agreement-impersonal', 'Concordancia e impersonales', 'Haber impersonal, número, participios y sujetos colectivos.', 120],
    ['pronouns-relatives', 'Pronombres y relativos', 'A personal, leísmo, pronombres y construcciones relativas.', 80],
    ['que-regime', 'Queísmo, dequeísmo y régimen', 'Preposiciones exigidas por verbos y enlaces con que.', 100],
    ['verb-mood', 'Formas verbales y modo', 'Verbos irregulares, subjuntivo, condicional compuesto y gerundio.', 100],
    ['normative-constructions', 'Construcciones normativas', 'Obligación, necesidad y construcciones comparativas de cantidad.', 100]
  ]
};
export const TOPICS = Object.freeze(Object.fromEntries(Object.entries(catalog).map(([module, rows]) => [module,
  Object.freeze(rows.map(([id, name, description, count]) => Object.freeze({id, name, description, count})))
])));

const MODULE_NAMES = Object.freeze({english: 'Inglés', ortografia: 'Ortografía', gramatica: 'Gramática'});
const MODULE_FORMAT = Object.freeze({
  english: Object.freeze({questions: 20, total: 20, duration: 900, passScore: 8}),
  ortografia: Object.freeze({questions: 5, total: 20, duration: 420, maxWrong: 5}),
  gramatica: Object.freeze({questions: 20, total: 20, duration: 720, maxWrong: 5})
});
const normalizeTheme = value => String(value || '').trim().toLowerCase().replace(/[’‘]/g, "'").replace(/\s*\/\s*/g, '/');
const ENGLISH_THEMES = Object.freeze({
  'verb-tenses': ['Present simple', 'Present continuous', 'Past simple', 'Past continuous + past simple', 'Present perfect', 'Used to', 'To be', 'Present / Habitual', 'Regular / Irregular verbs', 'Did', 'Past Continuous', 'Past Perfect'],
  'conditionals-future': ['Future: will', 'First conditional', 'Second conditional', 'Third conditional', 'Going to', 'Future Perfect', 'Conditional'],
  'modals-obligation': ['Modal verbs', 'Can / Could / To be able', 'Must / Have to', 'Imperative', 'Imperative / I think so'],
  'passive-voice': ['Passive voice', 'Active / Passive'],
  'relatives-questions': ['Question tags', 'Relative clauses', 'Relative Pronouns', 'Age / Question tags'],
  'quantifiers-nouns': ['Quantifiers', 'There is / There are', 'There is / There are / Much / Many', 'Some / Any / A / An', 'Had / Man-Men / Woman-Women / Child-Children / People', 'There was / There were'],
  'comparison-adverbs': ['Comparatives', 'Adverbs', 'Comparatives / Superlatives', 'Irregular comparatives / Superlatives'],
  'prepositions-patterns': ['Prepositions of time', 'Gerund / infinitive', 'Possessive case', 'On / In / At', 'Do / Make']
});
const ENGLISH_TOPIC_BY_THEME = new Map(Object.entries(ENGLISH_THEMES).flatMap(([id, themes]) => themes.map(theme => [normalizeTheme(theme), id])));
// Orthography questions contain two deliberately incorrect targets. To keep every
// training phrase in one and only one focused pool, rarer families take priority.
// The selected topic is always present in the phrase; secondary errors keep the
// mixed-exam feel without rewriting any bank entry.
const ORTHOGRAPHY_PRIORITY = Object.freeze([
  Object.freeze(['lly', new Set(['LL/Y'])]),
  Object.freeze(['csz', new Set(['C/S/Z'])]),
  Object.freeze(['xs-other', new Set(['X/S', 'Grafía'])]),
  Object.freeze(['h', new Set(['H'])]),
  Object.freeze(['gj', new Set(['G/J'])]),
  Object.freeze(['accentuation', new Set(['Acentuación'])]),
  Object.freeze(['bv', new Set(['B/V'])])
]);
const GRAMMAR_RULES = Object.freeze({
  'agreement-impersonal': ['Haber impersonal', 'Haber impersonal futuro', 'Concordancia con mayoría', 'Concordancia plural', 'Concordancia participio', 'Sujeto colectivo'],
  'pronouns-relatives': ['A personal', 'Leísmo femenino', 'Pronombre relativo que', 'Pronombre tras preposición'],
  'que-regime': ['Dequeísmo', 'Queísmo', 'Régimen verbal: acordarse', 'Régimen verbal: insistir', 'Durante + complemento'],
  'verb-mood': ['Andar', 'Satisfacer', 'Subjuntivo en condición', 'Condicional compuesto', 'Gerundio de simultaneidad'],
  'normative-constructions': ['Cuantas más + sustantivo', 'Cuanto más + verbo', 'Deber + infinitivo: obligación', 'Es necesario + infinitivo', 'Hay que + infinitivo']
});
const GRAMMAR_TOPIC_BY_RULE = new Map(Object.entries(GRAMMAR_RULES).flatMap(([id, rules]) => rules.map(rule => [rule, id])));

export function hasExplicitGap(text) {
  // Spaced dots in Stanley (". . . .") are an explicit gap too; do not consume
  // exterior spaces when reconstructing the sentence in the Professor module.
  return /_+|\.(?:\s*\.)+|…/.test(String(text || ''));
}
export function isGreetingQuestion(question) {
  const options = Object.values(question?.opciones || {}).map(value => String(value).trim().toLowerCase());
  return options.length === 4 && ['morning', 'afternoon', 'evening', 'night'].every(value => options.includes(value));
}
export function classifyEnglish(question) {
  if (!question || isGreetingQuestion(question)) return null;
  const theme = normalizeTheme(question.tema);
  const text = [question.pregunta, ...Object.values(question.opciones || {})].join(' ').toLowerCase();
  const accepted = String(question.opciones?.[question.respuesta_correcta] || '').toLowerCase();
  switch (theme) {
    case 'still/yet/already/since/for/during':
    case "do/does/don't/doesn't": return 'verb-tenses';
    case 'time/gerund': return 'prepositions-patterns';
    case 'was/were/this/that/these/those': return /\b(this|that|these|those)\b/.test(text) ? 'quantifiers-nouns' : 'verb-tenses';
    case 'future/shall/will/transport': return /\b(bicycle|plane|coach|taxi|foot)\b/.test(text) ? 'prepositions-patterns' : 'conditionals-future';
    case 'tell/say/so much/so many': return /\bso\s+(much|many)\b/.test(text) ? 'quantifiers-nouns' : 'prepositions-patterns';
    case 'much/many/interrogatives/possessives': return /\b(much|many|a\s+lot|lots\s+of)\b/.test(text) ? 'quantifiers-nouns' : 'relatives-questions';
    case 'the one who/nouns as adjectives': return /\b(one|ones|who|whom|which|whose|that)\b/.test(accepted) ? 'relatives-questions' : 'quantifiers-nouns';
    case 'has/have/adjectives/greetings': return /\b(has|have)\b/.test(text) ? 'quantifiers-nouns' : 'comparison-adverbs';
    default: return ENGLISH_TOPIC_BY_THEME.get(theme) || null;
  }
}
export function classifyOrthography(question) {
  const elements = question?.elementos_destacados;
  if (!Array.isArray(elements) || elements.length !== 4 || elements.some(element => !['B', 'M'].includes(element.respuesta))) return null;
  const wrong = elements.filter(element => element.respuesta === 'M');
  if (!wrong.length) return null;
  const rules = new Set(wrong.map(element => element.regla));
  return ORTHOGRAPHY_PRIORITY.find(([, allowed]) => [...rules].some(rule => allowed.has(rule)))?.[0] || null;
}
export function classifyGrammar(question) {
  return GRAMMAR_TOPIC_BY_RULE.get(question?.regla) || null;
}
export function questionTopic(module, question) {
  return module === 'english' ? classifyEnglish(question) : module === 'ortografia' ? classifyOrthography(question) : module === 'gramatica' ? classifyGrammar(question) : null;
}
function isOfficial(question) {
  return question?.es_oficial === true || question?.tipo === 'oficial' || question?.sourceType === 'official' || /^oficial(?:-|$)/.test(question?.id || '');
}
export function buildTopicPools(module, trainingArray) {
  const topics = TOPICS[module];
  if (!topics) return {};
  const pools = Object.fromEntries(topics.map(topic => [topic.id, []]));
  const source = Array.isArray(trainingArray) ? trainingArray : [];
  let eligible = source.filter(question => question && !isOfficial(question));
  if (module === 'english') {
    eligible = eligible.filter(question => question.answerStatus === 'editorial-reviewed' && question.reviewConfidence === 'high' && question.excludeRandom !== true && !question.neutralized && question.opciones?.[question.respuesta_correcta]);
    const generated = new Map();
    const stanley = [];
    for (const question of eligible) {
      if (question.id?.startsWith('generada-')) {
        const text = String(question.pregunta || '').trim();
        if (!text) continue;
        const existing = generated.get(text);
        if (!existing || question.id < existing.id) generated.set(text, question);
      } else if (question.id?.startsWith('stanley-') && hasExplicitGap(question.pregunta) && !isGreetingQuestion(question)) stanley.push(question);
    }
    eligible = [...generated.values(), ...stanley];
  } else {
    const prefix = module === 'ortografia' ? 'nueva-ortografia-' : 'nueva-gramatica-';
    eligible = eligible.filter(question => question.es_nueva === true && question.id?.startsWith(prefix));
  }
  const seen = new Set();
  for (const question of eligible) {
    if (seen.has(question.id)) continue;
    const topicId = questionTopic(module, question);
    if (pools[topicId]) {
      pools[topicId].push(question);
      seen.add(question.id);
    }
  }
  return pools;
}

export function topicDefinition(module, topicId) {
  return TOPICS[module]?.find(topic => topic.id === topicId) || null;
}
export function topicConfig(module, topicId) {
  const topic = topicDefinition(module, topicId);
  return topic ? {...MODULE_FORMAT[module], ...topic, level: 'Nivel examen'} : null;
}
export function topicMode(module, topicId) {
  if (!topicDefinition(module, topicId)) return null;
  return module === 'english' ? `topic:${topicId}` : `academic_${module}_topic:${topicId}`;
}
export function parseTopicMode(mode) {
  if (typeof mode !== 'string') return null;
  const match = /^(?:topic:|academic_(ortografia|gramatica)_topic:)([a-z][a-z-]*)$/.exec(mode);
  if (!match) return null;
  const module = match[1] || 'english', topicId = match[2];
  return topicDefinition(module, topicId) ? {module, topicId} : null;
}
export function topicLabel(module, topicId) {
  const topic = topicDefinition(module, topicId);
  return topic ? `${MODULE_NAMES[module]} · Contenido · ${topic.name}` : null;
}
export function topicCycleKey(module, topicId) {
  return topicDefinition(module, topicId) ? `topic:${module}:${topicId}` : null;
}
export function masteryKey(module, topicId) {
  return topicDefinition(module, topicId) ? `__mastery:v1:${module}:${topicId}` : null;
}
export function topicAttempts(module, topicId, history) {
  const mode = topicMode(module, topicId);
  if (!mode) return [];
  return (Array.isArray(history) ? history : []).filter(entry => entry && entry.mode === mode)
    .map((entry, index) => ({entry, index, time: Date.parse(entry.date) || 0}))
    .sort((a, b) => b.time - a.time || a.index - b.index).map(item => item.entry);
}
export function meetsMastery(module, attempt) {
  if (!attempt || !Number.isFinite(attempt.correct)) return false;
  return module === 'english' ? attempt.correct >= 15 && Number.isFinite(attempt.score) && attempt.score >= 12 :
    (module === 'ortografia' || module === 'gramatica') && attempt.correct >= 17;
}
export function updateMastery(history, cycles, nowISO) {
  const result = structuredClone(cycles && typeof cycles === 'object' && !Array.isArray(cycles) ? cycles : {});
  for (const [module, topics] of Object.entries(TOPICS)) {
    for (const {id} of topics) {
      const key = masteryKey(module, id);
      if (Array.isArray(result[key]) && result[key].length) continue;
      const lastTwo = topicAttempts(module, id, history).slice(0, 2);
      if (lastTwo.length === 2 && lastTwo.every(attempt => meetsMastery(module, attempt))) {
        const time = Date.parse(nowISO || lastTwo[0].date);
        result[key] = [new Date(Number.isFinite(time) ? time : 0).toISOString()];
      }
    }
  }
  return result;
}
export function topicSummary(module, topicId, history, cycles) {
  const attempts = topicAttempts(module, topicId, history);
  const metric = attempt => module === 'english' ? Number(attempt.score) || 0 : Number(attempt.correct) || 0;
  const best = attempts.reduce((winner, attempt) => !winner || metric(attempt) > metric(winner) ? attempt : winner, null);
  const cycle = cycles?.[topicCycleKey(module, topicId)];
  return {
    attempts: attempts.length,
    last: attempts[0] || null,
    best,
    mastered: Boolean(cycles?.[masteryKey(module, topicId)]?.length),
    used: Array.isArray(cycle) ? new Set(cycle).size : 0
  };
}
