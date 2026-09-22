import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {loadBanks} from '../scripts/banks.mjs';
import {scoreEnglish} from '../assets/js/services/scoring.js';
import {explainOfficial} from '../assets/js/modules/english/explanations.js';
const {english,groups}=loadBanks();
const previous=JSON.parse(execFileSync('git',['show','7bfd51d:data/english/official.json'],{encoding:'utf8',maxBuffer:2e6}));
const anomalies={'oficial-10-9':['b','d'],'oficial-10-11':['a','b'],'oficial-13-15':null};
test('human decision preserves all official wording, provenance and other questions',()=>{
 const old=new Map(previous.examenes.flatMap(e=>e.preguntas).map(q=>[q.id,q]));
 for(const q of groups.englishOfficial){
  const before=old.get(q.id);
  if(!Object.hasOwn(anomalies,q.id)){assert.deepEqual(q,before);continue;}
  for(const field of ['pregunta','opciones','fuente','examenId','numero','originalAnswer'])assert.deepEqual(q[field],before[field]);
 }
 assert.deepEqual(groups.englishOfficial.filter(q=>!Object.hasOwn(anomalies,q.id)&&q.originalAnswer!==q.respuesta_correcta).map(q=>[q.id,q.respuesta_correcta]),[
 ['oficial-6-17','b'],['oficial-10-8','c'],['oficial-11-1','a'],['oficial-11-6','d'],['oficial-11-7','a'],['oficial-13-9','c'],['oficial-14-6','b'],['oficial-14-7','a'],['oficial-18-11','a'],['oficial-19-18','c'],['oficial-19-29','c']]);
});
for(const [id,alternatives] of Object.entries(anomalies))test(`${id}: never single-scored, retained in history, every answer and blank harmless`,()=>{
 const q=groups.englishOfficial.find(q=>q.id===id);
 assert.equal(q.excludeRandom,true);assert.equal(q.neutralized,true);assert.equal(q.sourceVerified,false);
 assert.ok(['ambiguous','unresolved'].includes(q.answerStatus));
 assert.equal(english.examenes.find(e=>e.id===q.examenId).preguntas.filter(x=>x.id===id).length,1);
 if(alternatives)assert.deepEqual(q.validAnswers,alternatives);
 else{assert.equal(q.respuesta_correcta,'b');assert.equal(q.originalAnswer,'b');assert.equal(q.reviewedAnswer,undefined);assert.equal(q.rejectedAnswer,'c');assert.equal(q.validAnswers,undefined);}
 const normal={respuesta_correcta:'a'},expected=scoreEnglish([normal],{0:'a'});
 for(const answer of ['a','b','c','d',undefined]){
  const actual=scoreEnglish([normal,q],{0:'a',1:answer});
  for(const field of ['correct','wrong','blank','penalty','score','total','apto'])assert.equal(actual[field],expected[field]);
  assert.equal(actual.neutral,1);
 }
 const html=explainOfficial(q,'c');assert.match(html,/anulada/i);assert.doesNotMatch(html,/✅ Respuesta correcta/);
});
