import fs from 'node:fs';
export const read=p=>JSON.parse(fs.readFileSync(p));
export function loadBanks(){
 const english=read('data/english/official.json'),orthography=read('data/orthography/official.json'),grammar=read('data/grammar/official.json');
 return {english,orthography,grammar,groups:{englishOfficial:english.examenes.flatMap(e=>e.preguntas),englishTraining:read('data/english/training.json'),orthographyOfficial:orthography.oficial.flatMap(e=>e.preguntas),grammarOfficial:grammar.oficial,orthographyTraining:read('data/orthography/training.json').nuevas,grammarTraining:read('data/grammar/training.json').nuevas}};
}
export const normalize=x=>String(x).normalize('NFKC').toLowerCase().replace(/[\p{P}\p{Z}\s]+/gu,'');
export function validateQuestion(q,module){
 const errors=[],warnings=[];
 if(!q.id)errors.push('missing-id');
 if(q.es_oficial&&q.es_nueva||q.tipo==='oficial'&&q.es_nueva)errors.push('official-and-new');
 if(module==='english'){
  if(!q.pregunta?.trim())errors.push('missing-question');
  if(Object.keys(q.opciones||{}).sort().join('')!=='abcd')errors.push('option-count');
  const entries=Object.values(q.opciones||{});if(entries.some(v=>typeof v!=='string'||!v.trim()))errors.push('empty-option');
  if(!q.respuesta_correcta||!q.opciones?.[q.respuesta_correcta])errors.push('invalid-answer');
  if(new Set(entries.map(normalize)).size!==entries.length){warnings.push('duplicate-options');if(!q.excludeRandom)errors.push('active-duplicate-options');}
  if(q.validAnswers&&(!q.validAnswers.length||q.validAnswers.some(k=>!q.opciones[k])||!q.validAnswers.includes(q.respuesta_correcta)))errors.push('incompatible-valid-answers');
  if(q.answerStatus==='ambiguous'&&(!q.excludeRandom||!q.validAnswers||q.validAnswers.length<2))errors.push('unsafe-ambiguity');
  if(q.tipo==='generada'){
   if(!(q.explicacion||q.explicacion_profesor)?.trim())errors.push('empty-explanation');
   if(!q.ejemplo?.trim())errors.push('empty-example');
   if(!q.regla?.trim())errors.push('empty-rule');
  }
  if(!/_+|\.{2,}|…/.test(q.pregunta||'')&&!/^choose|rewrite|turn into/i.test(q.pregunta||''))warnings.push('possible-missing-gap');
  if(/conditional/i.test(q.tema||'')&&!/_+/.test(q.pregunta||''))warnings.push('conditional-missing-gap');
 }else{
  if(!q.frase?.trim())errors.push('missing-phrase');
  if(module==='orthography'){
   if(q.elementos_destacados?.length!==4)errors.push('element-count');
   for(const e of q.elementos_destacados||[]){if(!e.texto?.trim()||!['B','M'].includes(e.respuesta))errors.push('invalid-element');}
   if(q.respuestas&&q.respuestas.some((a,i)=>a!==q.elementos_destacados?.[i]?.respuesta))warnings.push('incompatible-legacy-answer-array');
  }else if(!['B','M'].includes(q.respuesta))errors.push('invalid-answer');
  if(q.es_nueva&&!q.explicacion_profesor?.trim())errors.push('empty-explanation');
 }
 return {errors,warnings};
}
