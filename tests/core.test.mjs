import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectCycle,transaction} from '../assets/js/services/question-cycles.js';
import {scoreEnglish} from '../assets/js/services/scoring.js';
import {remainingSeconds,elapsedSeconds,englishDuration} from '../assets/js/services/timer.js';
import {compactAttempt,hydrateAttempt,mergeHistory,readJSON,writeJSON,onStorageError} from '../assets/js/services/storage.js';
import {mergeCycles,serialQueue} from '../assets/js/services/supabase.js';
import {precision} from '../assets/js/services/stats.js';
import {loadBanks,validateQuestion} from '../scripts/banks.mjs';
const {groups}=loadBanks();
test('review coverage keeps every Stanley row and quarantines uncertain answers',()=>{
 const bank=groups.englishTraining.filter(q=>q.id.startsWith('stanley-'));
 assert.equal(bank.length,1244);assert.ok(bank.every(q=>q.auditReviewed));
 for(const q of bank){
  assert.notEqual(q.answerStatus,'source-review-required');
  if(q.answerStatus!=='editorial-reviewed'){assert.equal(q.excludeRandom,true);assert.equal(q.neutralized,true);}
 }
});
test('new cycle generation overrides stale IDs and same-generation unions tombstones',()=>{
 assert.deepEqual(mergeCycles({a:['old'],'__epoch:a':[1]},{a:['new'],'__epoch:a':[2]}),{a:['new'],'__epoch:a':[2]});
 const merged=mergeCycles({__failureDeletesV1:['one']},{__failureDeletesV1:['two']});
 assert.deepEqual(merged.__failureDeletesV1,['one','two']);
});
test('cloud queue reports failure and continues processing later work',async()=>{
 const log=[],queue=serialQueue(e=>log.push(e.message));
 await queue(async()=>{throw Error('offline');});
 await queue(async()=>log.push('retry'));assert.deepEqual(log,['offline','retry']);
});
for(const total of [20,40,60,100]){
 test(`score boundary and exact thirds for ${total}`,()=>{
  const qs=Array.from({length:total},()=>({respuesta_correcta:'a'}));const answers={};
  for(let i=0;i<total*.4+1;i++)answers[i]='a';for(let i=total*.4+1;i<total*.4+4;i++)answers[i]='b';
  const score=scoreEnglish(qs,answers);assert.equal(score.score,total*.4);assert.equal(score.apto,true);
  answers[total*.4+4]='b';assert.equal(scoreEnglish(qs,answers).apto,false);assert.equal(scoreEnglish(qs,answers).penalty,4/3);
  assert.equal(englishDuration(total),total/20*900);
 });
 for(const mode of ['official','new_Fácil','new_Media','new_Difícil','mixed_official','mixed_generated_Fácil','mixed_generated_Media','mixed_generated_Difícil']){
  test(`${mode} ${total}: unique IDs, exact exhaustion, boundary and rollback`,()=>{
   const pool=Array.from({length:137},(_,i)=>({id:String(i)}));const previous=pool.slice(0,130).map(q=>q.id);
   const cycles={[mode]:previous};const tx=transaction(cycles);const result=selectCycle(pool,tx.draft[mode],total);tx.draft[mode]=result.used;
   assert.equal(new Set(result.questions.map(q=>q.id)).size,total);assert.deepEqual(cycles,{[mode]:previous});assert.deepEqual(tx.snapshot,cycles);
   for(let i=130;i<137;i++)assert.ok(result.questions.some(q=>q.id===String(i)));
   assert.equal(result.used.length,total-7);assert.equal(selectCycle(pool,[],137).used.length,0);
   assert.throws(()=>selectCycle(pool,[],138));assert.deepEqual(cycles,{[mode]:previous});
  });
 }
}
test('ambiguous accepted variants and neutralized questions',()=>{
 const r=scoreEnglish([{respuesta_correcta:'a',validAnswers:['a','b']},{neutralized:true}],{0:'b'});assert.equal(r.correct,1);assert.equal(r.total,1);assert.equal(r.neutral,1);
});
test('deadline ignores callback frequency and caps recorded elapsed time',()=>{
 assert.equal(remainingSeconds(901000,1000),900);assert.equal(remainingSeconds(901000,500500),401);assert.equal(remainingSeconds(901000,2e6),0);assert.equal(elapsedSeconds(1000,901000,2e6),900);
});
test('legacy history is readable, compact correction key is frozen and merge is additive',()=>{
 const mem=new Map();globalThis.localStorage={getItem:k=>mem.get(k),setItem:(k,v)=>mem.set(k,v)};
 const old={date:'2020',mode:'official',questions:[{id:'x',pregunta:'original',respuesta_correcta:'a'}],answers:{0:'a'}};
 const compact=compactAttempt(old);assert.equal(compact.questions[0].pregunta,undefined);
 assert.equal(hydrateAttempt(compact,()=>({pregunta:'original',respuesta_correcta:'b'})).questions[0].respuesta_correcta,'a');
 assert.equal(hydrateAttempt(old,()=>null).questions[0].pregunta,'original');assert.equal(mergeHistory([old],[old,{...old,date:'2021'}]).length,2);
});
test('quota fallback reports error and does not destroy old values',()=>{
 const local=new Map([['old','[1]']]);globalThis.localStorage={getItem:k=>local.get(k),setItem(){throw Object.assign(new Error('quota'),{name:'QuotaExceededError'});}};
 let error=false;onStorageError(()=>error=true);assert.equal(writeJSON('old',[2]),false);assert.equal(error,true);assert.equal(local.get('old'),'[1]');assert.deepEqual(readJSON('old',[]),[2]);
});
test('precision is independent from penalty; cycle cloud merge preserves both sides',()=>{
 assert.equal(precision({correct:10,total:20,score:8}),50);assert.deepEqual(mergeCycles({a:['1']},{a:['2']}),{a:['1','2']});
});
test('all difficulty pools support 100 and remain separate from official',()=>{
 for(const difficulty of ['Fácil','Media','Difícil'])assert.ok(groups.englishTraining.filter(q=>!q.excludeRandom&&q.dificultad===difficulty).length>=100);
 assert.ok(groups.englishOfficial.every(q=>q.tipo==='oficial'&&q.sourceType==='official'));
});
test('validator catches corrupt answer, metadata and options',()=>{
 const q={id:'x',tipo:'oficial',es_nueva:true,pregunta:'X',opciones:{a:'A',b:' a! '},respuesta_correcta:'z'};
 const {errors,warnings}=validateQuestion(q,'english');assert.ok(errors.includes('official-and-new'));assert.ok(errors.includes('option-count'));assert.ok(errors.includes('invalid-answer'));assert.ok(warnings.includes('duplicate-options'));
});
