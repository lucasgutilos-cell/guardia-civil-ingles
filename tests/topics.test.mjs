import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadBanks} from '../scripts/banks.mjs';
import {selectCycle, transaction} from '../assets/js/services/question-cycles.js';
import {mergeCycles} from '../assets/js/services/supabase.js';
import {
  TOPICS, buildTopicPools, classifyEnglish, classifyOrthography, classifyGrammar,
  questionTopic, hasExplicitGap, isGreetingQuestion, topicDefinition, topicConfig,
  topicMode, parseTopicMode, topicLabel, topicCycleKey, topicAttempts, topicSummary,
  masteryKey, meetsMastery, updateMastery
} from '../assets/js/services/topics.js';

const {groups} = loadBanks();
const training = {english: groups.englishTraining, ortografia: groups.orthographyTraining, gramatica: groups.grammarTraining};
const official = {english: groups.englishOfficial, ortografia: groups.orthographyOfficial, gramatica: groups.grammarOfficial};
const pools = Object.fromEntries(Object.entries(training).map(([module, bank]) => [module, buildTopicPools(module, bank)]));
const flat = module => Object.values(pools[module]).flat();
const attempt = (module, topicId, date, correct = 17, score = 16) => ({mode: topicMode(module, topicId), date, correct, score, total: 20});

test('topic catalog has the requested names, frozen definitions and exam formats', () => {
  assert.deepEqual(TOPICS.english.map(topic => topic.count), [216, 125, 73, 38, 79, 100, 56, 105]);
  assert.deepEqual(TOPICS.ortografia.map(topic => topic.count), [68, 108, 142, 74, 31, 29, 48]);
  assert.deepEqual(TOPICS.gramatica.map(topic => topic.count), [120, 80, 100, 100, 100]);
  assert.equal(TOPICS.english[0].name, 'Tiempos verbales y marcadores temporales');
  for (const [module, topics] of Object.entries(TOPICS)) {
    assert.ok(Object.isFrozen(topics));
    for (const topic of topics) {
      assert.ok(Object.isFrozen(topic));
      assert.ok(topic.description.length > 15);
      assert.equal(topicConfig(module, topic.id).level, 'Nivel examen');
      assert.equal(topicConfig(module, topic.id).total, 20);
    }
  }
  assert.equal(topicConfig('english', 'verb-tenses').duration, 900);
  assert.equal(topicConfig('english', 'verb-tenses').passScore, 8);
  assert.equal(topicConfig('ortografia', 'bv').questions, 5);
  assert.equal(topicConfig('ortografia', 'bv').duration, 420);
  assert.equal(topicConfig('gramatica', 'verb-mood').duration, 720);
  assert.equal(topicConfig('gramatica', 'verb-mood').maxWrong, 5);
});

for (const module of Object.keys(TOPICS)) {
  test(`${module}: exact topic counts, unique mapping, no official questions or bank mutations`, () => {
    const before = JSON.stringify(training[module]);
    const mixedInput = [...training[module], ...official[module]];
    const result = buildTopicPools(module, mixedInput);
    assert.deepEqual(Object.values(result).map(bank => bank.length), TOPICS[module].map(topic => topic.count));
    const questions = Object.values(result).flat();
    assert.equal(new Set(questions.map(question => question.id)).size, questions.length);
    const officialIds = new Set(official[module].map(question => question.id));
    for (const [topicId, bank] of Object.entries(result)) for (const question of bank) {
      assert.ok(!officialIds.has(question.id));
      assert.equal(questionTopic(module, question), topicId);
      assert.ok(training[module].includes(question), 'Pool keeps the original object, without rewriting a question');
    }
    assert.equal(JSON.stringify(training[module]), before);
    assert.deepEqual(buildTopicPools(module, official[module]), Object.fromEntries(TOPICS[module].map(topic => [topic.id, []])));
  });
}

test('English dedupe is exact after trim, local to generated topics, retaining lowest lexical ID', () => {
  const selected = flat('english');
  const generated = selected.filter(question => question.id.startsWith('generada-'));
  const stanley = selected.filter(question => question.id.startsWith('stanley-'));
  assert.equal(generated.length, 433);
  assert.equal(stanley.length, 359);
  assert.equal(selected.length, 792);
  assert.equal(groups.englishTraining.filter(question => question.id.startsWith('generada-')).length, 500);
  for (const question of generated) {
    const equivalent = groups.englishTraining.filter(other => other.id.startsWith('generada-') && other.pregunta.trim() === question.pregunta.trim());
    assert.equal(question.id, equivalent.map(other => other.id).sort()[0]);
  }
  const base = generated[0];
  const duplicates = [{...base, id: 'generada-z', pregunta: ` ${base.pregunta} `}, {...base, id: 'generada-a'}];
  const deduped = Object.values(buildTopicPools('english', duplicates)).flat();
  assert.equal(deduped.length, 1);
  assert.equal(deduped[0].id, 'generada-a');
  assert.equal(Object.values(buildTopicPools('english', [...duplicates].reverse())).flat()[0].id, 'generada-a');
});

test('English eligibility requires review, confidence, key and explicit Stanley gaps', () => {
  const base = flat('english').find(question => question.id.startsWith('stanley-'));
  for (const patch of [
    {answerStatus: 'unresolved'}, {reviewConfidence: 'medium'}, {excludeRandom: true}, {neutralized: true},
    {respuesta_correcta: 'z'}, {es_oficial: true}, {sourceType: 'official'}, {id: 'oficial-99-1'},
    {pregunta: 'She goes to the station.'}, {pregunta: 'She goes to the station. Then she leaves.'}
  ]) assert.equal(Object.values(buildTopicPools('english', [{...base, ...patch}])).flat().length, 0, JSON.stringify(patch));
  for (const text of ['She __ now.', 'She .... now.', 'She . . . now.', 'She … now.']) assert.equal(hasExplicitGap(text), true, text);
  for (const text of ['', 'She works.', 'She works. He sleeps.', null]) assert.equal(hasExplicitGap(text), false);
  assert.ok(flat('english').some(question => question.id === 'stanley-27-20'));
  const greeting = groups.englishTraining.find(question => question.id === 'stanley-03-03');
  assert.equal(isGreetingQuestion(greeting), true);
  assert.equal(classifyEnglish(greeting), null);
  assert.ok(!flat('english').some(question => question.id === greeting.id));
});

test('mixed English themes obey the requested question/option decision rules', () => {
  const make = (tema, pregunta, options = ['works', 'work', 'working', 'worked'], respuesta_correcta = 'a') => ({tema, pregunta, opciones: Object.fromEntries(options.map((value, index) => ['abcd'[index], value])), respuesta_correcta});
  const cases = [
    ['Still / Yet / Already / Since / For / During', 'We ___ already arrived.', undefined, 'verb-tenses'],
    ['Do / Does / Don’t / Doesn’t', 'She ___ work here.', undefined, 'verb-tenses'],
    ['Time / Gerund', 'I enjoy ___ early.', undefined, 'prepositions-patterns'],
    ['Was / Were / This / That / These / Those', 'These boys ___ at home.', undefined, 'quantifiers-nouns'],
    ['Was / Were / This / That / These / Those', 'Where ___ John?', ['was', 'were', 'is', 'are'], 'verb-tenses'],
    ['Future / Shall / Will / Transport', 'We go by ___ .', ['bicycle', 'plane', 'coach', 'taxi'], 'prepositions-patterns'],
    ['Future / Shall / Will / Transport', 'We ___ go tomorrow.', ['will', 'went', 'goes', 'go'], 'conditionals-future'],
    ['Tell / Say / So much / So many', 'There is ___ water.', ['so much', 'so many', 'few', 'several'], 'quantifiers-nouns'],
    ['Tell / Say / So much / So many', 'Please ___ me.', ['tell', 'say', 'told', 'said'], 'prepositions-patterns'],
    ['Much / Many / Interrogatives / Possessives', 'There are ___ cars.', ['lots of', 'much', 'little', 'a lot'], 'quantifiers-nouns'],
    ['Much / Many / Interrogatives / Possessives', '___ book is it?', ['whose', 'who', 'whom', 'which'], 'relatives-questions'],
    ['The one who / Nouns as adjectives', 'He is ___ called.', ['the one who', 'one who the', 'the which', 'whom the'], 'relatives-questions'],
    ['The one who / Nouns as adjectives', 'It is a ___.', ['water bottle', 'bottle water', "water's bottle", 'bottle of'], 'quantifiers-nouns'],
    ['Has / Have / Adjectives / Greetings', 'They ___ a car.', ['have', 'has', 'is', 'are'], 'quantifiers-nouns'],
    ['Has / Have / Adjectives / Greetings', 'They are ___ dogs.', ['big', 'bigs', 'bigger', 'biggest'], 'comparison-adverbs']
  ];
  for (const [theme, question, options, expected] of cases) assert.equal(classifyEnglish(make(theme, question, options)), expected, theme);
  assert.equal(classifyEnglish(make('Reported speech', 'She ___ him.')), null);
  assert.equal(classifyEnglish(null), null);
});

test('orthography assigns all 500 phrases once across seven focused families without rewriting entries', () => {
  const make = rules => ({elementos_destacados: rules.map(regla => ({regla, respuesta: regla ? 'M' : 'B'}))});
  assert.equal(classifyOrthography(make(['B/V', 'B/V', null, null])), 'bv');
  assert.equal(classifyOrthography(make(['G/J', 'B/V', null, null])), 'gj');
  assert.equal(classifyOrthography(make(['H', 'Acentuación', null, null])), 'h');
  assert.equal(classifyOrthography(make(['Acentuación', 'B/V', null, null])), 'accentuation');
  assert.equal(classifyOrthography(make(['C/S/Z', 'B/V', null, null])), 'csz');
  assert.equal(classifyOrthography(make(['G/J', 'LL/Y', null, null])), 'lly');
  assert.equal(classifyOrthography(make(['X/S', 'Grafía', null, null])), 'xs-other');
  assert.equal(classifyOrthography(make([null, null, null, null])), null);
  assert.equal(classifyOrthography(make(['Unknown', null, null, null])), null);
  assert.equal(classifyOrthography({elementos_destacados: []}), null);
  assert.equal(classifyOrthography(null), null);
  assert.equal(flat('ortografia').length, 500);
});

test('grammar assigns all 500 training entries once through 25 exact named rules', () => {
  assert.equal(flat('gramatica').length, 500);
  assert.equal(new Set(groups.grammarTraining.map(question => question.regla)).size, 25);
  assert.ok(groups.grammarTraining.every(question => classifyGrammar(question)));
  assert.equal(classifyGrammar({regla: 'Construcción desconocida'}), null);
  assert.equal(classifyGrammar(null), null);
});

test('topic modes, labels, independent cycle keys and invalid values round-trip safely', () => {
  const keys = new Set();
  for (const [module, topics] of Object.entries(TOPICS)) for (const {id, name} of topics) {
    assert.deepEqual(parseTopicMode(topicMode(module, id)), {module, topicId: id});
    assert.equal(topicCycleKey(module, id), `topic:${module}:${id}`);
    assert.equal(masteryKey(module, id), `__mastery:v1:${module}:${id}`);
    assert.ok(topicLabel(module, id).endsWith(` · Contenido · ${name}`));
    assert.ok(!keys.has(topicCycleKey(module, id)));
    keys.add(topicCycleKey(module, id));
  }
  for (const mode of [null, {}, 'official', 'topic:made-up', 'topic:verb-tenses:extra', 'academic_english_topic:verb-tenses', 'academic_gramatica_topic:bv', 'academic_ortografia_topic:bv\n', 'topic:verb-tenses<script>']) assert.equal(parseTopicMode(mode), null);
  assert.equal(topicDefinition('unknown', 'unknown'), null);
  assert.equal(topicMode('english', 'unknown'), null);
  assert.equal(topicLabel('english', 'unknown'), null);
  assert.equal(topicCycleKey('english', 'unknown'), null);
  assert.deepEqual(buildTopicPools('unknown', []), {});
});

for (const [module, topics] of Object.entries(TOPICS)) {
  test(`${module}: each topic cycle is provisional, unique, commits explicitly and closes boundaries`, () => {
    for (const {id} of topics) {
      const pool = pools[module][id], count = topicConfig(module, id).questions, key = topicCycleKey(module, id);
      let cycles = {unrelated: ['persisted']};
      const tx = transaction(cycles);
      const first = selectCycle(pool, tx.draft[key], count, question => question.id, () => 0.5);
      tx.draft[key] = first.used;
      assert.equal(first.questions.length, count);
      assert.equal(new Set(first.questions.map(question => question.id)).size, count);
      assert.deepEqual(cycles, {unrelated: ['persisted']}, 'Unfinished selection is not persisted');
      assert.deepEqual(tx.snapshot, cycles, 'Abandoning can restore the original snapshot');
      cycles = tx.draft;
      const second = selectCycle(pool, cycles[key], count, question => question.id, () => 0.5);
      const repeated = second.questions.filter(question => first.questions.some(previous => previous.id === question.id));
      if (pool.length >= count * 2) assert.equal(repeated.length, 0);
      else {
        // Passive voice has 38 entries: the second 20-question session must
        // consume the 18 pending entries before drawing two in the next cycle.
        assert.equal(second.advanced, true);
        assert.equal(repeated.length, count * 2 - pool.length);
        assert.ok(pool.filter(question => !first.questions.includes(question)).every(question => second.questions.includes(question)));
      }
      const prior = pool.slice(0, -2).map(question => question.id);
      const crossing = selectCycle(pool, prior, count, question => question.id, () => 0.5);
      assert.equal(crossing.advanced, true);
      assert.equal(crossing.used.length, count - 2);
      assert.equal(new Set(crossing.questions.map(question => question.id)).size, count);
      assert.ok(pool.slice(-2).every(pending => crossing.questions.includes(pending)));
      assert.equal(selectCycle(pool, [], pool.length, question => question.id, () => 0.5).used.length, 0);
      assert.deepEqual(cycles.unrelated, ['persisted']);
    }
  });
}

test('mastery is separate from passing and requires the latest two attempts of the same topic', () => {
  const id = 'verb-tenses', key = masteryKey('english', id);
  const first = attempt('english', id, '2026-09-20T10:00:00Z', 15, 12);
  const second = attempt('english', id, '2026-09-22T10:00:00Z', 16, 14);
  const other = attempt('english', 'passive-voice', '2026-09-21T10:00:00Z', 0, 0);
  assert.equal(meetsMastery('english', {...first, correct: 14}), false);
  assert.equal(meetsMastery('english', {...first, score: 11.9999}), false);
  assert.equal(meetsMastery('english', {...first, score: 8}), false);
  assert.equal(meetsMastery('english', {...first, correct: '15'}), false);
  assert.equal(meetsMastery('english', first), true);
  assert.equal(updateMastery([first], {})[key], undefined);
  const original = {x: ['a']};
  const result = updateMastery([first, other, second], original);
  assert.deepEqual(result[key], ['2026-09-22T10:00:00.000Z']);
  assert.deepEqual(original, {x: ['a']});
  const failedLast = attempt('english', id, '2026-09-23T10:00:00Z', 14, 13);
  assert.equal(updateMastery([first, second, failedLast], {})[key], undefined);
  assert.deepEqual(updateMastery([failedLast], result)[key], result[key], 'Already earned mastery is permanent');
  assert.deepEqual(updateMastery([], result)[key], result[key], 'History compaction does not remove mastery');
});

test('academic mastery uses correct >= 17 and cloud union/recalculation preserves achievements', () => {
  for (const module of ['ortografia', 'gramatica']) {
    const id = TOPICS[module][0].id, key = masteryKey(module, id);
    const first = attempt(module, id, '2026-09-20T10:00:00Z', 17, 0);
    const second = attempt(module, id, '2026-09-21T10:00:00Z', 19, 0);
    assert.equal(meetsMastery(module, {...first, correct: 16}), false);
    assert.equal(meetsMastery(module, first), true);
    assert.deepEqual(updateMastery([first, second], {})[key], ['2026-09-21T10:00:00.000Z']);
    const cycles = mergeCycles({[key]: ['2026-09-18T00:00:00.000Z']}, {[key]: ['2026-09-19T00:00:00.000Z']});
    assert.equal(updateMastery([], cycles)[key].length, 2);
    assert.ok(updateMastery([second, first], mergeCycles({}, {}))[key]);
  }
});

test('topic summaries and sorted attempts remain independent from other contents and simulators', () => {
  const id = 'verb-tenses', module = 'english', cycleKey = topicCycleKey(module, id);
  const older = attempt(module, id, '2026-09-20T00:00:00Z', 18, 17);
  const newer = attempt(module, id, '2026-09-22T00:00:00Z', 16, 14);
  const history = [older, {mode: 'official', date: '2026-09-23T00:00:00Z', correct: 20, score: 20}, attempt(module, 'passive-voice', '2026-09-21T00:00:00Z'), newer];
  const cycles = updateMastery(history, {[cycleKey]: ['one', 'two', 'one']});
  const summary = topicSummary(module, id, history, cycles);
  assert.equal(summary.attempts, 2);
  assert.equal(summary.last, newer);
  assert.equal(summary.best, older);
  assert.equal(summary.mastered, true);
  assert.equal(summary.used, 2);
  assert.deepEqual(topicAttempts(module, id, history), [newer, older]);
  assert.equal(history[0], older, 'Sorting must not mutate history');
  assert.equal(history.filter(entry => !parseTopicMode(entry.mode)).length, 1);
  assert.deepEqual(topicSummary('english', 'passive-voice', [], {}), {attempts: 0, last: null, best: null, mastered: false, used: 0});
});
