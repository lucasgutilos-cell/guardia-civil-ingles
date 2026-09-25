import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadBanks} from '../scripts/banks.mjs';
import {validateProfessor,professorBanks} from '../scripts/validate-professor.mjs';
import {SAFE_FALLBACK,createProfessorIndex,sourceSignature,validateProfessorRecord,professorView,reconstructEnglish,textDiff,safeSourceURL,recurrentConceptFailures,correctedOrthographyPhrase} from '../assets/js/services/professor.js';
import {renderProfessor,renderDifference} from '../assets/js/modules/professor/render.js';
const q={id:'fixture-english',pregunta:'She _____ here every day.',opciones:{a:'works',b:'work',c:'working',d:'worked'},respuesta_correcta:'a'};
const rule={id:'fixture-present',title:'Presente simple',plain:'El sujeto singular de tercera persona requiere -s.',sourceRefs:[{name:'Cambridge Grammar Today',url:'https://dictionary.cambridge.org/grammar/british-grammar/present-simple-i-work'}]};
function record(question=q) {return {id:question.id,source:'training',status:'editorial',sourceVerified:false,sourceSignature:sourceSignature('english',question),originalText:question.pregunta,acceptedKeys:[...(question.validAnswers || [question.respuesta_correcta])],conceptId:'present',topicId:'verb-tenses',ruleId:rule.id,correctedText:'She works here every day.',quick:'She exige works en este hábito.',whyCorrect:'Works concuerda con la tercera persona singular y describe el hábito diario.',optionReasons:{a:'Works concuerda con she.',b:'Work omite la -s requerida por she.',c:'Working necesita un auxiliar.',d:'Worked es pasado; el hábito descrito es presente.'},examTrap:'Reconoce el sujeto antes de elegir el verbo.',memoryTip:'She trabaja con la terminación -s.',exampleGood:'My brother walks to school.'};}
const indexFor=(r=record())=>createProfessorIndex({records:[r]},{rules:[rule]});

test('Professor reconstructs gaps without swallowing spaces, including spaced dots and multiple slashes',()=>{
  assert.equal(reconstructEnglish('You must _____ dinner.','eat'),'You must eat dinner.');
  assert.equal(reconstructEnglish('If she _____, we _____ at home.','comes / will stay'),'If she comes, we will stay at home.');
  assert.equal(reconstructEnglish('We . . . . to her yesterday.','spoke'),'We spoke to her yesterday.');
  assert.equal(reconstructEnglish('To eat fast is bad for you. You .... eat more slowly..','must'),'To eat fast is bad for you. You must eat more slowly.');
  assert.equal(reconstructEnglish('I … ready.','am'),'I am ready.');
  assert.equal(reconstructEnglish('Choose the correct option.','The child is asleep.'),'The child is asleep.');
  assert.equal(reconstructEnglish('Rewrite this sentence in reported speech: “I am ready”.','She said she was ready.'),'She said she was ready.');
  assert.equal(reconstructEnglish('She _____ here and _____ later.','works'),null);
  assert.equal(reconstructEnglish('An old snapshot has lost its blank.','was'),null);
  assert.equal(reconstructEnglish('She _____ here.','____'),null);
});
test('specific selected distractor diagnosis, blank and correct explanations',()=>{
  const index=indexFor();
  assert.deepEqual(validateProfessorRecord(record(),rule,'english',q),[]);
  const wrong=professorView(index,'english',q,'b');
  assert.equal(wrong.userDiagnosis,'Work omite la -s requerida por she.');
  assert.equal(wrong.correct,false);assert.match(wrong.provenanceLabel,/Dictamen editorial/);
  assert.match(professorView(index,'english',q).userDiagnosis,/en blanco/);
  const correct=professorView(index,'english',q,'a');assert.equal(correct.correct,true);
  assert.match(renderProfessor(correct),/<summary>Por qué está bien<\/summary>/);
  assert.match(renderProfessor(wrong),/<summary>Entender este fallo<\/summary>/);
  assert.match(renderProfessor(wrong),/Cómo descartar las demás opciones/);
});
test('historical signature mismatch and invalid/missing records use only the exact safe fallback',()=>{
  const old={...q,opciones:{...q.opciones,b:'used to work'}};
  for(const view of [professorView(indexFor(),'english',old,'b'),professorView(undefined,'english',q),professorView(indexFor({...record(),quick:''}),'english',q)]){
    assert.equal(view.status,'unavailable');assert.equal(view.quick,SAFE_FALLBACK);
    assert.equal(renderProfessor(view),`<p class="professor-fallback">${SAFE_FALLBACK}</p>`);
  }
});
test('all validAnswers stay accepted, neutralized questions never assert a unique answer',()=>{
  const multi={...q,validAnswers:['a','d']};
  const r=record(multi),index=indexFor(r);
  assert.equal(professorView(index,'english',multi,'d').correct,true);
  assert.equal(professorView(index,'english',multi,'d').acceptedAnswers.length,2);
  const neutral={...q,neutralized:true},nr={...record(neutral),status:'anomaly',correctedText:'',anomalyReason:'La transcripción no permite una solución inequívoca.'};
  const view=professorView(indexFor(nr),'english',neutral,'a');
  assert.deepEqual(view.acceptedAnswers,[]);assert.equal(view.correct,false);assert.equal(view.correctedText,'');
  const html=renderProfessor(view,{repeated:3});assert.doesNotMatch(html,/professor-correct|professor-wrong|Patrón recurrente|Respuesta utilizada para corregir/);
});
test('validator rejects key, gap, example, rule, repeated prose, placeholder and source defects',()=>{
  const changes=[{acceptedKeys:['b']},{correctedText:'She _____ here.'},{exampleGood:q.pregunta},{exampleGood:''},{quick:record().whyCorrect},{memoryTip:'Repite mentalmente esta oración.'},{optionReasons:{a:'ok',b:'',c:'aux',d:'past'}},{quick:'<img src=x onerror=alert(1)>'}];
  for(const change of changes)assert.ok(validateProfessorRecord({...record(),...change},rule,'english',q).length,JSON.stringify(change));
  assert.ok(validateProfessorRecord(record(),undefined,'english',q).includes('missing-rule'));
  assert.ok(validateProfessorRecord(record(),{...rule,sourceRefs:[{name:'bad',url:'https://evil.test'}]},'english',q).includes('invalid-source'));
  assert.throws(()=>createProfessorIndex({records:[record(),record()]},[rule]),/duplicada/);
});
test('source allowlist rejects non-HTTPS, credentials, lookalike hosts, ports and executable schemes',()=>{
  for(const u of ['http://www.rae.es/dpd/haber','javascript:alert(1)','https://www.rae.es.evil.test','https://user@www.rae.es','https://dictionary.cambridge.org:8000','data:text/html,<script>'])assert.equal(safeSourceURL(u),false,u);
  for(const u of ['https://www.rae.es/dpd/haber','https://dle.rae.es/asta','https://learnenglish.britishcouncil.org/grammar','https://dictionary.cambridge.org/grammar'])assert.equal(safeSourceURL(u),true,u);
});
test('renderer escapes text/attributes even if called directly with hostile data',()=>{
  const view=professorView(indexFor(),'english',q,'b');
  Object.assign(view,{quick:'<img src=x onerror=alert(1)>',userAnswer:'<script>alert(1)</script>',conceptId:'" autofocus="true',optionReasons:{a:'<b>bad</b>'},sourceRefs:[{name:'unsafe',url:'javascript:alert(1)'},{name:'<script>ref</script>',url:'https://www.rae.es/dpd/haber'}]});
  const html=renderProfessor(view);assert.doesNotMatch(html,/<img|<script|<b>bad|href="javascript:/);
  assert.match(html,/&lt;img/);assert.match(html,/rel="noopener noreferrer"/);assert.match(html,/&quot; autofocus/);
});
test('minimal character diff preserves unchanged letters and accents',()=>{
  assert.deepEqual(textDiff('casa','caza'),[{type:'equal',text:'ca'},{type:'delete',text:'s'},{type:'insert',text:'z'},{type:'equal',text:'a'}]);
  assert.deepEqual(textDiff('fé','fe'),[{type:'equal',text:'f'},{type:'delete',text:'é'},{type:'insert',text:'e'}]);
  assert.equal(textDiff('same','same').length,1);
  assert.doesNotMatch(renderDifference('<x>','<y>'),/<x>|<y>/);
});
test('recurrent concept failures count local wrong/blanks, exclude neutral and other modules',()=>{
  const attempts=[{date:'2026-01-01',mode:'new',questions:[q],answers:{0:'b'}},{date:'2026-01-02',mode:'new',questions:[q],answers:{}},{date:'2026-01-03',mode:'new',questions:[q],answers:{0:'a'}},{date:'2026-01-04',mode:'academic_gramatica_new',questions:[q],answers:{0:'b'}}];
  assert.deepEqual(recurrentConceptFailures(attempts,indexFor(),'english'),{present:2});
  assert.match(renderProfessor(professorView(indexFor(),'english',q,'b'),{repeated:2}),/Patrón recurrente: 2/);
  const n={...q,neutralized:true},r={...record(n),status:'anomaly',anomalyReason:'Sin solución inequívoca.',correctedText:''};
  assert.deepEqual(recurrentConceptFailures([{mode:'exam',questions:[n],answers:{}}],indexFor(r),'english'),{});
});
test('materialized Professor coverage and all structural invariants pass without network',()=>{
  const report=validateProfessor();assert.deepEqual(report.structuralValidation.errors,[]);
  assert.equal(report.coverage.english.expected,1261);assert.equal(report.coverage.ortografia.expected,2480);assert.equal(report.coverage.gramatica.expected,640);
  for(const c of Object.values(report.coverage)){assert.equal(c.records,c.expected);assert.equal(c.byStatus.unavailable,undefined);}
});
test('neutralized English items never present a historical key as an accepted solution',()=>{
  const anomalies=JSON.parse(fs.readFileSync('data/professor/english.json')).records.filter(r=>r.status==='anomaly');
  assert.ok(anomalies.length>0);
  for(const record of anomalies){
    assert.equal(record.correctedText,'');
    assert.doesNotMatch(record.quick,/respuesta admitida|respuesta correcta/i);
    for(const reason of Object.values(record.optionReasons))assert.doesNotMatch(reason,/está admitida en esta entrada|es una respuesta admitida/i);
  }
});

test('Active / Passive training explanations distinguish active voice from passive voice',()=>{
  const english=JSON.parse(fs.readFileSync('data/professor/english.json')).records;
  const byId=new Map(english.map(r=>[r.id,r]));
  const johnson=byId.get('stanley-63-12');
  assert.equal(johnson.conceptId,'en-voice-choice');
  assert.equal(johnson.correctedText,'Mr Johnson translated this book.');
  assert.match(johnson.whyCorrect,/voz activa/i);
  assert.match(johnson.whyCorrect,/This book was translated by Mr Johnson/);
  assert.match(johnson.optionReasons.a,/pasiva en presente/i);
  assert.match(johnson.optionReasons.c,/pasado simple activo/i);
  for(const id of ['stanley-63-17','stanley-64-05','stanley-64-19']){
    const record=byId.get(id);assert.ok(record,id);assert.equal(record.conceptId,'en-voice-choice');assert.match(record.whyCorrect,/activa/i);
  }
});


test('materialized Spanish Professor uses readable corrections and preserves sentence capitalization',()=>{
  const grammar=JSON.parse(fs.readFileSync('data/professor/grammar.json')).records;
  const byId=new Map(grammar.map(r=>[r.id,r]));
  assert.equal(byId.get('oficial-2-1').quick,'Cambia «hubieron» por «hubo».');
  assert.equal(byId.get('oficial-2-3').quick,'Cambia «le» por «la».');
  assert.equal(byId.get('oficial-2-4').quick,'Cambia «de que» por «que».');
  for(const record of grammar){
    assert.doesNotMatch(record.quick,/El cambio necesario afecta a/);
    const original=record.originalText.trimStart().replace(/^[¿¡"“‘(]+/u,'');
    const corrected=record.correctedText.trimStart().replace(/^[¿¡"“‘(]+/u,'');
    if(original&&/^\p{Lu}/u.test(original))assert.match(corrected,/^\p{Lu}/u);
  }
});

test('real banks: every valid key and neutral remains compatible; orthography B/M and grammar conflict',()=>{
  const rules=JSON.parse(fs.readFileSync('data/professor/rules.json'));
  const banks=professorBanks(loadBanks().groups);
  for(const [module,questions] of Object.entries(banks)){
    const file=module==='english'?'english':module==='ortografia'?'orthography':'grammar';
    const index=createProfessorIndex(JSON.parse(fs.readFileSync(`data/professor/${file}.json`)),rules);
    for(const question of questions){
      for(const position of module==='ortografia'?question.elementos_destacados.map(e=>e.posicion):[undefined]){
        const view=professorView(index,module,question,undefined,position);
        assert.notEqual(view.status,'unavailable',module+':'+question.id+':'+position);
        if(question.neutralized)assert.equal(view.status,'anomaly');
        if(module==='gramatica'&&question.id==='oficial-2-8')assert.equal(view.status,'anomaly');
        if(module==='english'&&question.validAnswers?.length>1)assert.equal(view.acceptedAnswers.length,question.validAnswers.length);
      }
      if(module==='ortografia'){
        const corrected=correctedOrthographyPhrase(question,index);
        if(corrected)assert.notEqual(corrected.length,0);
      }
    }
  }
});


test('Spanish Professor pedagogy stays specific to the word or construction being reviewed',()=>{
  const grammar=JSON.parse(fs.readFileSync('data/professor/grammar.json')).records;
  const orthography=JSON.parse(fs.readFileSync('data/professor/orthography.json')).records;
  const gm=new Map(grammar.map(r=>[r.id,r]));
  assert.match(gm.get('oficial-4-5-op3').whyCorrect,/Digamos \+ le forma digámosle/);
  assert.match(gm.get('oficial-16-3-op2').whyCorrect,/sustituir «le» por «lo»/);
  const om=new Map(orthography.map(r=>[r.id,r]));
  const envergadura=om.get('oficial-20-7:4');
  assert.match(envergadura.whyCorrect,/en-ver-ga-du-ra/);
  assert.doesNotMatch(envergadura.whyCorrect,/regla general.*mb.*nv/i);
  assert.match(envergadura.exampleGood,/gran envergadura/);
  const conminaba=om.get('oficial-20-7:1');
  assert.match(conminaba.whyCorrect,/conminar, conminaba, conminación/);
  assert.match(conminaba.exampleGood,/juez lo conminaba/);
  const residuos=om.get('oficial-20-7:3');
  assert.match(residuos.whyCorrect,/plural de «residuo»/);
  assert.match(residuos.exampleGood,/Los residuos/);
  for(const r of orthography){
    assert.match(r.exampleGood,new RegExp(r.correctedText.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'));
  }
});
