import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createE2EHarness,activeExam,enterModule} from './e2e-helpers.mjs';
import {loadBanks} from '../scripts/banks.mjs';
import {SAFE_FALLBACK} from '../assets/js/services/professor.js';
const {groups}=loadBanks();let harness;
before(async()=>{harness=await createE2EHarness(4187);});
after(async()=>{await harness?.close();});
const opposite=key=>key==='B'?'M':'B';
const wrong=q=>['a','b','c','d'].find(k=>!(q.validAnswers || [q.respuesta_correcta]).includes(k));
function attempt(mode,questions,answers,date='2026-09-20T12:00:00.000Z'){
  return {mode,label:'Prueba de historial conservado',date,questions,answers,total:questions.length,score:0,correct:0,wrong:questions.length,blank:0,penalty:0,elapsed:40};
}
async function review(page,entries,index=entries.length-1){
  await page.evaluate(({entries,index})=>{localStorage.setItem('gcEnglishHistory',JSON.stringify(entries));return reviewHistoryEntry(index);},{entries,index});
  await page.locator('.professor,.professor-fallback').first().waitFor();
}
test('Professor English: generated, Stanley, official, selected distractors, blank, collapsed success and practice button',async t=>{
  const {page}=await harness.setup(t);
  const records=JSON.parse(fs.readFileSync('data/professor/english.json')).records;
  const stanleyId=records.find(r=>r.source==='stanley'&&r.status==='editorial').id;
  const gen=groups.englishTraining.find(q=>q.id==='generada-0001'),stanley=groups.englishTraining.find(q=>q.id===stanleyId),official=groups.englishOfficial.find(q=>q.id==='oficial-1-1'),blank=groups.englishOfficial.find(q=>q.id==='oficial-1-2');
  const questions=[gen,stanley,official,blank],answers={0:gen.respuesta_correcta,1:wrong(stanley),2:wrong(official)};
  await review(page,[attempt('new',questions,answers)]);
  assert.equal(await page.locator('.professor').count(),4);
  assert.equal(await page.locator('.professor-fallback').count(),0);
  const success=page.locator('[data-question-id="'+gen.id+'"] .professor');
  assert.equal(await success.locator('details').first().getAttribute('open'),null);
  assert.equal(await success.getByText('En 10 segundos',{exact:true}).isVisible(),false);
  const failure=page.locator('[data-question-id="'+official.id+'"] .professor');
  assert.equal(await failure.getByText('En 10 segundos',{exact:true}).isVisible(),true);
  await failure.getByText('Entender este fallo',{exact:true}).click();
  assert.equal(await failure.getByText('Cómo descartar las demás opciones',{exact:true}).isVisible(),true);
  const rec=records.find(r=>r.id===official.id);
  for(const key of ['a','b','c','d'])assert.ok((await failure.innerText()).includes(rec.optionReasons[key]));
  assert.match(await page.locator('[data-question-id="'+blank.id+'"]').innerText(),/En blanco/);
  assert.doesNotMatch(await page.locator('#review').innerText(),/clave oficial verificada/);
  assert.notEqual(await page.locator('.review .item').first().getAttribute('data-question-id'),gen.id);
  await success.getByText('Por qué está bien',{exact:true}).click();
  await success.getByRole('button',{name:'Practicar este contenido',exact:true}).click();
  await page.locator('.qcard').waitFor();
  assert.equal((await activeExam(page)).mode,'topic:verb-tenses');
  assert.equal(await page.locator('.professor,.professor-fallback').count(),0);
  await page.evaluate(()=>reviewHistoryEntry(0));
  assert.equal(await page.locator('.qcard').count(),1);
  assert.equal(await page.locator('.professor').count(),0);
});
test('all 17 English multiple-answer records preserve every admitted reading and all 14 neutralized stay neutral',async t=>{
  const {page}=await harness.setup(t);
  const questions=groups.englishOfficial.filter(q=>q.validAnswers?.length>1 || q.neutralized);
  assert.equal(questions.filter(q=>q.validAnswers?.length>1).length,17);
  assert.equal(questions.filter(q=>q.neutralized).length,14);
  await review(page,[attempt('exam',questions,Object.fromEntries(questions.map((q,i)=>[i,q.validAnswers?.at(-1) || 'c'])))]);
  for(const q of questions){
    const item=page.locator('[data-question-id="'+q.id+'"]');
    assert.equal(await item.locator('.professor').count(),1,q.id);
    if(q.neutralized){assert.match(await item.innerText(),/ANULADA · no puntúa/);assert.equal(await item.locator('.professor-correct,.professor-wrong,.wrong').count(),0);}
    await item.locator('.professor > details').first().locator('summary').first().click();
    for(const key of q.validAnswers || [])assert.ok((await item.innerText()).includes(key.toUpperCase()+' — '+q.opciones[key]),q.id+':'+key);
    if(q.id==='oficial-13-15')assert.equal(await item.getByText('Respuesta utilizada para corregir',{exact:true}).count(),0);
  }
});
test('orthography Professor explains official and training B/M, minimal diff and contextual corrected phrase',async t=>{
  const {page}=await harness.setup(t);
  for(const q of [groups.orthographyOfficial[0],groups.orthographyTraining[0]]){
    const answers=q.elementos_destacados.map((e,i)=>i%2?opposite(e.respuesta):e.respuesta);
    await review(page,[attempt('academic_ortografia_new',[q],{0:answers})]);
    assert.equal(await page.locator('.professor').count(),4);
    assert.equal(await page.locator('.professor-correct').count(),2);
    assert.equal(await page.locator('.professor-wrong').count(),2);
    assert.equal(await page.locator('.corrected-phrase').count(),1);
    for(const card of await page.locator('.professor').all())await card.locator('details').first().locator('summary').first().click();
    assert.equal(await page.locator('.professor-fallback').count(),0);
    assert.ok(await page.locator('.professor-diff ins').count()>0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
});
test('grammar Professor explains official and training correct/wrong and the preserved oficial-2-8 conflict',async t=>{
  const {page}=await harness.setup(t);
  const questions=['oficial-2-1','oficial-2-2','oficial-2-8'].map(id=>groups.grammarOfficial.find(q=>q.id===id)).concat(groups.grammarTraining.slice(0,2));
  const answers={0:'M',1:'M',2:'M',3:'B',4:'B'};
  await review(page,[attempt('academic_gramatica_official',questions,answers)]);
  assert.equal(await page.locator('.professor').count(),5);
  assert.equal(await page.locator('.professor-correct').count(),2);
  assert.equal(await page.locator('.professor-wrong').count(),2);
  const conflict=page.locator('[data-question-id="oficial-2-8"]');
  assert.equal(await conflict.locator('.professor-neutral').count(),1);
  assert.equal(await conflict.locator('.correct,.wrong,.professor-diff').count(),0);
  await conflict.getByText('Entender la anomalía',{exact:true}).click();
  assert.match(await conflict.innerText(),/detrás de mí/);
  assert.equal(await page.locator('.professor-fallback').count(),0);
});
test('old snapshot safely falls back and hostile historical text stays inert',async t=>{
  const {page}=await harness.setup(t);
  const old={...groups.englishTraining[0],pregunta:'Old <img src=x onerror="window.__xss=1"> snapshot.',opciones:{a:'<script>window.__xss=1</script>',b:'b',c:'c',d:'d'}};
  await review(page,[attempt('new',[old],{0:'a'})]);
  assert.equal(await page.locator('.professor').count(),0);
  assert.equal(await page.locator('.professor-fallback').innerText(),SAFE_FALLBACK);
  assert.equal(await page.locator('#review img,#review script').count(),0);
  assert.equal(await page.evaluate(()=>window.__xss),undefined);
});
test('repeated concept diagnosis, native keyboard disclosure, source links and narrow viewport',async t=>{
  const {page}=await harness.setup(t,{viewport:{width:320,height:780}});
  const q=groups.englishTraining[0],answers={0:wrong(q)};
  await review(page,[attempt('new',[q],answers,'2026-09-19T12:00:00.000Z'),attempt('new',[q],answers)]);
  assert.match(await page.locator('.professor').innerText(),/Patrón recurrente: 2/);
  const summary=page.getByText('Entender este fallo',{exact:true});await summary.focus();await page.keyboard.press('Enter');
  assert.equal(await page.getByText('Cómo descartar las demás opciones',{exact:true}).isVisible(),true);
  assert.equal(await summary.evaluate(el=>el===document.activeElement),true);
  assert.ok(await summary.evaluate(el=>el.getBoundingClientRect().height>=44));
  await page.getByText('Base normativa',{exact:true}).focus();await page.keyboard.press('Enter');
  for(const a of await page.locator('.professor-sources a').all()){
    assert.match(await a.getAttribute('href'),/^https:\/\/(dictionary\.cambridge\.org|learnenglish\.britishcouncil\.org)\//);
    assert.equal(await a.getAttribute('rel'),'noopener noreferrer');
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await page.locator('[onclick],[onchange]').count(),0);
});
