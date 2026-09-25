import { esc } from './core/html.js';
import { typeBadge } from './modules/english/explanations.js';
import { TOPICS, buildTopicPools, parseTopicMode, topicMode, topicLabel, topicCycleKey, topicSummary, updateMastery } from './services/topics.js';
import { createProfessorIndex, professorView, recurrentConceptFailures, correctedOrthographyPhrase } from './services/professor.js';
import { renderProfessor, renderDifference } from './modules/professor/render.js';
import { academicNormalizeText, academicFindElementRange, renderAcademicPhrase } from './modules/academic/phrases.js';
import { scoreEnglish, isCorrect, validAnswers } from './services/scoring.js';
import { remainingSeconds, elapsedSeconds, englishDuration, runTimer } from './services/timer.js';
import { selectCycle, shuffle, transaction } from './services/question-cycles.js';
import { readJSON, writeJSON, removeStored, onStorageError, compactAttempt, hydrateAttempt, mergeHistory, dumpStorage, ACTIVE_KEY } from './services/storage.js';
import { precision, summarize } from './services/stats.js';
import { createCloudClient, assertResult, mergeCycles, serialQueue } from './services/supabase.js';
import { SITE_URL } from './config.js';
let DATA = {
    examenes: []
  },
  OFICIALES = [],
  GENERADAS = [],
  ALL = [],
  EVALUABLE = [],
  RESERVA = [];
let ACADEMIC_BANK = {},
  TRAINING_ACADEMIC_BANK = {},
  AUDIT_GRAMMAR_RULES = {};
async function reviewHistoryEntry(i) {
  if (state.active || academicState.active) return;
  const h = history();
  let r = h[i];
  if (!r) return;
  const module = statsModuleFromAttempt(r);
  await ensureBank(module);
  if (state.active || academicState.active) return;
  r = hydrateAttempt(r, id => lookupQuestion(module, id));
  if (module !== 'english') r = rebuildAcademicDetails(r);
  if (String(r.mode || '').startsWith('academic_')) {
    window.__lastAcademicResult = r;
    renderAcademicResult(r);
    setTimeout(reviewAcademic, 0);
  } else {
    state.questions = r.questions || [];
    state.answers = r.answers || {};
    state.mode = r.mode;
    renderResult(r);
    setTimeout(() => reviewAll(r), 0);
  }
}
function reviewSavedAcademic(i) {
  reviewHistoryEntry(i);
}
let supabaseClient;
let currentUser = null;
const app = document.getElementById('app');
const MODULE_THEMES = new Set(['english', 'ortografia', 'gramatica']);
function setModuleTheme(module) {
  document.body.dataset.moduleTheme = MODULE_THEMES.has(module) ? module : 'neutral';
}
const state = {
  mode: null,
  questions: [],
  answers: {},
  idx: 0,
  timeLeft: 0,
  timer: null,
  startedAt: null,
  difficulty: 'Media',
  cycleSnapshot: null,
  topicId: null
};
const HISTORY_KEY = 'gcEnglishHistory';
const FAILURES_KEY = 'gcEnglishFailures';
const CYCLES_KEY = 'gcEnglishQuestionCycles';
const topicPools = {};
const professorIndexes = new Map();
const professorLoads = new Map();
async function ensureProfessor(module) {
  if (professorLoads.has(module)) return professorLoads.get(module);
  const file = module === 'english' ? 'english' : module === 'ortografia' ? 'orthography' : 'grammar';
  const pending = Promise.all([getJSON('data/professor/rules.json'),getJSON('data/professor/' + file + '.json')])
    .then(([rules,data]) => { const index=createProfessorIndex(data,rules); professorIndexes.set(module,index); return index; })
    .catch(error => {professorLoads.delete(module);throw error;});
  professorLoads.set(module,pending);
  return pending;
}
function professorHistory(module) {
  return history().filter(x=>statsModuleFromAttempt(x)===module).map(x=>hydrateAttempt(x,id=>lookupQuestion(module,id)));
}
const TOPIC_VISUALS = Object.freeze({
  english: Object.freeze({
    'verb-tenses': '🕒', 'conditionals-future': '🔀', 'modals-obligation': '🧭', 'passive-voice': '↔',
    'relatives-questions': '❓', 'quantifiers-nouns': '🔢', 'comparison-adverbs': '📈', 'prepositions-patterns': '🔗'
  }),
  ortografia: Object.freeze({'bv': 'B/V', 'gj': 'G/J', 'h': 'H', 'accentuation': 'Á', 'csz': 'C/Z', 'lly': 'LL/Y', 'xs-other': 'X/S'}),
  gramatica: Object.freeze({'agreement-impersonal': '≡', 'pronouns-relatives': '↪', 'que-regime': 'QUE', 'verb-mood': 'V', 'normative-constructions': '✓'})
});
function renderTopicCards(module) {
  const h=history(),cycles=questionCycles();
  const isEnglish=module==='english';
  const testSize=module==='ortografia'?5:20;
  const masteryGoal=isEnglish?'15 aciertos + 12 puntos':'17 aciertos';
  const unit=isEnglish?'preguntas':'frases';
  return `<section class="topic-practice topic-practice-${esc(module)}">
    <div class="topic-section-head">
      <span class="topic-eyebrow">Práctica dirigida</span>
      <h2>Entrenamiento por contenidos</h2>
      <p>Elige un bloque concreto y trabaja solo esa materia. Cada contenido guarda su progreso de forma independiente.</p>
      <div class="topic-section-pills"><span>${TOPICS[module].length} contenidos</span><span>${testSize} ${unit} por práctica</span><span>Nivel examen</span><span>Dominado: ${masteryGoal}</span></div>
    </div>
    <div class="topic-grid">${TOPICS[module].map((topic,index)=>{
      const summary=topicSummary(module,topic.id,h,cycles),count=topicPools[module]?.[topic.id]?.length || 0;
      const score=x=>x?Number(x.score).toFixed(2)+' / '+Number(x.total):'—';
      const action=isEnglish?`startEnglishTopic('${topic.id}')`:`startAcademicTopic('${module}','${topic.id}')`;
      const progress=count?Math.min(100,Math.round(summary.used/count*100)):0;
      const icon=TOPIC_VISUALS[module]?.[topic.id] || '•';
      const number=String(index+1).padStart(2,'0');
      const status=summary.mastered?'Dominado':summary.attempts?'En progreso':'Sin empezar';
      const statusClass=summary.mastered?' mastered':summary.attempts?' active':'';
      return `<article class="topic-card" data-topic-id="${esc(topic.id)}">
        <div class="topic-card-top"><span class="topic-icon" aria-hidden="true">${esc(icon)}</span><span class="topic-number">Contenido ${number}</span><span class="topic-level">Nivel examen</span></div>
        <div class="topic-card-copy"><h3>${esc(topic.name)}</h3><p>${esc(topic.description)}</p></div>
        <div class="topic-metrics">
          <div class="topic-metric"><b>${count}</b><span>${unit}</span></div>
          <div class="topic-metric"><b>${summary.attempts}</b><span>intentos</span></div>
          <div class="topic-metric"><b>${esc(score(summary.best))}</b><span>mejor marca</span></div>
        </div>
        <div class="topic-cycle"><div class="topic-cycle-label"><span>Recorrido del banco</span><strong>${summary.used}/${count}</strong></div><div class="topic-cycle-bar" role="progressbar" aria-label="Progreso del ciclo" aria-valuemin="0" aria-valuemax="${count}" aria-valuenow="${summary.used}"><i style="width:${progress}%"></i></div></div>
        <div class="topic-card-foot"><span class="topic-last">Último <b>${esc(score(summary.last))}</b></span><span class="topic-mastery${statusClass}"><i></i>${status}</span></div>
        <button class="topic-start-btn" data-click-action="${esc(action)}"><span>Practicar este contenido</span><b aria-hidden="true">→</b></button>
      </article>`;
    }).join('')}</div>
  </section>`;
}
async function startEnglishTopic(topicId) {
  if (state.active || academicState.active || !topicMode('english',topicId)) return;
  await ensureBank('english');
  if (state.active || academicState.active) return;
  state.transaction=transaction(questionCycles());
  state.cycleSnapshot=JSON.stringify(state.transaction.snapshot);
  state.selecting=true;
  try { state.questions=takeCycle(topicPools.english[topicId],topicCycleKey('english',topicId),20); }
  catch(error) {state.transaction=null;notice(error.message);return;}
  finally {state.selecting=false;}
  begin(topicMode('english',topicId));
}
async function startAcademicTopic(module,topicId) {
  if (state.active || academicState.active || !['ortografia','gramatica'].includes(module) || !topicMode(module,topicId)) return;
  await ensureBank(module);
  if (state.active || academicState.active) return;
  startAcademic(module,'topic:'+topicId);
}
function history() {
  const entries=readJSON(HISTORY_KEY,[]);
  if(!Array.isArray(entries)){notice('Historial con formato desconocido. Se conserva una copia antes de guardar cambios.');return [];}
  return entries.filter(x=>x&&typeof x==='object').map(x=>{
    const safe={...x};
    for(const key of ['total','correct','wrong','blank','score','penalty','elapsed'])safe[key]=Number.isFinite(Number(x[key]))?Number(x[key]):0;
    return safe;
  });
}
function failureBank() {
  return [...new Map(readJSON(FAILURES_KEY, []).filter(q => !q.academic_module).map(q => {
    const candidate = ALL.find(x => (x.id === q.id || x.legacyId === q.id) && (x.originalQuestion || x.pregunta) === q.pregunta) || ALL.find(x => x.id === q.id);
    return [candidate?.id || q.id, {
      ...q,
      ...candidate,
      _failureAddedAt: q._failureAddedAt,
      _failureCount: q._failureCount
    }];
  })).values()];
}
function questionCycles() {
  return readJSON(CYCLES_KEY, {});
}
function saveQuestionCycles(c) {
  writeJSON(CYCLES_KEY, c);
}
function takeCycle(pool, key, n) {
  const owner = state.selecting ? state : academicState;
  if (!owner.transaction) owner.transaction = transaction(questionCycles());
  const result = selectCycle(pool.filter(q => q.respuesta_correcta && !q.excludeRandom), owner.transaction.draft[key], n, qKey);
  owner.transaction.draft[key] = result.used;
  if (result.advanced) {
    const epoch = '__epoch:' + key;
    owner.transaction.draft[epoch] = [Number(owner.transaction.draft[epoch]?.[0] || 0) + 1];
  }
  return result.questions;
}
function qKey(q) {
  return q.id || 'q_' + btoa(unescape(encodeURIComponent((q.pregunta || '') + '|' + JSON.stringify(q.opciones || {})))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 80);
}
function rememberTrainingFailures(questions, answers) {
  const bank = failureBank(),
    seen = new Set(bank.map(q => qKey(q)));
  questions.forEach((q, i) => {
    const a = answers[i];
    if (!q.neutralized && !isCorrect(q, a)) {
      const k = qKey(q);
      clearFailureTombstone(q, 'english');
      const existing = bank.find(x => qKey(x) === k);
      if (existing) {
        existing._failureCount = (existing._failureCount || 1) + 1;
        existing._lastFailureAt = Date.now();
      } else {
        bank.push({
          ...q,
          _failureAddedAt: new Date().toISOString(),
          _lastFailureAt: Date.now(),
          _failureCount: 1
        });
        seen.add(k);
      }
    }
  });
  writeJSON(FAILURES_KEY, bank);
}
function resolveFailureTest(questions, answers) {
  const correctKeys = new Set();
  questions.forEach((q, i) => {
    if (isCorrect(q, answers[i])) correctKeys.add(qKey(q));
  });
  if (!correctKeys.size) return;
  const remaining = failureBank().filter(q => !correctKeys.has(qKey(q)));
  recordFailureDeletes(failureBank().filter(q => !remaining.some(x => x.id === q.id)), 'english');
  writeJSON(FAILURES_KEY, remaining);
}
function saveHistory(x) {
  const h = mergeHistory(history(), [compactAttempt(x)]);
  writeJSON(HISTORY_KEY, h);
}
function authModal() {
  app.insertAdjacentHTML('beforeend', `<div class="auth-modal" id="authModal"><div class="auth-box" role="dialog" aria-modal="true" aria-labelledby="authTitle"><div class="row" style="justify-content:space-between"><h2 id="authTitle" style="margin:0">Iniciar sesión</h2><button class="secondary" onclick="closeAuth()">Cerrar</button></div><p class="small">Crea una cuenta para guardar tus exámenes y fallos en la nube y recuperarlos desde cualquier dispositivo.</p><label for="authEmail">Email</label><input id="authEmail" type="email" autocomplete="email" placeholder="tu@email.com"><label for="authPassword">Contraseña</label><input id="authPassword" type="password" autocomplete="current-password" placeholder="Mínimo 6 caracteres"><div class="auth-actions"><button onclick="submitAuth('login')">Entrar</button><button class="secondary" onclick="submitAuth('signup')">Crear cuenta</button></div><div id="authMsg" role="status" class="auth-msg" style="display:none"></div></div></div>`);
}
function closeAuth() {
  const m = document.getElementById('authModal');
  if (m) m.remove();
}
function authMessage(text, error = false) {
  const el = document.getElementById('authMsg');
  if (!el) return;
  el.textContent = text;
  el.className = 'auth-msg' + (error ? ' error' : '');
  el.style.display = 'block';
}
async function submitAuth(kind) {
  if (!supabaseClient) {
    authMessage('Sin conexión. Reintenta cuando vuelvas a tener conexión.', true);
    return;
  }
  const email = (document.getElementById('authEmail')?.value || '').trim(),
    password = document.getElementById('authPassword')?.value || '';
  if (!email || !password) {
    authMessage('Introduce email y contraseña.', true);
    return;
  }
  if (password.length < 6) {
    authMessage('La contraseña debe tener al menos 6 caracteres.', true);
    return;
  }
  authMessage(kind === 'login' ? 'Entrando...' : 'Creando cuenta...');
  let result;
  if (kind === 'login') result = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });else result = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: SITE_URL
    }
  });
  if (result.error) {
    authMessage(result.error.message, true);
    return;
  }
  if (kind === 'signup') {
    if (result.data.session) {
      closeAuth();
      await handleUser(result.data.user);
    } else authMessage('Cuenta creada. Revisa tu correo y pulsa el enlace de confirmación. Después vuelve a entrar aquí.');
  } else {
    closeAuth();
    await handleUser(result.data.user);
  }
}
function showAuth() {
  if (document.getElementById('authModal')) return;
  authModal();
}
async function signOut() {
  if (state.active || academicState.active) {
    alert('Termina o abandona el test antes de cerrar sesión.');
    return;
  }
  if (supabaseClient) {
    const result = await supabaseClient.auth.signOut({
      scope: 'local'
    });
    if (result.error) {
      notice(result.error.message);
      return;
    }
  }
  switchAccount(null);
  home();
}
async function handleUser(user) {
  if (user?.id === currentUser?.id) return;
  if (state.active || academicState.active) {
    notice('El cambio de cuenta se aplicará cuando termines el test.');
    return;
  }
  switchAccount(user);
  if (currentUser) {
    await ensureProfile();
    await loadCloudData();
  }
  if (!state.active && !academicState.active) home();
}
async function ensureProfile() {
  if (!currentUser || !supabaseClient) return;
  try {
    const uid = currentUser.id;
    const existing = assertResult(await supabaseClient.from('profiles').select('id').eq('id', uid).maybeSingle());
    if (!existing) assertResult(await supabaseClient.from('profiles').upsert({
      id: uid,
      display_name: (currentUser.email || 'Usuario').split('@')[0]
    }, {
      onConflict: 'id'
    }));
  } catch (error) {
    notice(error.message);
  }
}
async function loadCloudData() {
  return enqueueSync(async () => {
    if (!currentUser || !supabaseClient) return;
    const uid = currentUser.id;
    const [a, f, c] = await Promise.all([supabaseClient.from('attempts').select('*').eq('user_id', uid).order('date', {
      ascending: false
    }).limit(50), supabaseClient.from('failure_bank').select('question,question_id,added_at').eq('user_id', uid), supabaseClient.from('profiles').select('question_cycles').eq('id', uid).maybeSingle()]);
    if (uid !== currentUser?.id) return;
    const remote = assertResult(a) || [];
    const failures = assertResult(f) || [];
    const cloud = assertResult(c)?.question_cycles || {};
    const attempts = remote.map(x => ({
      ...x,
      score: Number(x.score),
      penalty: Number(x.penalty)
    }));
    writeJSON(HISTORY_KEY, mergeHistory(history(), attempts));
    const deleted = mergeFailureDeletes(readJSON('gcFailureDeletes', {}), cloud.__failureDeletesV1 || []);
    writeJSON('gcFailureDeletes', deleted);
    for (const module of ['english', 'ortografia', 'gramatica']) {
      const bank = module === 'english' ? failureBank() : academicFailureBank(module);
      const rows = failures.filter(r => module === 'english' ? !r.question?.academic_module : r.question?.academic_module === module);
      const merged = new Map(rows.filter(r => !failureIsDeleted(r.question, r.question_id, deleted)).map(r => [r.question.id, {
        ...r.question,
        _failureAddedAt: r.added_at
      }]));
      bank.forEach(q => {
        if (!failureIsDeleted(q, remoteFailureId(q, module), deleted)) merged.set(q.id, q);
      });
      if (module === 'english') writeJSON(FAILURES_KEY, [...merged.values()]);else saveAcademicFailureBank(module, [...merged.values()]);
    }
    saveQuestionCycles(updateMastery(history(), mergeCycles(questionCycles(), cloud)));
    // Pending local attempts remain in an outbox until a server acknowledgement.
    for (const x of history()) {
      if (remote.some(r => r.date === x.date && r.mode === x.mode)) continue;
      await uploadAttempt(x, uid);
    }
    await uploadFailures(uid);
    setSyncStatus('Sincronizado');
  });
}
async function uploadAttempt(x, uid) {
  const module = statsModuleFromAttempt(x);
  await ensureBank(module);
  const full = hydrateAttempt(x, id => lookupQuestion(module, id));
  if (uid !== currentUser?.id) return;
  const payload = {
    user_id: uid,
    date: x.date,
    mode: x.mode,
    label: x.label,
    total: x.total,
    correct: x.correct,
    wrong: x.wrong,
    blank: x.blank,
    score: x.score,
    penalty: x.penalty,
    elapsed: x.elapsed,
    difficulty: x.difficulty || '',
    questions: full.questions,
    answers: x.answers
  };
  const exists = assertResult(await supabaseClient.from('attempts').select('date').eq('user_id', uid).eq('date', x.date).limit(1));
  if (!exists?.length) assertResult(await supabaseClient.from('attempts').insert(payload));
}
async function saveAttemptCloud(x) {
  const uid = currentUser?.id;
  return enqueueSync(async () => {
    if (!uid || uid !== currentUser?.id || !supabaseClient) return;
    setSyncStatus('Sincronizando…');
    await uploadAttempt(x, uid);
    if (uid === currentUser?.id) setSyncStatus('Sincronizado');
  });
}
function remoteFailureId(q, module) {
  return module === 'english' ? qKey(q) : 'academic_' + module + '_' + q.id;
}
async function uploadFailures(uid) {
  const localDeletes = readJSON('gcFailureDeletes', {});
  const incoming = questionCycles();
  incoming.__failureDeletesV1 = Object.entries(localDeletes).map(([id, at]) => JSON.stringify({
    id,
    at
  }));
  const cloud = await publishCycles(uid, incoming);
  if (uid !== currentUser?.id) return;
  const deleted = mergeFailureDeletes(localDeletes, cloud.__failureDeletesV1 || []);
  const rows = ['english', 'ortografia', 'gramatica'].flatMap(module => (module === 'english' ? failureBank() : academicFailureBank(module)).map(q => ({
    user_id: uid,
    question_id: remoteFailureId(q, module),
    question: q,
    added_at: q._failureAddedAt || new Date().toISOString()
  }))).filter(row => !failureIsDeleted(row.question, row.question_id, deleted));
  if (rows.length) assertResult(await supabaseClient.from('failure_bank').upsert(rows, {
    onConflict: 'user_id,question_id'
  }));
  for (const id of Object.keys(deleted).filter(id => !rows.some(row => row.question_id === id))) {
    assertResult(await supabaseClient.from('failure_bank').delete().eq('user_id', uid).eq('question_id', id));
  }
  // Retain tombstones locally: stale devices must not resurrect a removed failure.
}
async function syncFailuresCloud() {
  return enqueueSync(async () => {
    if (currentUser && supabaseClient) {
      await uploadFailures(currentUser.id);
      setSyncStatus('Sincronizado');
    }
  });
}
async function syncQuestionCyclesCloud() {
  return enqueueSync(async () => {
    if (!currentUser || !supabaseClient) return;
    const uid = currentUser.id;
    await publishCycles(uid, questionCycles());
    if (uid === currentUser?.id) setSyncStatus('Sincronizado');
  });
}
async function publishCycles(uid, incoming) {
  if (typeof supabaseClient.rpc === 'function') {
    const result = await supabaseClient.rpc('merge_question_cycles', {
      incoming
    });
    if (!result.error) return result.data || incoming;
    if (!['PGRST202', '42883'].includes(result.error.code)) throw Error(result.error.message);
    notice('Sincronización compatible activa. La migración SQL de ciclos permite resolver escrituras simultáneas de forma atómica.');
  }
  const cloud = assertResult(await supabaseClient.from('profiles').select('question_cycles').eq('id', uid).maybeSingle())?.question_cycles || {};
  const merged = mergeCycles(incoming, cloud);
  assertResult(await supabaseClient.from('profiles').update({
    question_cycles: merged
  }).eq('id', uid));
  return merged;
}
function authPanel(module = 'selector') {
  const nav = `<div class="module-nav"><button class="secondary ${module === 'selector' ? 'active' : ''}" onclick="home()">🏠 Módulos</button><button class="secondary ${module === 'english' ? 'active' : ''}" onclick="englishHome()">🗣️ Inglés</button><button class="secondary ${module === 'ortografia' ? 'active' : ''}" onclick="moduleHome('ortografia')">✍️ Ortografía</button><button class="secondary ${module === 'gramatica' ? 'active' : ''}" onclick="moduleHome('gramatica')">📚 Gramática</button><button class="secondary ${module === 'general-stats' ? 'active' : ''}" onclick="showGeneralStats()">📊 Estadísticas</button></div>`;
  if (currentUser) return `<section class="card auth-card save-strip"><div class="auth-status"><div><span class="cloud-dot"></span><span class="auth-user">☁️ Cuenta conectada</span><div class="small">${esc(currentUser.email || '')} · misma cuenta en todos los módulos y dispositivos</div></div><div class="auth-actions"><button class="secondary" onclick="showHistory()">📊 Mi historial</button><button class="secondary" onclick="signOut()">Cerrar sesión</button></div></div>${nav}</section>`;
  return `<section class="card auth-card save-strip"><div class="auth-status"><div><h3 style="margin:0 0 4px">☁️ Guarda tu progreso</h3><div class="small">Usa una misma cuenta para conservar tu progreso en Inglés, Ortografía y Gramática y recuperarlo desde otros dispositivos.</div></div><button onclick="showAuth()">👤 Entrar / Registrarme</button></div>${nav}</section>`;
}
function home() {
  if (state.active || academicState.active) return;
  setModuleTheme('neutral');
  clearInterval(state.timer);
  state.questions = [];
  state.answers = {};
  state.idx = 0;
  state.mode = null;
  app.innerHTML = `<main>${authPanel('selector')}
<section class="hero"><div class="lead">Preparación Guardia Civil</div><h1>Elige el módulo</h1><p>Selecciona qué parte quieres preparar. Los tres módulos están separados para que cada banco y su progreso puedan gestionarse de forma independiente.</p></section>
<div class="module-chooser">
<section class="module-card english"><div class="module-icon english-badge">🇬🇧</div><div class="module-mini">Módulo 1</div><h2>Inglés</h2><p>Simulacros oficiales, modelos históricos, entrenamiento, fallos y Profesor · explicaciones.</p><button onclick="englishHome()">Entrar en Inglés</button></section>
<section class="module-card ortho"><div class="module-icon">✍️</div><div class="module-mini">Módulo 2</div><h2>Ortografía</h2><p>Banco oficial de Ortografía con el formato B (bien) / M (mal).</p><button onclick="moduleHome('ortografia')">Entrar en Ortografía</button></section>
<section class="module-card grammar"><div class="module-icon">📚</div><div class="module-mini">Módulo 3</div><h2>Gramática</h2><p>Banco oficial de Gramática con preguntas y frases completas, manteniendo su formato original.</p><button onclick="moduleHome('gramatica')">Entrar en Gramática</button></section>
</div>
<section class="card general-entry" style="margin-top:16px"><div class="row" style="justify-content:space-between;align-items:center"><div><div class="lead">Tu progreso</div><h2 style="margin:3px 0 4px">📊 Mis estadísticas generales</h2><p class="small" style="margin:0">Compara tus resultados de Inglés, Ortografía y Gramática en un mismo lugar.</p></div><button onclick="showGeneralStats()">Ver estadísticas</button></div></section>
<section class="card" style="margin-top:16px"><h2>☁️ Una sola cuenta</h2><p class="small">La cuenta de Supabase es común a los tres módulos. El historial y los fallos de los tres módulos se conservan con esta misma cuenta.</p></section>
</main>`;
}
function academicTrainingPool(module, level) {
  return TRAINING_ACADEMIC_BANK[module].nuevas.filter(q => q.dificultad === level);
}
function academicFailureKey(module) {
  return 'gcAcademicFailures_' + module;
}
function academicFailureBank(module) {
  return [...new Map(readJSON(academicFailureKey(module), []).map(q => [q.id, q])).values()];
}
function saveAcademicFailureBank(module, bank) {
  writeJSON(academicFailureKey(module), bank);
}
function academicFailureCount(module) {
  return academicFailureBank(module).length;
}
function rememberAcademicFailures(module, items, answers) {
  const bank = academicFailureBank(module),
    seen = new Set(bank.map(q => q.id));
  items.forEach((q, i) => {
    let failed = false;
    if (module === 'ortografia') {
      const a = answers[i] || [];
      failed = q.elementos_destacados.some((e, j) => a[j] !== e.respuesta);
    } else failed = answers[i] !== q.respuesta;
    if (failed) {
      clearFailureTombstone(q, module);
      const existing = bank.find(x => x.id === q.id);
      if (existing) {
        existing._failureCount = (existing._failureCount || 1) + 1;
        existing._lastFailureAt = Date.now();
      } else {
        bank.push({
          ...q,
          academic_module: module,
          _failureAddedAt: new Date().toISOString(),
          _lastFailureAt: Date.now(),
          _failureCount: 1
        });
        seen.add(q.id);
      }
    }
  });
  saveAcademicFailureBank(module, bank);
  syncAcademicFailuresCloud(module);
}
function resolveAcademicFailures(module, items, answers) {
  const correctIds = new Set();
  items.forEach((q, i) => {
    let ok;
    if (module === 'ortografia') {
      const a = answers[i] || [];
      ok = q.elementos_destacados.every((e, j) => a[j] === e.respuesta);
    } else ok = answers[i] === q.respuesta;
    if (ok) correctIds.add(q.id);
  });
  if (!correctIds.size) return;
  recordFailureDeletes(academicFailureBank(module).filter(q => correctIds.has(q.id)), module);
  saveAcademicFailureBank(module, academicFailureBank(module).filter(q => !correctIds.has(q.id)));
  syncAcademicFailuresCloud(module);
}
async function syncAcademicFailuresCloud(module) {
  return syncFailuresCloud();
}
function academicFailureStatus(module) {
  const n = academicFailureCount(module),
    remaining = Math.max(0, 20 - n);
  return n >= 20 ? `<div class="training-status"><b>✅ Repaso de fallos desbloqueado:</b> ${n} preguntas nuevas acumuladas.</div>` : `<div class="training-status"><b>${n}/20</b> preguntas nuevas falladas · faltan <b>${remaining}</b> para desbloquearlo.</div>`;
}
function setAcademicDifficulty(level) {
  localStorage.setItem('gcAcademicDifficulty', level);
  ['Fácil', 'Media', 'Difícil'].forEach(x => {
    const el = document.getElementById('academic-level-' + x);
    if (el) el.classList.toggle('active', x === level);
  });
  const h = document.getElementById('academicLevelHint');
  if (h) h.textContent = 'Nivel ' + level + ' · ciclo independiente del resto de niveles.';
}
function getAcademicDifficulty() {
  return localStorage.getItem('gcAcademicDifficulty') || 'Media';
}
function moduleHome(module) {
  if (state.active || academicState.active) return;
  setModuleTheme(module);
  clearInterval(state.timer);
  state.questions = [];
  state.answers = {};
  state.idx = 0;
  state.mode = null;
  const isO = module === 'ortografia',
    title = isO ? 'Ortografía' : 'Gramática',
    icon = isO ? '✍️' : '📚';
  const blocks = ACADEMIC_BANK[isO ? 'ortografia' : 'gramatica'].oficial;
  const historical = isO ? blocks.map(b => b.examen) : [...new Set(blocks.map(q => q.examen))];
  const histOptions = historical.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
  const level = getAcademicDifficulty(),
    failN = academicFailureCount(module),
    failRemaining = Math.max(0, 20 - failN);
  const failButton = failN >= 20 ? `<button class="full" onclick="startAcademic('${module}','failures')">🎯 Repasar mis fallos (${failN})</button>` : `<button class="secondary full" disabled>🔒 Faltan ${failRemaining} preguntas</button>`;
  app.innerHTML = `<main>${authPanel(module)}<section class="hero"><div class="lead">Preparación Guardia Civil · ${title}</div><h1>${icon} ${title}</h1><p>${isO ? '20 elementos destacados · Bien/Mal · 7 minutos · máximo 5 fallos.' : '20 frases completas · Correcta/Incorrecta · 12 minutos · máximo 5 fallos.'}</p></section><div class="academic-menu"><section class="academic-panel"><div class="panel-title">🏛️ Oficial</div><h2>Simulacro ${title}</h2><div class="mode-card"><h3>🎯 Simulacro oficial</h3><p>${isO ? '5 frases × 4 elementos = 20 respuestas.' : '20 frases completas independientes.'} <b>0-5 fallos = APTO.</b></p><button class="full" onclick="startAcademic('${module}','official')">Comenzar simulacro</button></div><div class="mode-card"><h3>📚 Modelo histórico</h3><p>Selecciona un modelo del banco oficial.</p><select id="academicHistorical">${histOptions}</select><button class="full" onclick="startAcademic('${module}','historical')">Comenzar histórico</button></div></section><section class="academic-panel"><div class="panel-title">🧠 Entrenamiento · preguntas nuevas</div><h2>Práctica</h2><div class="mode-card"><h3>🤖 Solo nuevas</h3><p><b>500 preguntas nuevas</b> entrenadas a partir de los patrones del banco oficial auditado. No se copian preguntas oficiales.</p><div class="training-level"><button id="academic-level-Fácil" class="secondary ${level === 'Fácil' ? 'active' : ''}" onclick="setAcademicDifficulty('Fácil');moduleHome('${module}')">Fácil</button><button id="academic-level-Media" class="secondary ${level === 'Media' ? 'active' : ''}" onclick="setAcademicDifficulty('Media');moduleHome('${module}')">Media</button><button id="academic-level-Difícil" class="secondary ${level === 'Difícil' ? 'active' : ''}" onclick="setAcademicDifficulty('Difícil');moduleHome('${module}')">Difícil</button></div><div id="academicLevelHint" class="academic-training-note">Nivel ${level} · ciclo independiente del resto de niveles.</div><div class="academic-new-badge" style="margin-top:9px">🤖 NUEVAS · CICLO INDEPENDIENTE</div><button class="full" onclick="startAcademic('${module}','new')">Practicar preguntas nuevas</button></div><div class="mode-card"><h3>🔒 Repaso de fallos</h3><p>Solo preguntas nuevas que hayas fallado. Las que resuelvas bien salen de tu banco de fallos.</p>${academicFailureStatus(module)}${failButton}</div></section></div>${renderTopicCards(module)}<section class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between;align-items:center"><div><div class="lead">Seguimiento</div><h3 style="margin:3px 0">📊 Mis estadísticas de ${title}</h3><div class="small">Resumen de tus resultados en este módulo.</div></div><button onclick="showGeneralStats()">Estadísticas generales</button></div><div id="academicStatsHome" style="margin-top:10px"></div></section><section class="card academic-help"><b>Cómo se puntúa:</b> 20 puntos máximos. Cada error cuenta como 1 fallo y no resta puntos. Las respuestas son obligatorias. Con <b>más de 5 fallos = NO APTO</b>. ${isO ? 'En Ortografía cada frase contiene 4 elementos destacados.' : 'En Gramática cada frase completa es una pregunta independiente.'}</section></main>`;
  renderModuleStats('academicStatsHome', module);
}
const academicState = {
  module: null,
  mode: null,
  items: [],
  answers: {},
  idx: 0,
  startedAt: null,
  timeLeft: 0,
  timer: null,
  label: '',
  source: null,
  difficulty: '',
  cycleSnapshot: null,
  topicId: null
};
function academicCycles() {
  return questionCycles();
}
function saveAcademicCycles(x) {
  saveQuestionCycles(x);
}
function academicId(x) {
  return x.id || 'ac_' + btoa(unescape(encodeURIComponent(JSON.stringify(x)))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 70);
}
function academicPool(module) {
  return module === 'ortografia' ? ACADEMIC_BANK.ortografia.oficial.flatMap(b => b.preguntas.map(q => ({
    ...q,
    examen: b.examen
  }))) : ACADEMIC_BANK.gramatica.oficial;
}
function academicTake(pool, key, n) {
  if (!academicState.transaction) academicState.transaction = transaction(questionCycles());
  const result = selectCycle(pool, academicState.transaction.draft[key], n, academicId);
  academicState.transaction.draft[key] = result.used;
  if (result.advanced) {
    const epoch = '__epoch:' + key;
    academicState.transaction.draft[epoch] = [Number(academicState.transaction.draft[epoch]?.[0] || 0) + 1];
  }
  return result.questions;
}
function academicTakeNoTargetRepeat(pool, key, n) {
  return academicTake(pool, key, n);
}
function academicTakeDiverse(pool, key, n, field) {
  return academicTake(pool, key, n);
}
function startAcademic(module, mode) {
  setModuleTheme(module);
  const sel = document.getElementById('academicHistorical');
  let items = [],
    label = '',
    source = null,
    level = getAcademicDifficulty();
  academicState.transaction = transaction(questionCycles());
  academicState.cycleSnapshot = JSON.stringify(academicState.transaction.snapshot);
  academicState.topicId = null;
  if (mode.startsWith('topic:')) {
    const topicId = mode.slice(6);
    if (!topicMode(module,topicId)) return;
    academicState.topicId = topicId;
    items = academicTake(topicPools[module][topicId], topicCycleKey(module,topicId), module === 'ortografia' ? 5 : 20);
    label = topicLabel(module,topicId);
    level = 'Nivel examen';
  } else if (mode === 'new') {
    const pool = academicTrainingPool(module, level);
    items = module === 'ortografia' ? academicTakeNoTargetRepeat(pool, 'academic_' + module + '_new_' + level, 5) : academicTakeDiverse(pool, 'academic_' + module + '_new_' + level, 20, q => q.regla);
    label = (module === 'ortografia' ? 'Ortografía' : 'Gramática') + ' · Solo nuevas · ' + level;
  } else if (mode === 'failures') {
    if (academicFailureBank(module).length < 20) return alert('Necesitas 20 fallos distintos.');
    items = shuffle(academicFailureBank(module)).slice(0, module === 'ortografia' ? 5 : 20);
    label = (module === 'ortografia' ? 'Ortografía' : 'Gramática') + ' · Repaso de fallos';
  } else if (module === 'ortografia') {
    const blocks = ACADEMIC_BANK.ortografia.oficial;
    if (mode === 'historical') {
      source = blocks.find(b => b.examen === (sel?.value || ''));
      if (!source) return alert('No se encontró ese modelo.');
      items = source.preguntas.slice(0, 5).map(q => ({
        ...q,
        examen: source.examen
      }));
      label = 'Ortografía · ' + source.examen;
    } else {
      items = academicTake(academicPool(module), 'ortografia', 5);
      label = 'Ortografía · Simulacro oficial';
    }
  } else {
    const pool = ACADEMIC_BANK.gramatica.oficial;
    if (mode === 'historical') {
      source = pool.filter(q => q.examen === (sel?.value || ''));
      if (!source.length) return alert('No se encontró ese modelo.');
      items = source.slice(0, 20);
      label = 'Gramática · ' + (sel?.value || 'Histórico');
    } else {
      items = academicTake(pool, 'gramatica', 20);
      label = 'Gramática · Simulacro oficial';
    }
  }
  if (!items.length) return alert(mode === 'failures' ? 'No tienes suficientes fallos acumulados para este repaso.' : 'No hay preguntas suficientes para este test.');
  academicState.module = module;
  academicState.mode = mode;
  academicState.items = items;
  academicState.answers = {};
  academicState.idx = 0;
  academicState.startedAt = Date.now();
  academicState.label = label;
  academicState.source = source;
  academicState.difficulty = level;
  academicState.timeLeft = module === 'ortografia' ? 420 : 720;
  academicState.deadline = academicState.startedAt + academicState.timeLeft * 1000;
  academicState.active = true;
  persistActive('academic');
  academicRender();
  armTimer('academic');
}
function academicRender() {
  setModuleTheme(academicState.module);
  if (academicState.active) persistActive('academic');
  const s = academicState,
    q = s.items[s.idx],
    total = s.module === 'ortografia' ? s.items.length * 4 : s.items.length;
  let done = s.module === 'ortografia' ? Object.values(s.answers).reduce((n, v) => n + (Array.isArray(v) ? v.filter(Boolean).length : 0), 0) : Object.keys(s.answers).length;
  let body = '';
  const modeLabel = s.topicId ? topicLabel(s.module,s.topicId) + ' · Nivel examen' : s.mode === 'historical' ? 'Modelo histórico' : s.mode === 'new' ? 'Solo nuevas' : s.mode === 'failures' ? 'Repaso de fallos' : 'Simulacro oficial';
  if (s.module === 'ortografia') {
    body = `<div class="source-tag">${esc(q.examen || 'Entrenamiento')} · 4 elementos ${q.es_nueva ? '<span class="academic-new-badge">🤖 NUEVA</span>' : ''}</div><div class="academic-phrase"><b>${s.idx + 1}.</b> ${renderAcademicPhrase(q, false, s.answers[s.idx] || [])}</div><div class="bm-grid">${q.elementos_destacados.map((e, j) => {
      const a = (s.answers[s.idx] || [])[j];
      return `<div class="bm-item"><div class="bm-label">${String.fromCharCode(65 + j)} · ${esc(e.texto)}</div><div class="bm-buttons"><button class="bm-btn ${a === 'B' ? 'sel-b' : ''}" onclick="academicChoose(${j},'B')">B · BIEN</button><button class="bm-btn ${a === 'M' ? 'sel-m' : ''}" onclick="academicChoose(${j},'M')">M · MAL</button></div></div>`;
    }).join('')}</div>`;
  } else {
    const a = s.answers[s.idx];
    body = `<div class="source-tag">${esc(q.examen || 'Entrenamiento')} ${q.es_nueva ? '<span class="academic-new-badge">🤖 NUEVA</span>' : ''}</div><div class="academic-phrase">${esc(q.frase)}</div><div class="correctness"><button class="${a === 'B' ? 'selected-b' : ''}" onclick="academicChoose(0,'B')">${a === 'B' ? '✓ ' : ''}CORRECTA</button><button class="${a === 'M' ? 'selected-m' : ''}" onclick="academicChoose(0,'M')">${a === 'M' ? '✓ ' : ''}INCORRECTA</button></div>`;
  }
  app.innerHTML = `<main class="academic-test"><div class="academic-top"><div class="academic-head"><div><b>${s.module === 'ortografia' ? 'ORTOGRAFÍA' : 'GRAMÁTICA'}</b><div class="small">${modeLabel}${s.mode === 'new' ? ' · ' + esc(s.difficulty) : ''} · ${done}/${total} respondidas</div></div><div><span id="academicTimer" class="timer">${formatTime(s.timeLeft)}</span> <button class="secondary abandon-btn" onclick="abandonAcademicTest()">Abandonar</button> <button class="danger" onclick="academicFinish(false)">Finalizar</button></div></div><div class="progress"><i style="width:${(s.idx + 1) / s.items.length * 100}%"></i></div></div>${body}<div class="question-actions"><button class="secondary" onclick="academicPrev()" ${s.idx === 0 ? 'disabled' : ''}>Anterior</button><button onclick="academicNext()">${s.idx === s.items.length - 1 ? 'Corregir' : 'Siguiente'}</button></div><div class="academic-nav">${s.items.map((x, i) => {
    const d = s.module === 'ortografia' ? Array.isArray(s.answers[i]) && s.answers[i].every(Boolean) : !!s.answers[i];
    return `<button class="${d ? 'done ' : ''}${i === s.idx ? 'current' : ''}" ${i === s.idx ? 'aria-current="step"' : ''} aria-label="Pregunta ${i + 1}${d ? ', respondida' : ', pendiente'}" onclick="academicGo(${i})">${i + 1}</button>`;
  }).join('')}</div><div class="academic-note">Las respuestas son obligatorias. Al acabar el tiempo se corrige automáticamente.</div></main>`;
  academicUpdateTimer();
}
function academicChoose(j, val) {
  const s = academicState;
  if (!s.active) return;
  if (remainingSeconds(s.deadline) === 0) {
    academicFinish(true);
    return;
  }
  if (s.module === 'ortografia') {
    const a = s.answers[s.idx] ? s.answers[s.idx].slice() : Array(4).fill(null);
    a[j] = val;
    s.answers[s.idx] = a;
  } else s.answers[s.idx] = val;
  academicRender();
}
function academicGo(i) {
  academicState.idx = i;
  academicRender();
}
function academicPrev() {
  if (academicState.idx > 0) {
    academicState.idx--;
    academicRender();
  }
}
function academicNext() {
  const s = academicState;
  if (s.module === 'ortografia') {
    const a = s.answers[s.idx] || [];
    if (a.length !== 4 || a.some(x => !x)) return alert('Debes responder los 4 elementos de esta frase antes de continuar.');
  } else if (!s.answers[s.idx]) return alert('Debes marcar CORRECTA o INCORRECTA antes de continuar.');
  if (s.idx < s.items.length - 1) {
    s.idx++;
    academicRender();
  } else academicFinish(false);
}
function academicUpdateTimer() {
  const e = document.getElementById('academicTimer');
  if (e) {
    e.textContent = formatTime(academicState.timeLeft);
    e.className = 'timer' + (academicState.timeLeft <= 60 ? ' danger' : academicState.timeLeft <= 180 ? ' warn' : '');
  }
}
function abandonAcademicTest() {
  const s = academicState;
  if (!s.items.length) return;
  if (!confirm('¿Seguro que quieres abandonar este test?\n\nNo se guardarán tus respuestas ni el resultado.')) return;
  clearInterval(s.timer);
  s.timer = null;
  discardExam(s);
  const module = s.module;
  s.items = [];
  s.answers = {};
  s.idx = 0;
  s.mode = null;
  s.startedAt = null;
  s.timeLeft = 0;
  s.label = '';
  s.source = null;
  s.difficulty = '';
  s.cycleSnapshot = null;
  moduleHome(module);
}
function academicFinish(auto) {
  if (!auto && !confirm('¿Terminar y corregir el test?')) return;
  const s = academicState;
  if (!s.items.length || !s.active) return;
  if (!auto) {
    for (let i = 0; i < s.items.length; i++) {
      if (s.module === 'ortografia') {
        const a = s.answers[i] || [];
        if (a.length !== 4 || a.some(x => !x)) {
          s.idx = i;
          academicRender();
          return alert('Hay respuestas pendientes. Debes contestar los 4 elementos de esta frase antes de corregir.');
        }
      } else if (!s.answers[i]) {
        s.idx = i;
        academicRender();
        return alert('Hay una frase sin responder.');
      }
    }
  }
  clearInterval(s.timer);
  s.timer = null;
  let correct = 0,
    total = s.module === 'ortografia' ? s.items.reduce((n, q) => n + q.elementos_destacados.length, 0) : s.items.length,
    wrong = 0,
    blank = 0,
    details = [];
  if (s.module === 'ortografia') s.items.forEach((q, i) => q.elementos_destacados.forEach((e, j) => {
    const a = (s.answers[i] || [])[j],
      ok = a === e.respuesta;
    if (ok) correct++;else {
      wrong++;
      if (!a) blank++;
    }
    details.push({
      questionId: q.id,
      position: j + 1,
      texto: e.texto,
      respuesta: e.respuesta,
      answer: a,
      frase: q.frase,
      examen: q.examen,
      es_nueva: q.es_nueva === true,
      forma_correcta: e.forma_correcta || '',
      regla: e.regla || q.regla || '',
      explicacion_profesor: e.explicacion || q.explicacion_profesor || '',
      clave_revisada: e.clave_revisada === true,
      motivo_revision: e.motivo_revision || ''
    });
  }));else s.items.forEach((q, i) => {
    const a = s.answers[i],
      ok = a === q.respuesta;
    if (ok) correct++;else {
      wrong++;
      if (!a) blank++;
    }
    details.push({
      questionId: q.id,
      texto: q.frase,
      respuesta: q.respuesta,
      answer: a,
      frase: q.frase,
      examen: q.examen,
      es_nueva: q.es_nueva === true,
      frase_correcta: q.frase_correcta || '',
      frase_incorrecta: q.frase_incorrecta || '',
      regla: q.regla || '',
      explicacion_profesor: q.explicacion_profesor || '',
      truco: q.truco || ''
    });
  });
  const elapsed = elapsedSeconds(s.startedAt, s.deadline),
    pass = wrong <= 5;
  const entry = {
    date: new Date().toISOString(),
    mode: 'academic_' + s.module + '_' + s.mode,
    label: s.label,
    total,
    correct,
    wrong,
    blank,
    score: correct,
    penalty: 0,
    elapsed,
    difficulty: s.difficulty || '',
    topicId: s.topicId || null,
    questions: s.items,
    answers: s.answers,
    fallosPermitidos: 5,
    apto: pass,
    detalles: details
  };
  if (s.mode === 'new' || s.topicId) rememberAcademicFailures(s.module, s.items, s.answers);
  if (s.mode === 'failures') resolveAcademicFailures(s.module, s.items, s.answers);
  saveHistory(entry);
  commitExam(s);
  saveAttemptCloud(entry).catch(() => {});
  renderAcademicResult(entry);
}
function renderAcademicResult(r) {
  window.__lastAcademicResult = r;
  const pass = r.wrong <= 5,
    mod = r.mode.includes('_ortografia_') ? 'ortografia' : 'gramatica';
  setModuleTheme(mod);
  app.innerHTML = `<main class="academic-result"><div class="card"><div class="source-tag">${esc(r.label)}</div><div class="academic-pass" style="color:${pass ? '#2d7a4b' : '#a52d2d'}">${pass ? 'APTO' : 'NO APTO'}</div><div class="academic-score">${r.correct} / ${r.total} puntos</div><div class="stats"><div class="stat"><b>${r.correct}</b><span>aciertos</span></div><div class="stat"><b>${r.wrong}</b><span>fallos</span></div><div class="stat"><b>${r.blank}</b><span>en blanco</span></div><div class="stat"><b>${r.total - r.correct}</b><span>errores</span></div></div><p style="text-align:center"><b>Máximo permitido: 5 fallos.</b> Los errores no restan puntos.</p><p style="text-align:center"><b>Tiempo:</b> ${Math.floor(r.elapsed / 60)}:${String(r.elapsed % 60).padStart(2, '0')}</p><div class="row" style="justify-content:center"><button onclick="moduleHome('${mod}')">Volver al módulo</button><button class="secondary" onclick="reviewAcademic()">🔎 Ver revisión</button></div></div><div id="academicReview"></div></main>`;
}
async function reviewAcademic() {
  const r=window.__lastAcademicResult,box=document.getElementById('academicReview');
  if(!r || !box || state.active || academicState.active)return;
  const module=r.mode.includes('_ortografia_')?'ortografia':'gramatica';
  let index;
  try { index=await ensureProfessor(module); } catch(error) { notice(error.message); }
  if(!box.isConnected || state.active || academicState.active)return;
  const repeated=index?recurrentConceptFailures(professorHistory(module),index,module):{};
  const items=(r.questions || []).map((q,i)=>({q,i,views:module==='ortografia'?(q.elementos_destacados || []).map(e=>professorView(index,module,q,r.answers?.[i]?.[e.posicion-1],e.posicion)):[professorView(index,module,q,r.answers?.[i])]}));
  items.sort((a,b)=>Number(!a.views.some(v=>!v.correct&&!['anomaly','unavailable'].includes(v.status)))-Number(!b.views.some(v=>!v.correct&&!['anomaly','unavailable'].includes(v.status))) || a.i-b.i);
  box.innerHTML='<h2>Revisión</h2>'+items.map(({q,i,views})=>{
    const anomaly=views.some(v=>v.status==='anomaly'),bad=views.some(v=>!v.correct&&!['anomaly','unavailable'].includes(v.status));
    const corrected=module==='ortografia'&&index?correctedOrthographyPhrase(q,index):null;
    return '<article class="academic-review-item '+(anomaly?'neutral':bad?'bad':'good')+'" data-question-id="'+esc(q.id)+'"><div class="source-tag">'+esc(q.examen || 'Entrenamiento')+'</div><div class="academic-review-phrase">'+esc(q.frase)+'</div>'+(corrected?'<p class="corrected-phrase"><b>Frase corregida:</b> '+renderDifference(q.frase,corrected)+'</p>':'')+views.map((v,j)=>'<section class="academic-element">'+(module==='ortografia'?'<h4>'+esc(String.fromCharCode(65+j)+' · '+q.elementos_destacados[j].texto)+'</h4>':'')+(v.status==='anomaly'?'<p class="notice">⚠ Anomalía documentada; la clave del banco se conserva. Requiere revisión humana.</p>':v.status==='unavailable'?'':'<p>Tu respuesta: <b class="'+(v.correct?'correct':'wrong')+'">'+(v.correct?'✓ ':'✗ ')+esc(v.userAnswer)+'</b> · Respuesta utilizada para corregir: <b class="correct">✓ '+esc(v.acceptedAnswers.join(' / '))+'</b></p>')+renderProfessor(v,{repeated:repeated[v.conceptId] || 0})+'</section>').join('')+'</article>';
  }).join('');
}
function showAcademicReserves(module) {
  setModuleTheme(module);
  const rs = ACADEMIC_BANK.ortografia.reservas || [];
  const filtered = rs.filter(r => String(r.tipo || '').startsWith(module === 'ortografia' ? 'ortografia' : 'gramatica'));
  app.innerHTML = `<main><section class="card"><div class="row" style="justify-content:space-between"><h2>Reservas · ${module === 'ortografia' ? 'Ortografía' : 'Gramática'}</h2><button class="secondary" onclick="moduleHome('${module}')">Volver</button></div><div class="reserve-note">Las reservas están separadas del banco oficial principal.</div>${filtered.length ? filtered.map(r => `<div class="academic-review-item"><div class="source-tag">${esc(r.examen || 'Reserva')}</div><pre style="white-space:pre-wrap;font-family:inherit">${esc(JSON.stringify(r, null, 2))}</pre></div>`).join('') : '<p>No hay reservas disponibles.</p>'}</section></main>`;
}
function englishHome() {
  if (state.active || academicState.active) return;
  setModuleTheme('english');
  clearInterval(state.timer);
  state.timer = null;
  state.questions = [];
  state.answers = {};
  state.idx = 0;
  state.mode = null;
  state.difficulty = 'Media';
  app.innerHTML = `<main>${authPanel('english')}
<section class="hero"><div class="lead">Preparación Guardia Civil · Inglés</div><h1>Entrenamiento de inglés</h1><p>El banco oficial y el banco de entrenamiento están separados para que puedas preparar primero el examen real y después ampliar tu práctica.</p></section>
<div class="menu-columns">
<section class="menu-panel official-panel">
  <div class="panel-title official">Preguntas oficiales</div>
  <h2>Banco oficial</h2>
  <p class="panel-sub">Las preguntas reales se mantienen intactas y no se mezclan con las nuevas salvo cuando tú eliges <b>Mixto</b>.</p>
  <div class="menu-block">
    <h3>🎯 Simulacro real</h3>
    <p>Formato oficial: 20 preguntas · 15 min · +1 / −0,33 / blanco 0 · APTO desde 8.</p>
    <button class="full" onclick="start('official',20)">Empezar simulacro real</button>
  </div>
  <div class="menu-block">
    <h3>🔥 Intensivos oficiales</h3>
    <p>Más preguntas, siempre exclusivamente del banco oficial.</p>
    <div class="size-row"><button onclick="start('official',40)">40 · 30 min</button><button onclick="start('official',60)">60 · 45 min</button><button onclick="start('official',100)">100 · 75 min</button></div>
  </div>
  <div class="menu-block">
    <h3>📚 Modelo histórico</h3>
    <p>Selecciona un examen y conserva sus preguntas y opciones originales.</p>
    <select id="examSel">${DATA.examenes.filter(e => e.historico !== false && e.preguntas.every(q => q.respuesta_correcta)).sort((a, b) => {
    const ya = +(a.nombre.match(/\d{4}/) || [0])[0],
      yb = +(b.nombre.match(/\d{4}/) || [0])[0];
    return yb - ya || a.id - b.id;
  }).map(e => `<option value="${e.id}">${esc(e.nombre)}</option>`).join('')}</select>
    <button class="full" onclick="startHistorical()">Empezar modelo histórico</button>
  </div>
</section>
<section class="menu-panel training-panel">
  <div class="panel-title training">Entrenamiento</div>
  <h2>Preguntas de entrenamiento</h2>
  <p class="panel-sub">Preguntas creadas para practicar la gramática del mismo estilo. Aquí puedes subir progresivamente el nivel.</p>
  <div class="menu-block">
    <h3>🤖 Solo nuevas</h3>
    <p>Solo preguntas generadas. Elige primero la dificultad y después la duración.</p>
    <div class="level-picker"><button id="lvl-easy" class="level-btn" onclick="setDifficulty('Fácil')">🟢 Fácil</button><button id="lvl-medium" class="level-btn active" onclick="setDifficulty('Media')">🟡 Media</button><button id="lvl-hard" class="level-btn" onclick="setDifficulty('Difícil')">🔴 Difícil</button></div>
    <div class="level-hint" id="levelHint">Nivel medio: mezcla de estructuras y distractores más exigentes.</div>
    <div class="size-row" style="margin-top:9px"><button onclick="start('new',20)">20 · 15 min</button><button onclick="start('new',40)">40 · 30 min</button><button onclick="start('new',60)">60 · 45 min</button><button onclick="start('new',100)">100 · 75 min</button></div>
  </div>
  <div class="menu-block failure-block">
    <h3>🎯 Repaso de fallos</h3>
    <p>Guarda automáticamente las preguntas nuevas que falles o dejes en blanco. Cuando acumules <b>20 preguntas distintas</b>, se desbloquea este test y solo aparecerán esas preguntas.</p>
    <div id="failureStatus" class="failure-status"></div>
    <button id="failureBtn" class="full" onclick="startFailures()">🔒 Necesitas 20 fallos</button>
    <button class="secondary full" style="margin-top:7px" onclick="clearFailures()">Vaciar banco de fallos</button>
  </div>
  <div class="menu-block">
    <h3>🔀 Mixto</h3>
    <p>50% oficiales + 50% nuevas. La dificultad se aplica a las nuevas.</p>
    <div class="size-row"><button onclick="start('mixed',20)">20 · 15 min</button><button onclick="start('mixed',40)">40 · 30 min</button><button onclick="start('mixed',60)">60 · 45 min</button><button onclick="start('mixed',100)">100 · 75 min</button></div>
  </div>
  <div class="notice">🤖 <b>Profesor:</b> las preguntas nuevas llevan regla, explicación y ejemplo para estudiar los fallos.</div>
</section>
</div>
${renderTopicCards('english')}
<section class="card" style="margin-top:16px"><h2>Mis estadísticas</h2><div id="statsHome"></div><div class="row"><button class="secondary" onclick="showHistory()">Ver historial</button><button class="secondary" onclick="clearStats()">Borrar estadísticas</button></div></section>

</main>`;
  setDifficulty(state.difficulty);
  renderHomeStats();
  renderFailureStatus();
}
function renderFailureStatus() {
  const el = document.getElementById('failureStatus'),
    btn = document.getElementById('failureBtn');
  if (!el || !btn) return;
  const n = failureBank().filter(q => !q.excludeRandom).length,
    remaining = Math.max(0, 20 - n);
  if (n >= 20) {
    el.innerHTML = `<b>✅ Desbloqueado:</b> tienes ${n} preguntas para repasar. El test utilizará exclusivamente este banco.`;
    btn.disabled = false;
    btn.textContent = `🎯 Repasar mis fallos (${n} preguntas)`;
  } else {
    el.innerHTML = `<b>${n}/20</b> preguntas acumuladas · te faltan <b>${remaining}</b> para desbloquearlo.`;
    btn.disabled = true;
    btn.textContent = `🔒 Faltan ${remaining} preguntas`;
  }
}
function startFailures() {
  state.cycleSnapshot = null;
  const bank = failureBank().filter(q => !q.excludeRandom);
  if (bank.length < 20) {
    alert(`El repaso de fallos se desbloquea al llegar a 20 preguntas distintas. Ahora tienes ${bank.length}.`);
    return;
  }
  state.questions = shuffle(bank);
  begin('failures');
}
function clearFailures() {
  if (confirm('¿Vaciar todas las preguntas guardadas como fallos? Esta acción no borra tus estadísticas.')) {
    recordFailureDeletes(failureBank(), 'english');
    removeStored(FAILURES_KEY);
    if (currentUser) syncFailuresCloud().catch(() => {});
    renderFailureStatus();
  }
}
function setDifficulty(level) {
  state.difficulty = level;
  ['easy', 'medium', 'hard'].forEach(x => {
    const el = document.getElementById('lvl-' + x);
    if (el) el.classList.toggle('active', x === (level === 'Fácil' ? 'easy' : level === 'Media' ? 'medium' : 'hard'));
  });
  const hint = document.getElementById('levelHint');
  if (hint) hint.textContent = level === 'Fácil' ? 'Nivel fácil: estructuras más directas y distractores sencillos.' : level === 'Media' ? 'Nivel medio: mezcla de estructuras y distractores más exigentes.' : 'Nivel difícil: estructuras más complejas, contrastes gramaticales y distractores más parecidos.';
}
function renderModuleStats(targetId, module) {
  const h = history().filter(x => statsModuleFromAttempt(x) === module && !parseTopicMode(x.mode)),
    total = h.reduce((s, x) => s + (Number(x.total) || 0), 0),
    correct = h.reduce((s, x) => s + (Number(x.correct) || 0), 0),
    avg = h.length ? h.reduce((s, x) => s + statsPercent(x), 0) / h.length : 0,
    apto = h.filter(statsApto).length;
  const avgPts = h.length ? h.reduce((s, x) => s + (Number(x.score) || 0), 0) / h.length : 0;
  document.getElementById(targetId).innerHTML = `<div class="stats"><div class="stat"><b>${h.length}</b><span>tests</span></div><div class="stat"><b>${avgPts.toFixed(2)}</b><span>media puntos</span></div><div class="stat"><b>${total ? (correct / total * 100).toFixed(1) : '0.0'}%</b><span>acierto</span></div><div class="stat"><b>${apto}</b><span>APTO</span></div></div>`;
}
function renderHomeStats() {
  renderModuleStats('statsHome', 'english');
}
function pickPool(mode) {
  const officialPool = () => OFICIALES.filter(q => q.respuesta_correcta && !q.excludeRandom);
  const generatedPool = () => GENERADAS.filter(q => q.respuesta_correcta && !q.excludeRandom && q.dificultad === state.difficulty);
  let result = [];
  if (mode === 'official') result = takeCycle(officialPool(), 'official', stateTarget);else if (mode === 'new') result = takeCycle(generatedPool(), 'new_' + state.difficulty, stateTarget);else if (mode === 'mixed') {
    const nGen = Math.floor(stateTarget / 2),
      nOff = stateTarget - nGen;
    const off = takeCycle(officialPool(), 'mixed_official', nOff);
    const gen = takeCycle(generatedPool(), 'mixed_generated_' + state.difficulty, nGen);
    result = shuffle(off.concat(gen));
  }
  return result;
}
let stateTarget = 20;
function start(mode, n) {
  stateTarget = n;
  state.transaction = transaction(questionCycles());
  state.cycleSnapshot = JSON.stringify(state.transaction.snapshot);
  state.selecting = true;
  let pool;
  try {
    pool = pickPool(mode);
  } catch (error) {
    state.transaction = null;
    notice(error.message);
    return;
  } finally {
    state.selecting = false;
  }
  if (pool.length < n) {
    alert(mode === 'new' ? `No hay suficientes preguntas nuevas de nivel ${state.difficulty} para ${n} preguntas.` : 'No hay suficientes preguntas disponibles para este tamaño.');
    return;
  }
  state.questions = pool.slice(0, n);
  begin(mode);
}
function startHistorical() {
  state.transaction = null;
  state.cycleSnapshot = null;
  const id = +document.getElementById('examSel').value,
    e = DATA.examenes.find(x => x.id === id && x.historico !== false);
  if (!e) return;
  state.questions = e.preguntas.map(q => ({
    ...q,
    fuente: e.nombre,
    examenId: e.id,
    tipo: 'oficial'
  }));
  begin('exam');
}
function begin(mode) {
  setModuleTheme('english');
  clearInterval(state.timer);
  state.mode = mode;
  state.topicId = parseTopicMode(mode)?.topicId || null;
  state.answers = {};
  state.idx = 0;
  state.startedAt = Date.now();
  state.timeLeft = englishDuration(state.questions.length);
  state.deadline = state.startedAt + state.timeLeft * 1000;
  state.active = true;
  persistActive('english');
  renderTest();
  armTimer('english');
}
function formatTime(t) {
  const m = Math.floor(t / 60),
    s = t % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function updateTimer() {
  const el = document.getElementById('timer');
  if (!el) return;
  el.textContent = formatTime(state.timeLeft);
  el.className = 'timer' + (state.timeLeft <= 60 ? ' danger' : state.timeLeft <= 300 ? ' warn' : '');
}
function renderTest() {
  setModuleTheme('english');
  if (state.active) persistActive('english');
  const q = state.questions[state.idx],
    total = state.questions.length,
    answered = Object.keys(state.answers).length;
  app.innerHTML = `<div class="topbar"><div class="topin"><div><b>${state.topicId ? esc(topicLabel('english',state.topicId)) + ' · Nivel examen' : state.mode === 'official' ? 'SIMULACIÓN OFICIAL' : state.mode === 'new' ? 'SOLO NUEVAS' : state.mode === 'mixed' ? 'MIXTO' : state.mode === 'failures' ? 'REPASO DE FALLOS' : 'MODELO HISTÓRICO'}</b><div class="small">${answered}/${total} respondidas${state.mode === 'new' || state.mode === 'mixed' ? ' · Nivel ' + esc(state.difficulty) : ''}</div></div><div class="row">${state.timeLeft > 0 ? '<span id="timer" class="timer">' + formatTime(state.timeLeft) + '</span>' : ''}<button class="secondary abandon-btn" onclick="abandonEnglishTest()">Abandonar</button><button class="danger" onclick="confirmFinish()">Finalizar</button></div></div></div><main><div class="progress"><i style="width:${(state.idx + 1) / total * 100}%"></i></div><div class="qcard"><div class="qmeta">Pregunta ${state.idx + 1} de ${total} ${typeBadge(q)}</div><div class="question">${q.instruction ? `<p class="notice">${esc(q.instruction)}</p>` : ''}${q.neutralized ? '<p class="notice">Pregunta anulada por anomalía de importación. Se conserva para consulta; no puntúa.</p>' : ''}${esc(q.pregunta).replace(/_____+/g, '<span class="blank-space">_____</span>')}</div>${['a', 'b', 'c', 'd'].map(k => `<label class="option"><input type="radio" name="ans" value="${k}" ${state.answers[state.idx] === k ? 'checked' : ''} onchange="choose('${k}')"><span><b>${k.toUpperCase()})</b> ${esc(q.opciones[k])}</span></label>`).join('')}</div><div class="blank-note">Las preguntas en blanco no penalizan.</div><div class="question-actions"><button class="secondary" onclick="prev()" ${state.idx === 0 ? 'disabled' : ''}>Anterior</button><button onclick="next()">${state.idx === total - 1 ? 'Corregir' : 'Siguiente'}</button></div><div class="nav-grid">${state.questions.map((_, i) => `<button class="${state.answers[i] ? 'answered ' : ''}${i === state.idx ? 'current' : ''}" aria-label="Pregunta ${i + 1}${state.answers[i] ? ', respondida' : ', en blanco'}" ${i === state.idx ? 'aria-current="step"' : ''} onclick="goTo(${i})">${i + 1}</button>`).join('')}</div></main>`;
  updateTimer();
}
function choose(k) {
  if (!state.active) return;
  if (remainingSeconds(state.deadline) === 0) {
    finish(true);
    return;
  }
  state.answers[state.idx] = k;
  renderTest();
}
function goTo(i) {
  state.idx = i;
  renderTest();
}
function prev() {
  if (state.idx > 0) {
    state.idx--;
    renderTest();
  }
}
function next() {
  if (state.idx < state.questions.length - 1) {
    state.idx++;
    renderTest();
  } else confirmFinish();
}
function abandonEnglishTest() {
  if (!state.questions.length) return;
  if (!confirm('¿Seguro que quieres abandonar este test?\n\nNo se guardarán tus respuestas ni el resultado.')) return;
  clearInterval(state.timer);
  state.timer = null;
  discardExam(state);
  state.questions = [];
  state.answers = {};
  state.idx = 0;
  state.mode = null;
  state.startedAt = null;
  state.timeLeft = 0;
  state.cycleSnapshot = null;
  englishHome();
}
function confirmFinish() {
  if (confirm('¿Terminar el test y corregirlo ahora?')) finish(false);
}
function finish(autoSubmitted) {
  if (!state.questions.length || !state.active) return;
  clearInterval(state.timer);
  state.timer = null;
  const {
    total,
    questionCount,
    neutral,
    correct,
    wrong,
    blank,
    penalty,
    score
  } = scoreEnglish(state.questions, state.answers);
  const elapsed = elapsedSeconds(state.startedAt, state.deadline);
  if (state.mode === 'new' || state.mode === 'mixed' || state.topicId) rememberTrainingFailures(state.questions, state.answers);
  if (state.mode === 'failures') resolveFailureTest(state.questions, state.answers);
  const entry = {
    date: new Date().toISOString(),
    mode: state.mode,
    total,
    questionCount,
    neutral,
    correct,
    wrong,
    blank,
    score,
    penalty,
    elapsed,
    topicId: state.topicId || null,
    label: state.topicId ? topicLabel('english',state.topicId) : state.mode === 'official' ? 'Simulación oficial' : state.mode === 'new' ? 'Solo nuevas' : state.mode === 'mixed' ? 'Mixto' : state.mode === 'failures' ? 'Repaso de fallos' : 'Modelo histórico',
    difficulty: state.topicId ? 'Nivel examen' : state.difficulty,
    questions: state.questions,
    answers: state.answers
  };
  saveHistory(entry);
  commitExam(state);
  if (state.mode === 'new' || state.mode === 'mixed' || state.mode === 'failures' || state.topicId) syncFailuresCloud().catch(() => {});
  saveAttemptCloud(entry).catch(() => {});
  renderResult(entry);
}
function renderResult(r) {
  setModuleTheme('english');
  window.__lastResult = r;
  const pass = r.total > 0 && r.score >= r.total * .4,
    threshold = (r.total * .4).toFixed(0);
  app.innerHTML = `<main><div class="result"><div class="small">${esc(r.label)}</div><h2 class="${pass ? 'apt' : 'noapt'}">${pass ? 'APTO' : 'NO APTO'}</h2><div class="final-score ${pass ? 'pass' : 'fail'}"><div class="label">Puntuación final</div><div class="number">${r.score.toFixed(2)} <span style="font-size:18px">/ ${r.total}</span></div><div class="outcome">${pass ? 'APTO' : 'NO APTO'}</div></div><div class="stats"><div class="stat"><b>${r.correct}</b><span>correctas</span></div><div class="stat"><b>${r.wrong}</b><span>incorrectas</span></div><div class="stat"><b>${r.blank}</b><span>en blanco</span></div><div class="stat"><b>${r.score.toFixed(2)}</b><span>puntuación</span></div></div>${r.neutral ? `<p role="status">${r.neutral} preguntas anuladas por importación incompatible. Puntuación sobre ${r.total} evaluables.</p>` : ''}<p><b>Fórmula:</b> ${r.correct} − (${r.wrong} / 3) = <b>${r.score.toFixed(2)}</b>. Penalización: ${r.penalty.toFixed(2)}.</p><p><b>Precisión:</b> ${(r.correct / r.total * 100).toFixed(1)}% · <b>Tiempo:</b> ${Math.floor(r.elapsed / 60)}:${String(r.elapsed % 60).padStart(2, '0')}</p><p><b>APTO desde:</b> ${threshold} puntos sobre ${r.total}.</p><div class="row result-actions"><button onclick="home()">Volver al inicio</button><button class="secondary" onclick="reviewCurrent()">🔎 Ver revisión</button></div></div><div id="review" class="review"></div></main>`;
}
function reviewCurrent() {
  if (window.__lastResult) reviewAll(window.__lastResult);
}
async function reviewAll(r) {
  const box=document.getElementById('review');
  if(!box || state.active || academicState.active)return;
  let index;
  try { index=await ensureProfessor('english'); } catch(error) { notice(error.message); }
  if(!box.isConnected || state.active || academicState.active)return;
  const repeated=index?recurrentConceptFailures(professorHistory('english'),index,'english'):{};
  const items=r.questions.map((q,i)=>({q,i,a:r.answers[i],ok:isCorrect(q,r.answers[i]),view:professorView(index,'english',q,r.answers[i])}));
  items.sort((x,y)=>Number(x.q.neutralized || x.view.status==='anomaly' || x.ok)-Number(y.q.neutralized || y.view.status==='anomaly' || y.ok) || x.i-y.i);
  box.innerHTML='<div class="review-title"><h3>Revisión</h3><div class="review-sub">Primero tus fallos y después el resto de preguntas.</div></div>'+items.map(({q,i,a,ok,view})=>{
    const anomaly=q.neutralized || view.status==='anomaly';
    return '<div class="item '+(anomaly?'neutral':!a?'blank':ok?'ok':'bad')+'" data-question-id="'+esc(q.id)+'"><div class="qmeta">Pregunta '+(i+1)+' de '+r.questions.length+' '+typeBadge(q)+'</div><b>'+esc(q.pregunta)+'</b>'+ (anomaly?'<p class="notice"><b>⚠ Anomalía / ambigüedad'+(q.neutralized?' · ANULADA · no puntúa.':' documentada.')+'</b> '+(q.neutralized?'No suma, no resta y no se incluye en el total evaluable.':'La clave del banco se conserva; requiere revisión humana.')+'</p><p>'+esc(q.reviewNote || view.anomalyReason || '')+'</p>':'<p>Tu respuesta: <b class="'+(ok?'correct':a?'wrong':'')+'">'+(ok?'✓ ':a?'✗ ':'')+esc(a?a.toUpperCase()+' — '+q.opciones[a]:'En blanco')+'</b></p><p>Respuesta utilizada para corregir: <b class="correct">✓ '+validAnswers(q).map(k=>esc(k.toUpperCase()+' — '+q.opciones[k])).join(' / ')+'</b></p>')+renderProfessor(view,{repeated:repeated[view.conceptId] || 0})+'</div>';
  }).join('');
}
function statsModuleFromAttempt(x) {
  const m = String(x.mode || '');
  if (m.startsWith('academic_')) return m.split('_')[1] || 'academic';
  return 'english';
}
function statsPercent(x) {
  return precision(x);
}
function statsApto(x) {
  if (String(x.mode || '').startsWith('academic_')) return typeof x.apto === 'boolean' ? x.apto : (Number(x.wrong) || 0) <= 5;
  return Number(x.score || 0) >= Number(x.total || 0) * 0.4;
}
function showGeneralStats() {
  setModuleTheme('neutral');
  const all = history(), h = all.filter(x => !parseTopicMode(x.mode));
  const modules = [['english', '🗣️', 'Inglés'], ['ortografia', '✍️', 'Ortografía'], ['gramatica', '📚', 'Gramática']];
  const totalTests = h.length,
    aptos = h.filter(statsApto).length,
    avg = totalTests ? Math.round(h.reduce((s, x) => s + statsPercent(x), 0) / totalTests) : 0;
  const cards = modules.map(([key, icon, name]) => {
    const arr = h.filter(x => statsModuleFromAttempt(x) === key),
      n = arr.length,
      av = n ? Math.round(arr.reduce((s, x) => s + statsPercent(x), 0) / n) : 0,
      ap = arr.filter(statsApto).length;
    return `<div class="module-stat-card"><div class="module-stat-head"><div class="module-stat-name">${icon} ${name}</div><div class="module-stat-pct">${n ? av + '%' : '—'}</div></div><div class="stat-bar"><i style="width:${av}%"></i></div><div class="module-stat-meta"><span>${n} ${n === 1 ? 'examen' : 'exámenes'}</span><span>${ap} APTO · ${n - ap} NO APTO</span></div></div>`;
  }).join('');
  const recent = all.slice(-8).reverse().map((x, revIndex) => {
    const originalIndex = all.length - 1 - revIndex,
      d = new Date(x.date),
      p = statsPercent(x),
      ap = statsApto(x);
    return `<div class="recent-test"><div class="rt-main"><div class="rt-label">${esc(x.label || 'Examen')}</div><div class="rt-date">${d.toLocaleDateString('es-ES')} · ${d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })}</div></div><div class="rt-score ${ap ? 'apt' : 'noapt'}">${p.toFixed(1)}% precisión · ${Number(x.score).toFixed(2)} puntos · ${ap ? 'APTO' : 'NO APTO'}</div><button class="secondary" onclick="reviewHistoryEntry(${originalIndex})">🔎 Revisar</button></div>`;
  }).join('');
  app.innerHTML = `<main>${authPanel('general-stats')}<section class="hero"><div class="lead">Seguimiento de tu preparación</div><h1>📊 Mis estadísticas generales</h1><p>Una visión conjunta de tus resultados en Inglés, Ortografía y Gramática.</p></section>${totalTests ? `<div class="general-stats-grid"><div class="general-stat"><div class="value">${totalTests}</div><div class="label">Exámenes realizados</div></div><div class="general-stat"><div class="value">${aptos}</div><div class="label">APTO</div></div><div class="general-stat"><div class="value">${avg}%</div><div class="label">Precisión media</div></div></div><section class="card"><h2 class="general-section-title">Comparativa por módulo</h2><p class="small center">Media de aciertos sobre el total de cada examen.</p>${cards}</section><section class="card" style="margin-top:14px"><h2 class="general-section-title">Gráfica comparativa</h2><p class="small center">Media de resultados por módulo.</p><div class="compare-chart">${modules.map(([key, icon, name]) => {
    const arr = h.filter(x => statsModuleFromAttempt(x) === key),
      n = arr.length,
      av = n ? Math.round(arr.reduce((s, x) => s + statsPercent(x), 0) / n) : 0;
    return `<div class="compare-col"><div class="compare-value">${n ? av + "%" : "—"}</div><div class="compare-track"><i class="compare-fill" style="height:${n ? av : 0}%"></i></div><div class="compare-label">${icon} ${name}</div><div class="compare-count">${n} ${n === 1 ? "examen" : "exámenes"}</div></div>`;
  }).join("")}</div></section><section class="card" style="margin-top:14px"><h2 class="general-section-title">Últimos exámenes</h2>${recent || '<div class="general-empty">Todavía no hay exámenes guardados.</div>'}</section>` : `<section class="card general-empty"><h2>Aún no hay resultados</h2><p>Cuando completes tu primer examen aparecerán aquí tus estadísticas y la comparativa entre los tres módulos.</p><button onclick="home()">Ir a los módulos</button></section>`}</main>`;
}
function showHistory() {
  setModuleTheme('neutral');
  const h = history();
  const rows = h.map((x, i) => {
    const pass = statsApto(x),
      d = new Date(x.date);
    return `<div class="history-row" style="cursor:default"><div><b>${esc(x.label || 'Examen')}</b><div class="small">${d.toLocaleDateString('es-ES')} · ${d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })}</div></div><div class="history-score ${pass ? 'pass' : 'fail'}">${String(x.mode || '').startsWith('academic_') ? x.correct + ' / ' + x.total : Number(x.score || 0).toFixed(2)} · ${pass ? 'APTO' : 'NO APTO'}</div><button class="secondary" onclick="reviewHistoryEntry(${i})">🔎 Ver revisión</button></div>`;
  }).reverse().join('');
  app.innerHTML = `<main>${authPanel('general-stats')}<section class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Mis estadísticas</h2><button class="secondary" onclick="home()">Volver</button></div>${h.length ? '<p class="small">Tus intentos de Inglés, Ortografía y Gramática se guardan juntos en la misma cuenta.</p>' + rows : '<p>No hay tests guardados todavía.</p>'}</section></main>`;
}
function reviewSaved(index) {
  reviewHistoryEntry(index);
}
function clearStats() {
  if (confirm('¿Borrar todas las estadísticas guardadas en este navegador?')) {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem('gcEnglishStats');
    home();
  }
}
const loadedBanks = new Map();
let syncStatus = 'Solo en este dispositivo';
const enqueueSync = serialQueue(error => {
  setSyncStatus('Pendiente de sincronizar');
  notice(error.message);
});
const userKeys = [HISTORY_KEY, FAILURES_KEY, CYCLES_KEY, 'gcAcademicFailures_ortografia', 'gcAcademicFailures_gramatica', 'gcFailureDeletes', ACTIVE_KEY];
const tabId = crypto.randomUUID();
function notice(message) {
  let box = document.getElementById('appNotice');
  if (!box) {
    box = document.createElement('div');
    box.id = 'appNotice';
    box.className = 'notice';
    box.setAttribute('role', 'status');
    document.querySelector('header').after(box);
  }
  box.textContent = message;
}
function setSyncStatus(message) {
  syncStatus = message;
  let box = document.getElementById('syncStatus');
  if (!box) {
    box = document.createElement('div');
    box.id = 'syncStatus';
    box.setAttribute('role', 'status');
    box.className = 'sync-status';
    document.querySelector('header').append(box);
  }
  box.textContent = message;
}
onStorageError(message => notice(message));
function switchAccount(user) {
  const previous = readJSON('gcStorageOwner', null),
    next = user?.id || 'guest';
  if (previous && previous !== next) {
    const archive = Object.fromEntries(userKeys.map(k => [k, readJSON(k, null)]));
    if (!writeJSON('gcAccountArchive:' + previous, archive)) {
      throw Error('No hay espacio para proteger los datos de la cuenta anterior.');
    }
    const restored = readJSON('gcAccountArchive:' + next, {});
    for (const k of userKeys) {
      if (restored[k] !== undefined && restored[k] !== null) writeJSON(k, restored[k]);else removeStored(k);
    }
  } else if (!previous) {
    // First adoption preserves a complete legacy backup before any cloud merge.
    const backup = Object.fromEntries(userKeys.map(k => [k, readJSON(k, null)]));
    if (!writeJSON('gcLegacyBackupV1', backup)) throw Error('No se pudo crear la copia compatible del almacenamiento.');
  }
  writeJSON('gcStorageOwner', next);
  currentUser = user || null;
  setSyncStatus(user ? 'Pendiente de sincronizar' : 'Solo en este dispositivo');
}
async function getJSON(path) {
  const response = await fetch(new URL('../../' + path, import.meta.url));
  if (!response.ok) throw Error('No se pudo cargar ' + path);
  return response.json();
}
async function ensureBank(module) {
  if (loadedBanks.has(module)) return loadedBanks.get(module);
  const pending = (async () => {
    if (module === 'english') {
      const [official, training] = await Promise.all([getJSON('data/english/official.json'), getJSON('data/english/training.json')]);
      DATA = official;
      DATA.generadas = training;
      OFICIALES = DATA.examenes.flatMap(e => e.preguntas.map(q => ({
        ...q,
        tipo: 'oficial',
        fuente: e.nombre,
        examenId: e.id
      })));
      GENERADAS = training;
      topicPools.english = buildTopicPools('english', training);
      ALL = [...OFICIALES, ...GENERADAS];
      EVALUABLE = ALL.filter(q => q.respuesta_correcta && !q.excludeRandom);
      RESERVA = DATA.examenes.flatMap(e => (e.reserva || []).map(q => ({
        ...q,
        fuente: e.nombre,
        examenId: e.id,
        tipo: 'reserva'
      })));
    } else {
      const directory = module === 'ortografia' ? 'orthography' : 'grammar';
      const [official, training] = await Promise.all([getJSON('data/' + directory + '/official.json'), getJSON('data/' + directory + '/training.json')]);
      ACADEMIC_BANK[module] = official;
      TRAINING_ACADEMIC_BANK[module] = training;
      topicPools[module] = buildTopicPools(module, training.nuevas);
      if (module === 'gramatica') AUDIT_GRAMMAR_RULES = await getJSON('data/grammar/explanations.json');
    }
  })().catch(error => {
    loadedBanks.delete(module);
    throw error;
  });
  loadedBanks.set(module, pending);
  return pending;
}
function lookupQuestion(module, id) {
  return module === 'english' ? ALL.find(q => q.id === id) : [...academicPool(module), ...TRAINING_ACADEMIC_BANK[module].nuevas].find(q => q.id === id);
}
function recordFailureDeletes(questions, module) {
  const deleted = readJSON('gcFailureDeletes', {});
  questions.forEach(q => {
    deleted[remoteFailureId(q, module)] = Date.now();
  });
  writeJSON('gcFailureDeletes', deleted);
}
function mergeFailureDeletes(local, remote) {
  const result = {
    ...local
  };
  for (const entry of remote) {
    try {
      const {
        id,
        at
      } = JSON.parse(entry);
      if (typeof id === 'string' && Number.isFinite(at)) result[id] = Math.max(result[id] || 0, at);
    } catch {}
  }
  return result;
}
function failureIsDeleted(q, id, deleted) {
  return !!deleted[id] && Math.max(Number(q._lastFailureAt) || 0, Date.parse(q._failureAddedAt) || 0) <= deleted[id];
}
function clearFailureTombstone(q, module) {
  const deleted = readJSON('gcFailureDeletes', {});
  delete deleted[remoteFailureId(q, module)];
  writeJSON('gcFailureDeletes', deleted);
}
function commitExam(s) {
  if (s.transaction) {
    const latest = questionCycles(),
      changes = {};
    for (const key of Object.keys(s.transaction.draft)) {
      if (JSON.stringify(s.transaction.snapshot[key]) === JSON.stringify(s.transaction.draft[key])) continue;
      changes[key] = s.transaction.draft[key];
    }
    saveQuestionCycles(mergeCycles(latest, changes));
  }
  saveQuestionCycles(updateMastery(history(), questionCycles()));
  syncQuestionCyclesCloud().catch(() => {});
  s.active = false;
  s.transaction = null;
  s.cycleSnapshot = null;
  removeStored(ACTIVE_KEY);
}
function discardExam(s) {
  s.active = false;
  s.transaction = null;
  s.cycleSnapshot = null;
  removeStored(ACTIVE_KEY);
}
function persistActive(kind) {
  const s = kind === 'english' ? state : academicState;
  if (!s.active) return;
  writeJSON(ACTIVE_KEY, {
    schemaVersion: 1,
    owner: readJSON('gcStorageOwner', 'guest'),
    tabId,
    kind,
    module: s.module || 'english',
    mode: s.mode,
    topicId: s.topicId || null,
    questionIds: (s.questions || s.items).map(q => q.id),
    answers: s.answers,
    idx: s.idx,
    startedAt: s.startedAt,
    deadline: s.deadline,
    difficulty: s.difficulty,
    label: s.label,
    transaction: s.transaction,
    cycleSnapshot: s.cycleSnapshot
  });
}
function armTimer(kind) {
  const s = kind === 'english' ? state : academicState;
  runTimer(s, kind === 'english' ? updateTimer : academicUpdateTimer, kind === 'english' ? finish : academicFinish);
}
async function resumeExam() {
  const saved = readJSON(ACTIVE_KEY, null);
  if (!saved) return false;
  if (saved.owner !== readJSON('gcStorageOwner', 'guest')) return false;
  const module = saved.kind === 'english' ? 'english' : saved.module;
  await ensureBank(module);
  const questions = saved.questionIds.map(id => lookupQuestion(module, id) || (module === 'english' ? failureBank() : academicFailureBank(module)).find(q => q.id === id));
  if (questions.some(q => !q)) {
    notice('El examen guardado contiene preguntas no disponibles. Exporta los datos para recuperarlo; su ciclo no se ha consumido.');
    return false;
  }
  if (!Number.isFinite(saved.deadline) || !Number.isFinite(saved.startedAt) || saved.deadline < saved.startedAt) {
    notice('El examen guardado no tiene un plazo válido. Se conserva para revisión.');
    return false;
  }
  const s = saved.kind === 'english' ? state : academicState;
  Object.assign(s, saved, {
    active: true,
    timeLeft: remainingSeconds(saved.deadline),
    idx: Math.min(Math.max(0, saved.idx), questions.length - 1),
    timer: null
  });
  if (saved.kind === 'english') {
    s.questions = questions;
    renderTest();
  } else {
    s.items = questions;
    academicRender();
  }
  armTimer(saved.kind);
  return true;
}
function rebuildAcademicDetails(r) {
  if (r.detalles) return r;
  const ortho = r.mode.includes('_ortografia_');
  return {
    ...r,
    detalles: (r.questions || []).flatMap((q, i) => ortho ? (q.elementos_destacados || []).map((e, j) => ({
      ...e,
      questionId: q.id,
      position: j + 1,
      texto: e.texto,
      frase: q.frase,
      answer: r.answers?.[i]?.[j],
      examen: q.examen,
      es_nueva: q.es_nueva,
      regla: e.regla || q.regla,
      explicacion_profesor: e.explicacion || q.explicacion_profesor
    })) : [{
      ...q,
      questionId: q.id,
      texto: q.frase,
      answer: r.answers?.[i]
    }])
  };
}
function exportLocalData() {
  const data = dumpStorage();
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'guardia-civil-backup.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// Convert legacy template callbacks to a small, explicit event dispatcher. No
// eval/Function and no inline JavaScript permission is needed in the CSP.
function dispatchAction(action, element) {
  if (action === "this.nextElementSibling.classList.toggle('hidden')") {
    element.nextElementSibling?.classList.toggle('hidden');
    return;
  }
  for (const command of action.split(';').filter(Boolean)) {
    const match = command.trim().match(/^(\w+)\((.*)\)$/);
    if (!match) continue;
    const args = match[2].trim() ? match[2].split(',').map(raw => {
      const text = raw.trim();
      if (/^'[^']*'$/.test(text)) return text.slice(1, -1);
      if (/^-?\d+$/.test(text)) return Number(text);
      if (text === 'false') return false;
      if (text === 'true') return true;
      throw Error('Argumento no permitido');
    }) : [];
    if (!publicActions.has(match[1])) continue;
    Promise.resolve(window[match[1]](...args)).catch(error => notice(error.message));
  }
}
const publicActions = new Set(['home', 'englishHome', 'moduleHome', 'showGeneralStats', 'showHistory', 'showAuth', 'closeAuth', 'submitAuth', 'signOut', 'start', 'startFailures', 'startHistorical', 'setDifficulty', 'clearFailures', 'clearStats', 'startAcademic', 'startEnglishTopic', 'startAcademicTopic', 'setAcademicDifficulty', 'academicChoose', 'academicGo', 'academicPrev', 'academicNext', 'academicFinish', 'abandonAcademicTest', 'choose', 'goTo', 'prev', 'next', 'abandonEnglishTest', 'confirmFinish', 'reviewCurrent', 'reviewAcademic', 'reviewHistoryEntry', 'reviewSaved', 'reviewSavedAcademic', 'showAcademicReserves']);
function wireActions() {
  for (const element of app.querySelectorAll('[onclick],[onchange]')) for (const event of ['click', 'change']) {
    const value = element.getAttribute('on' + event);
    if (value !== null) {
      element.dataset[event + 'Action'] = value;
      element.removeAttribute('on' + event);
    }
  }
}
new MutationObserver(wireActions).observe(app, {
  childList: true,
  subtree: true
});
for (const event of ['click', 'change']) app.addEventListener(event, e => {
  const element = e.target.closest('[data-' + event + '-action]');
  if (element) {
    e.preventDefault();
    try {
      dispatchAction(element.dataset[event + 'Action'], element);
    } catch (error) {
      notice(error.message);
    }
  }
});
const originalEnglishHome = englishHome,
  originalModuleHome = moduleHome;
englishHome = async function () {
  try {
    await ensureBank('english');
    originalEnglishHome();
  } catch (error) {
    notice(error.message);
  }
};
moduleHome = async function (module) {
  try {
    await ensureBank(module);
    originalModuleHome(module);
  } catch (error) {
    notice(error.message);
  }
};
const originalShowStats = showGeneralStats;
showGeneralStats = async function () {
  originalShowStats();
  const h = history();
  if (!h.length) return;
  const general = h.filter(x => !parseTopicMode(x.mode));
  const summary = summarize(general);
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = `<h2>Detalle de práctica</h2><p>${summary.total} respuestas · tiempo medio ${formatTime(Math.round(summary.meanTime))} · puntuación media ${summary.meanScore.toFixed(2)}</p>`;
  for (const field of ['difficulty', 'mode']) {
    const groups = Object.groupBy(general, x => x[field] || 'Sin dato');
    for (const [name, entries] of Object.entries(groups)) {
      const g = summarize(entries);
      const p = document.createElement('p');
      p.textContent = `${name}: ${g.attempts} intentos, ${g.total} respuestas; precisión ${g.precision.toFixed(1)}%, puntuación media ${g.meanScore.toFixed(2)}.`;
      section.append(p);
    }
  }
  const topicAttempts=h.filter(x=>parseTopicMode(x.mode));
  if(topicAttempts.length){const p=document.createElement('p');p.textContent='Práctica por contenidos (separada): '+topicAttempts.length+' intentos. El dominio se consulta en las tarjetas de cada módulo.';section.append(p);}
  document.querySelector('main').append(section);
  await Promise.all([...new Set(h.map(statsModuleFromAttempt))].map(module=>ensureBank(module)));
  if(!section.isConnected)return;
  const groups=new Map();
  for(const entry of general){
    const module=statsModuleFromAttempt(entry);
    const result=hydrateAttempt(entry,id=>lookupQuestion(module,id));
    for(const [i,q] of result.questions.entries()){
      if(q.neutralized)continue;
      const type=q.tipo==='oficial'||q.es_oficial?'Oficial':'Entrenamiento';
      const key=module+' · '+type+' · '+(q.tema||q.regla||'Sin tema registrado');
      if(!groups.has(key))groups.set(key,{n:0,correct:0,attempts:new Set()});
      const group=groups.get(key);group.attempts.add(entry.date);
      if(module==='english'){group.n++;if(isCorrect(q,result.answers[i]))group.correct++;}
      else if(module==='ortografia'){for(const [j,e] of (q.elementos_destacados||[]).entries()){group.n++;if(result.answers[i]?.[j]===e.respuesta)group.correct++;}}
      else{group.n++;if(result.answers[i]===q.respuesta)group.correct++;}
    }
  }
  const details=document.createElement('details'),title=document.createElement('summary');title.textContent='Precisión por procedencia y tema';details.append(title);
  for(const [name,group] of groups){const row=document.createElement('p');row.textContent=`${name}: ${group.n? (100*group.correct/group.n).toFixed(1):'0.0'}% · ${group.n} respuestas de ${group.attempts.size} intentos.`;details.append(row);}
  section.append(details);
};
const originalAuthModal = authModal,
  originalCloseAuth = closeAuth;
let modalFocus;
authModal = function () {
  modalFocus = document.activeElement;
  originalAuthModal();
  document.getElementById('authEmail').focus();
};
closeAuth = function () {
  originalCloseAuth();
  modalFocus?.focus();
};
document.addEventListener('keydown', event => {
  const modal = document.getElementById('authModal');
  if (modal) {
    if (event.key === 'Escape') {
      closeAuth();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = [...modal.querySelectorAll('button,input')].filter(x => !x.disabled);
      const first = focusable[0],
        last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    return;
  }
  if (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable || event.ctrlKey || event.altKey || event.metaKey) return;
  if (state.active) {
    if (/^[a-d]$/i.test(event.key)) {
      event.preventDefault();
      choose(event.key.toLowerCase());
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
    } else if (event.key === 'ArrowRight' && state.idx < state.questions.length - 1) {
      event.preventDefault();
      goTo(state.idx + 1);
    }
  }
});
function reconcileTime() {
  if (state.active) armTimer('english');
  if (academicState.active) armTimer('academic');
}
document.addEventListener('visibilitychange', reconcileTime);
window.addEventListener('pageshow', reconcileTime);
window.addEventListener('pagehide', () => {
  if (state.active) persistActive('english');
  if (academicState.active) persistActive('academic');
});
window.addEventListener('storage', event => {
  if (event.key === ACTIVE_KEY && (state.active || academicState.active)) {
    const other = readJSON(ACTIVE_KEY, null);
    if (other?.tabId !== tabId) {
      clearInterval(state.timer);
      clearInterval(academicState.timer);
      state.active = false;
      academicState.active = false;
      home();
      notice('El examen se ha abierto o finalizado en otra pestaña. Continúa allí.');
    }
  }
});
async function connectCloud() {
  try {
    supabaseClient = await createCloudClient();
    const {
      data,
      error
    } = await supabaseClient.auth.getSession();
    if (error) throw error;
    if (data?.session?.user) {
      await handleUser(data.session.user);
    }
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => handleUser(session?.user || null).catch(e => notice(e.message)), 0);
    });
  } catch (error) {
    setSyncStatus('Sin conexión · progreso local');
  }
}
window.addEventListener('online', () => {
  if (!supabaseClient) connectCloud();else loadCloudData().catch(() => {});
});
async function initialize() {
  home();
  setSyncStatus(syncStatus);
  const footer = document.createElement('div');
  footer.className = 'backup-control';
  const button = document.createElement('button');
  button.className = 'secondary';
  button.textContent = 'Exportar copia de mis datos';
  button.onclick = exportLocalData;
  footer.append(button);
  document.body.append(footer);
  if ('serviceWorker' in navigator) {
    const offline = document.createElement('button');
    offline.className = 'secondary';
    offline.textContent = 'Preparar todos los bancos sin conexión';
    offline.onclick = async () => {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage('prepare-offline');
      notice('Descargando bancos para uso sin conexión…');
    };
    footer.append(offline);
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data === 'offline-ready') notice('Todos los bancos están disponibles sin conexión.');
      if (event.data === 'offline-failed') notice('No se completó la descarga. Reintenta cuando haya conexión.');
    });
  }
  try {
    await resumeExam();
  } catch (error) {
    notice(error.message);
  }
  connectCloud();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
Object.assign(window,{home,englishHome,moduleHome,showGeneralStats,showHistory,showAuth,closeAuth,submitAuth,signOut,start,startFailures,startHistorical,setDifficulty,clearFailures,clearStats,startAcademic,startEnglishTopic,startAcademicTopic,setAcademicDifficulty,academicChoose,academicGo,academicPrev,academicNext,academicFinish,abandonAcademicTest,choose,goTo,prev,next,abandonEnglishTest,confirmFinish,reviewCurrent,reviewAcademic,reviewHistoryEntry,reviewSaved,reviewSavedAcademic,showAcademicReserves,renderFailureStatus,syncFailuresCloud,resumeExam,exportLocalData});
initialize();
