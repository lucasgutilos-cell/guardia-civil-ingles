import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {loadBanks} from '../scripts/banks.mjs';
import {TOPICS, buildTopicPools, topicConfig, topicMode, topicLabel, topicCycleKey, masteryKey} from '../assets/js/services/topics.js';
import {createE2EHarness, activeExam, readLocal, enterModule, loginMock} from './e2e-helpers.mjs';

const {groups} = loadBanks();
const training = {english: groups.englishTraining, ortografia: groups.orthographyTraining, gramatica: groups.grammarTraining};
const pools = Object.fromEntries(Object.entries(training).map(([module, bank]) => [module, buildTopicPools(module, bank)]));
const byId = Object.fromEntries(Object.entries(training).map(([module, bank]) => [module, new Map(bank.map(question => [question.id, question]))]));
const CYCLES = 'gcEnglishQuestionCycles', HISTORY = 'gcEnglishHistory';
let harness;
before(async () => {harness = await createE2EHarness(4185);});
after(async () => {await harness?.close();});
const card = (page, topicId) => page.locator(`.topic-card[data-topic-id="${topicId}"]`);
const testSelector = module => module === 'english' ? '.qcard' : '.academic-test';
const resultSelector = module => module === 'english' ? '.result' : '.academic-result';

async function startTopic(page, module, topicId) {
  await card(page, topicId).getByRole('button').click();
  await page.locator(testSelector(module)).waitFor();
  return activeExam(page);
}
async function finishTopic(page, module, correctCount = 20) {
  const saved = await activeExam(page);
  const items = saved.questionIds.map(id => byId[module].get(id));
  let position = 0;
  const answerPlan = items.map(question => {
    const expected = module === 'english' ? [question.respuesta_correcta] : module === 'ortografia' ? question.elementos_destacados.map(element => element.respuesta) : [question.respuesta];
    return expected.map(key => position++ < correctCount ? key : module === 'english' ? ['a', 'b', 'c', 'd'].find(option => !(question.validAnswers || [key]).includes(option)) : key === 'B' ? 'M' : 'B');
  });
  await page.evaluate(({module, answerPlan}) => {
    answerPlan.forEach((answers, index) => {
      if (module === 'english') {goTo(index); choose(answers[0]);}
      else {academicGo(index); answers.forEach((answer, position) => academicChoose(position, answer));}
    });
  }, {module, answerPlan});
  await page.getByRole('button', {name: 'Finalizar', exact: true}).click();
  await page.locator(resultSelector(module)).waitFor();
  assert.equal(await activeExam(page), null);
  return page.evaluate(module => module === 'english' ? window.__lastResult : window.__lastAcademicResult, module);
}

test('all 16 topic cards show exact counts and launch only their pool with official clocks', async t => {
  const {page} = await harness.setup(t);
  for (const [module, topics] of Object.entries(TOPICS)) {
    await enterModule(page, module);
    assert.equal(await page.locator('.topic-card').count(), topics.length);
    if (module === 'english') assert.match(await page.locator('body').innerText(), /Formato oficial: 20 preguntas · 15 min/);
    for (const topic of topics) {
      assert.match(await card(page, topic.id).innerText(), new RegExp(`${topic.count}\\s+${module === 'english' ? 'preguntas' : 'frases'}`, 'i'));
      assert.match(await card(page, topic.id).innerText(), /Nivel examen/);
      assert.doesNotMatch(await card(page, topic.id).innerText(), /Fácil|Media|Difícil/);
      const before = await page.evaluate(key => localStorage.getItem(key), CYCLES);
      const saved = await startTopic(page, module, topic.id), config = topicConfig(module, topic.id);
      assert.equal(saved.topicId, topic.id);
      assert.equal(saved.mode, module === 'english' ? topicMode(module, topic.id) : `topic:${topic.id}`);
      assert.equal(saved.questionIds.length, config.questions);
      assert.equal(new Set(saved.questionIds).size, config.questions);
      assert.equal(saved.deadline - saved.startedAt, config.duration * 1000);
      assert.ok(saved.questionIds.every(id => pools[module][topic.id].some(question => question.id === id)));
      assert.match(await page.locator('body').innerText(), /Nivel examen/);
      assert.equal(await page.locator('.professor').count(), 0, 'Professor never appears during an active exam');
      assert.equal(await page.evaluate(key => localStorage.getItem(key), CYCLES), before, 'Selection is provisional');
      await page.getByRole('button', {name: 'Abandonar', exact: true}).click();
      await card(page, topic.id).waitFor();
      assert.equal(await activeExam(page), null);
      assert.equal(await page.evaluate(key => localStorage.getItem(key), CYCLES), before, 'Abandon restores the original cycle');
    }
  }
});

test('topic recovery retains answers, position, topic ID and deadline in every module', async t => {
  const {page} = await harness.setup(t);
  for (const module of Object.keys(TOPICS)) {
    await enterModule(page, module);
    const topicId = TOPICS[module][0].id, original = await startTopic(page, module, topicId);
    await page.evaluate(module => {
      if (module === 'english') {choose('b'); goTo(2);}
      else {academicChoose(0, 'B'); academicGo(2);}
    }, module);
    const before = await activeExam(page);
    await page.reload();
    await page.locator(testSelector(module)).waitFor();
    const after = await activeExam(page);
    assert.equal(after.deadline, original.deadline);
    assert.equal(after.startedAt, original.startedAt);
    assert.equal(after.topicId, topicId);
    assert.equal(after.idx, 2);
    assert.deepEqual(after.answers, before.answers);
    assert.deepEqual(after.questionIds, original.questionIds);
    assert.deepEqual(after.transaction, before.transaction);
    await page.getByRole('button', {name: 'Abandonar', exact: true}).click();
    await card(page, topicId).waitFor();
    assert.equal(await readLocal(page, HISTORY), null);
  }
});

test('topic completion commits independent cycles, prevents repetition, stores failures and permanent mastery', async t => {
  const {page} = await harness.setup(t);
  for (const module of Object.keys(TOPICS)) {
    const topicId = TOPICS[module][0].id, cycleKey = topicCycleKey(module, topicId), mark = masteryKey(module, topicId);
    const failureKey = module === 'english' ? 'gcEnglishFailures' : `gcAcademicFailures_${module}`;
    await enterModule(page, module);
    const initial = await startTopic(page, module, topicId);
    const first = await finishTopic(page, module, 19);
    assert.equal(first.correct, 19);
    assert.equal(first.wrong, 1);
    assert.equal(first.mode, topicMode(module, topicId));
    assert.equal(first.label, topicLabel(module, topicId));
    assert.equal(first.topicId, topicId);
    assert.equal(first.total, 20);
    assert.equal((await readLocal(page, failureKey)).length, 1);
    assert.equal((await readLocal(page, CYCLES))[mark], undefined);
    assert.deepEqual(new Set((await readLocal(page, CYCLES))[cycleKey]), new Set(initial.questionIds));
    await enterModule(page, module);
    assert.match(await card(page, topicId).innerText(), /1\s+INTENTOS/i);
    const secondSelection = await startTopic(page, module, topicId);
    assert.ok(secondSelection.questionIds.every(id => !initial.questionIds.includes(id)));
    await finishTopic(page, module, 19);
    assert.equal((await readLocal(page, failureKey)).length, 2);
    const earned = (await readLocal(page, CYCLES))[mark];
    assert.equal(earned.length, 1);
    assert.ok(Number.isFinite(Date.parse(earned[0])));
    await enterModule(page, module);
    assert.match(await card(page, topicId).innerText(), /Dominado/);
    await startTopic(page, module, topicId);
    await finishTopic(page, module, 0);
    assert.deepEqual((await readLocal(page, CYCLES))[mark], earned);
    await enterModule(page, module);
    assert.match(await card(page, topicId).innerText(), /3\s+INTENTOS/i);
    assert.match(await card(page, topicId).innerText(), /Dominado/);
    const summary = module === 'english' ? '#statsHome' : '#academicStatsHome';
    assert.equal(await page.locator(`${summary} .stat b`).first().innerText(), '0', 'Topic attempts do not enter simulator averages');
    await page.reload();
    try {await page.getByRole('heading', {name: 'Elige el módulo'}).waitFor({timeout: 5000});}
    catch (error) {t.diagnostic(JSON.stringify({module, active: await activeExam(page), body: (await page.locator('body').innerText()).slice(0, 1500)})); throw error;}
    await enterModule(page, module);
    assert.match(await card(page, topicId).innerText(), /Dominado/);
  }
  const entries = await readLocal(page, HISTORY);
  assert.equal(entries.length, 9);
  await page.evaluate(() => showHistory());
  assert.equal(await page.locator('.history-row').count(), 9);
  assert.ok((await page.locator('.history-row').allTextContents()).every(text => text.includes('Contenido')));
  await page.evaluate(() => showGeneralStats());
  await page.getByRole('heading', {name: 'Detalle de práctica'}).waitFor();
  assert.match(await page.locator('body').innerText(), /Práctica por contenidos \(separada\): 9 intentos/);
  assert.match(await page.locator('body').innerText(), /Aún no hay resultados/);
});

test('passive topic consumes the last 18 entries before the next cycle and never duplicates a session', async t => {
  const {page} = await harness.setup(t);
  await enterModule(page, 'english');
  const first = await startTopic(page, 'english', 'passive-voice');
  await finishTopic(page, 'english', 20);
  await enterModule(page, 'english');
  const second = await startTopic(page, 'english', 'passive-voice');
  assert.equal(new Set(second.questionIds).size, 20);
  assert.equal(second.questionIds.filter(id => first.questionIds.includes(id)).length, 2);
  assert.ok(pools.english['passive-voice'].filter(question => !first.questionIds.includes(question.id)).every(question => second.questionIds.includes(question.id)));
  await finishTopic(page, 'english', 20);
  const cycles = await readLocal(page, CYCLES), key = topicCycleKey('english', 'passive-voice');
  assert.equal(cycles[key].length, 2);
  assert.deepEqual(cycles[`__epoch:${key}`], [1]);
});

test('mock cloud merges topic modes, cycles and mastery without new Supabase columns', async t => {
  const {page} = await harness.setup(t);
  const scenarios = [];
  for (const module of Object.keys(TOPICS)) {
    const topicId = TOPICS[module][0].id, key = topicCycleKey(module, topicId), mark = masteryKey(module, topicId);
    await enterModule(page, module);
    const first = await startTopic(page, module, topicId);
    await finishTopic(page, module, 20);
    const local = (await readLocal(page, HISTORY)).at(-1);
    const cloudOnlyId = pools[module][topicId].find(question => !first.questionIds.includes(question.id)).id;
    const remoteAttempt = {...local, schemaVersion: undefined, user_id: 'topics@example.test', date: new Date(Date.parse(local.date) - 1000).toISOString(), questions: first.questionIds.map(id => byId[module].get(id))};
    scenarios.push({module, topicId, key, mark, first, local, cloudOnlyId, remoteAttempt});
  }
  const otherMark = masteryKey('gramatica', 'verb-mood');
  await page.evaluate(({scenarios, otherMark}) => {
    window.__remote.attempts.push(...scenarios.map(scenario => scenario.remoteAttempt));
    const question_cycles = Object.fromEntries(scenarios.map(({key, cloudOnlyId}) => [key, [cloudOnlyId]]));
    question_cycles[otherMark] = ['2026-01-01T00:00:00.000Z'];
    window.__remote.profiles.push({id: 'topics@example.test', question_cycles});
  }, {scenarios, otherMark});
  await page.evaluate(() => home());
  await loginMock(page);
  await page.waitForFunction(({marks, otherMark}) => {
    const cycles = JSON.parse(localStorage.getItem('gcEnglishQuestionCycles'));
    return marks.every(mark => cycles?.[mark]?.length === 1) && cycles?.[otherMark]?.length === 1 && window.__remote.attempts.length === 6;
  }, {marks: scenarios.map(scenario => scenario.mark), otherMark});
  const cycles = await readLocal(page, CYCLES);
  assert.equal((await readLocal(page, HISTORY)).length, 6);
  for (const {module, topicId, key, mark, first, local, cloudOnlyId} of scenarios) {
    assert.ok(cycles[key].includes(cloudOnlyId));
    assert.ok(first.questionIds.every(id => cycles[key].includes(id)));
    await page.waitForFunction(({key, mark, count}) => window.__remote.profiles[0].question_cycles[key]?.length === count + 1 && window.__remote.profiles[0].question_cycles[mark]?.length === 1, {key, mark, count: first.questionIds.length});
    const uploaded = await page.evaluate(date => window.__remote.attempts.find(entry => entry.date === date), local.date);
    assert.equal(uploaded.mode, topicMode(module, topicId));
    assert.equal(uploaded.label, topicLabel(module, topicId));
    assert.equal(Object.hasOwn(uploaded, 'topicId'), false, 'Topic identity travels in the existing mode column');
    assert.equal(Object.hasOwn(uploaded, 'mastery'), false);
    await enterModule(page, module);
    assert.match(await card(page, topicId).innerText(), /Dominado/);
  }
});

test('topic controls work by keyboard on a narrow screen with visible focus and no overflow', async t => {
  const {page} = await harness.setup(t, {viewport: {width: 320, height: 740}});
  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const module of Object.keys(TOPICS)) {
    await enterModule(page, module);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const topicId = TOPICS[module][0].id, button = card(page, topicId).getByRole('button');
    const bounds = await button.boundingBox();
    assert.ok(bounds.height >= 44 && bounds.width >= 44);
    await button.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await button.evaluate(element => element === document.activeElement), true);
    const outline = await button.evaluate(element => ({style: getComputedStyle(element).outlineStyle, width: parseFloat(getComputedStyle(element).outlineWidth)}));
    assert.notEqual(outline.style, 'none');
    assert.ok(outline.width > 0);
    await page.keyboard.press('Enter');
    await page.locator(testSelector(module)).waitFor();
    assert.equal((await activeExam(page)).topicId, topicId);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await page.locator('[onclick],[onchange]').count(), 0);
    const abandon = page.getByRole('button', {name: 'Abandonar', exact: true});
    await abandon.focus();
    await page.keyboard.press('Enter');
    await card(page, topicId).waitFor();
  }
});

test('preparing offline caches all Professor JSON and topic modules, then topics work in all modules offline', async t => {
  const {page, context} = await harness.setup(t, {worker: true});
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.getByRole('button', {name: 'Preparar todos los bancos sin conexión'}).click();
  await page.waitForFunction(() => document.getElementById('appNotice')?.textContent.includes('disponibles sin conexión'));
  const required = ['assets/js/services/topics.js', 'assets/js/services/professor.js', 'assets/js/modules/professor/render.js', 'data/professor/rules.json', 'data/professor/english.json', 'data/professor/orthography.json', 'data/professor/grammar.json'];
  const cached = await page.evaluate(async () => {
    const cache = await caches.open('gc-static-v3-module-themes');
    return (await cache.keys()).map(request => request.url);
  });
  for (const path of required) assert.ok(cached.some(url => url.endsWith(path)), `${path} must be cached`);
  assert.ok(cached.every(url => url.startsWith(new URL(harness.url).origin)), 'No authentication or remote cloud response is cached');
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('heading', {name: 'Elige el módulo'}).waitFor();
  for (const path of required.filter(path => path.endsWith('.json'))) {
    const loaded = await page.evaluate(async path => {const response = await fetch(path); return {ok: response.ok, data: await response.json()};}, path);
    assert.equal(loaded.ok, true);
    assert.ok(loaded.data && typeof loaded.data === 'object');
  }
  for (const module of Object.keys(TOPICS)) {
    await enterModule(page, module);
    const topicId = TOPICS[module][0].id;
    const saved = await startTopic(page, module, topicId);
    assert.equal(saved.questionIds.length, topicConfig(module, topicId).questions);
    await finishTopic(page, module, 20);
    await page.getByRole('button', {name: '🔎 Ver revisión', exact: true}).click();
    await page.locator('.professor').first().waitFor();
    assert.equal(await page.locator('.professor-fallback').count(), 0);
  }
});
