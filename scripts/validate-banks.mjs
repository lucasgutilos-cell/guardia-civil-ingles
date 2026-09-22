import fs from 'node:fs';
import crypto from 'node:crypto';
import {loadBanks,read,validateQuestion,normalize} from './banks.mjs';
const {groups,english}=loadBanks(),baseline=read('reports/baseline.json');
const errors=[],warnings=[];
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
for(const [bank,questions] of Object.entries(groups)){
 const module=bank.startsWith('english')?'english':bank.startsWith('orthography')?'orthography':'grammar';
 const ids=new Set(),seen=new Map();
 for(const q of questions){
  if(ids.has(q.id))errors.push({bank,id:q.id,issue:'duplicate-id'});ids.add(q.id);
  const result=validateQuestion(q,module);result.errors.forEach(issue=>errors.push({bank,id:q.id,issue}));result.warnings.forEach(issue=>warnings.push({bank,id:q.id,issue}));
  const signature=normalize(q.pregunta||q.frase)+'|'+JSON.stringify(q.opciones?Object.values(q.opciones).map(normalize).sort():q.elementos_destacados?.map(e=>normalize(e.texto))||[]);
  if(seen.has(signature))warnings.push({bank,id:q.id,issue:'duplicate-question',duplicateOf:seen.get(signature)});else seen.set(signature,q.id);
  if(bank.endsWith('Official')&&baseline.groups[bank].textHashes[q.id]!==hash([q.pregunta||q.frase,q.opciones||q.elementos_destacados]))errors.push({bank,id:q.id,issue:'protected-text-changed'});
 }
 if(questions.length!==baseline.groups[bank].count)errors.push({bank,issue:'count-changed'});
 for(const id of baseline.groups[bank].ids)if(!ids.has(id))errors.push({bank,id,issue:'lost-id'});
}
for(const exam of english.examenes){
 if(exam.id===19&&exam.historico!==false)errors.push({issue:'loose-official-in-history'});
 for(const q of exam.preguntas)if(q.examenId!==exam.id)errors.push({id:q.id,issue:'invalid-exam-reference'});
 const old=baseline.exams.find(e=>e.id===exam.id);if(!old||old.count!==exam.preguntas.length||old.reserves!==(exam.reserva?.length||0))errors.push({id:exam.id,issue:'historical-model-changed'});
 for(const q of exam.reserva||[]){if(!q.respuesta_correcta)warnings.push({bank:'englishReserves',id:exam.id+':'+q.numero,issue:'reserve-without-answer-not-scored'});}
}
if(english.examenes.length!==baseline.exams.length)errors.push({issue:'lost-exam'});
const acknowledgements=fs.existsSync('reports/bank-known-warnings.json')?read('reports/bank-known-warnings.json'):[];
const key=w=>JSON.stringify(w);
const known=new Set(acknowledgements.map(key));
if(process.argv.includes('--record-baseline'))fs.writeFileSync('reports/bank-known-warnings.json',JSON.stringify(warnings,null,2)+'\n');
else for(const warning of warnings)if(!known.has(key(warning)))errors.push({...warning,issue:'unreviewed-warning:'+warning.issue});
fs.writeFileSync('reports/bank-validation.json',JSON.stringify({counts:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v.length])),errors,warnings},null,2)+'\n');
console.log(`${Object.values(groups).flat().length} questions; ${errors.length} errors; ${warnings.length} documented warnings.`);
if(errors.length){console.log(errors.slice(0,30));process.exitCode=1;}
