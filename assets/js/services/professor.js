// Local, deterministic sidecar lookup. No rule is inferred from an unknown word.
import { questionTopic } from './topics.js';
export const SAFE_FALLBACK = 'No dispongo de una explicación suficientemente segura para esta entrada. Conservo el resultado del banco, pero no voy a inventar una regla. Esta pregunta queda señalada para revisión.';
export const BANNED_TEXT = /Revisión específica|Construcción gramatical específica|\[corrección específica|La opción completa esta estructura|No se dispone de una explicación verificada|La explicación se centra en|Repite mentalmente/i;
export const hasGap = text => /_+|\.(?:[ \t]*\.)+|…/.test(text || '');
export function safeSourceURL(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port &&
      ['dictionary.cambridge.org', 'learnenglish.britishcouncil.org', 'www.rae.es', 'rae.es', 'dle.rae.es'].includes(u.hostname);
  } catch { return false; }
}
export function reconstructEnglish(question, option) {
  if (typeof question !== 'string' || typeof option !== 'string') return null;
  const gap = /_+|\.(?:[ \t]*\.)+|…/g;
  const matches = [...question.matchAll(gap)];
  if (!matches.length) return /^\s*(choose|select|which|identify|pick|find|rewrite|turn)\b/i.test(question) && !hasGap(option) ? option.trim() : null;
  const parts = option.split(/\s*\/\s*/);
  if (parts.some(s => !s.trim() || hasGap(s))) return null;
  if (parts.length === matches.length) {
    let i = 0;
    const result = question.replace(gap, () => parts[i++].trim());
    return hasGap(result) ? null : result;
  }
  // Some imported Stanley rows contain an accidental trailing ".." in
  // addition to the real dotted blank. If one answer segment is supplied,
  // prefer the longest dotted run and normalize only the duplicated final
  // punctuation in the reconstructed teaching sentence; the bank stays intact.
  if (parts.length === 1 && matches.length > 1) {
    const ranked = matches.map((m,index)=>({m,index,dots:(m[0].match(/\./g)||[]).length})).sort((a,b)=>b.dots-a.dots || a.index-b.index);
    if (ranked[0].dots > ranked[1].dots) {
      const {m}=ranked[0], start=m.index, end=start+m[0].length;
      const result=(question.slice(0,start)+parts[0].trim()+question.slice(end)).replace(/\.{2,}\s*$/,'.');
      return hasGap(result) ? null : result;
    }
  }
  return null;
}
export function scoringKeys(module, q, position) {
  return module === 'english' ? [...(q.validAnswers || [q.respuesta_correcta])] :
    [module === 'ortografia' ? q.elementos_destacados?.find(e => e.posicion === position)?.respuesta : q.respuesta];
}
export function sourceSignature(module, q, position) {
  if (module === 'english') return JSON.stringify([q.pregunta, ['a','b','c','d'].map(k => q.opciones?.[k]), scoringKeys(module,q), !!q.neutralized]);
  return JSON.stringify([q.frase, module === 'ortografia' ? q.elementos_destacados?.map(e => [e.posicion,e.texto,e.respuesta]) : q.respuesta, position || null]);
}
export function recordId(module,q,position) { return module === 'ortografia' ? `${q.id}:${position}` : q.id; }
export function createProfessorIndex(data, rules) {
  const records = new Map(), ruleMap = new Map();
  for (const r of (Array.isArray(rules) ? rules : rules?.rules || [])) {
    if (ruleMap.has(r.id)) throw Error('Regla duplicada: ' + r.id);
    ruleMap.set(r.id, r);
  }
  for (const r of data?.records || []) {
    if (records.has(r.id)) throw Error('Explicación duplicada: ' + r.id);
    records.set(r.id, r);
  }
  return {records,rules:ruleMap};
}
const textFields = ['quick','whyCorrect','examTrap','memoryTip','exampleGood'];
export function validateProfessorRecord(record, rule, module, q, position, {requireSignature = true} = {}) {
  const errors = [];
  if (!record || !q) return ['missing-record-or-question'];
  if (!['verified','editorial','anomaly'].includes(record.status)) errors.push('invalid-status');
  if (!rule || !rule.title?.trim() || !rule.plain?.trim()) errors.push('missing-rule');
  if (!rule?.sourceRefs?.length || rule.sourceRefs.some(s => !s.name?.trim() || !safeSourceURL(s.url))) errors.push('invalid-source');
  const keys = scoringKeys(module,q,position);
  if (JSON.stringify(record.acceptedKeys) !== JSON.stringify(keys)) errors.push('answer-mismatch');
  if (requireSignature && record.sourceSignature !== sourceSignature(module,q,position)) errors.push('incompatible-snapshot');
  const original = module === 'english' ? q.pregunta : module === 'ortografia' ? q.elementos_destacados?.find(e => e.posicion === position)?.texto : q.frase;
  if (record.originalText !== original) errors.push('original-mismatch');
  for (const field of textFields) if (typeof record[field] !== 'string' || !record[field].trim()) errors.push('empty-' + field);
  if (record.status === 'anomaly' && !record.anomalyReason?.trim()) errors.push('missing-anomaly-reason');
  if (q.neutralized && record.status !== 'anomaly') errors.push('neutral-not-anomaly');
  if (module === 'english') for (const key of ['a','b','c','d']) if (!record.optionReasons?.[key]?.trim()) errors.push('missing-option-' + key);
  if (record.status !== 'anomaly') {
    if (!record.correctedText?.trim() || hasGap(record.correctedText)) errors.push('incomplete-correction');
    if (module !== 'english') {
      if (keys[0] === 'B' && record.correctedText !== original) errors.push('B-changed');
      if (keys[0] === 'M' && record.correctedText?.normalize('NFC').trim() === original?.normalize('NFC').trim()) errors.push('M-unchanged');
    }
  } else if (hasGap(record.correctedText)) errors.push('anomaly-correction-has-gap');
  if (record.exampleGood?.trim() === original?.trim() || hasGap(record.exampleGood)) errors.push('invalid-example');
  const texts = [record.quick,record.whyCorrect,rule?.plain,record.memoryTip].filter(Boolean);
  if (new Set(texts).size !== texts.length) errors.push('repeated-sections');
  const allStrings = value => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(allStrings) : [];
  // Signatures contain original bank text, not pedagogical prose.
  for (const text of allStrings({...record,sourceSignature:undefined,originalText:undefined,optionReasons:record.optionReasons,...{rule}})) {
    if (BANNED_TEXT.test(text)) errors.push('placeholder');
    if (/<\/?[a-z][^>]*>|on\w+\s*=|javascript:/i.test(text)) errors.push('unsafe-html');
  }
  return [...new Set(errors)];
}
export function professorView(index, module, q, answer, position) {
  const record = index?.records.get(recordId(module,q,position));
  const rule = index?.rules.get(record?.ruleId);
  if (validateProfessorRecord(record,rule,module,q,position).length) return {status:'unavailable',quick:SAFE_FALLBACK};
  const anomaly = record.status === 'anomaly';
  const acceptedKeys = anomaly ? (module === 'english' && q.validAnswers?.length > 1 ? q.validAnswers : []) : record.acceptedKeys;
  const label = key => module === 'english' ? key.toUpperCase() + ' — ' + q.opciones[key] : key === 'B' ? 'B · BIEN / CORRECTA' : 'M · MAL / INCORRECTA';
  const correct = !anomaly && record.acceptedKeys.includes(answer);
  let userDiagnosis;
  if (anomaly) userDiagnosis = record.anomalyReason;
  else if (module === 'english') userDiagnosis = answer ? record.optionReasons[answer] : 'Has dejado la pregunta en blanco. ' + record.quick;
  else userDiagnosis = !answer ? 'Has dejado la respuesta en blanco. ' + record.quick : correct ? 'Tu valoración coincide con la respuesta utilizada para corregir. ' + record.quick : 'Has marcado ' + label(answer) + '. ' + record.quick;
  return {
    ...record, module, position, neutralized:!!q.neutralized, correct,
    provenanceLabel: record.sourceVerified === true ? 'Explicación contrastada · clave oficial verificada' : record.status === 'anomaly' ? 'Anomalía documentada · clave conservada' : record.status === 'verified' ? 'Explicación respaldada · respuesta utilizada para corregir' : 'Dictamen editorial · plantilla de origen no cotejada',
    topicId: record.topicId || questionTopic(module,q),
    userAnswer: answer ? label(answer) : 'En blanco', userDiagnosis,
    acceptedAnswers: acceptedKeys.map(label),
    correctedText: anomaly ? '' : record.correctedText,
    ruleTitle:rule.title, rulePlain:rule.plain, sourceRefs:rule.sourceRefs
  };
}
// Character-level LCS: only changed letters/accents are marked; input is never HTML.
export function textDiff(before,after) {
  const a=Array.from(before || ''), b=Array.from(after || '');
  if(a.length*b.length>1000000)return [{type:'delete',text:a.join('')},{type:'insert',text:b.join('')}];
  const table=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)table[i][j]=a[i]===b[j]?1+table[i+1][j+1]:Math.max(table[i+1][j],table[i][j+1]);
  const result=[];let i=0,j=0;
  const add=(type,text)=>{const last=result.at(-1);if(last?.type===type)last.text+=text;else result.push({type,text});};
  while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){add('equal',a[i++]);j++;}else if(j<b.length&&(i===a.length||table[i][j+1]>table[i+1][j]))add('insert',b[j++]);else add('delete',a[i++]);}
  return result;
}
export function correctedOrthographyPhrase(q,index) {
  let cursor=0,result='';
  for(const element of q.elementos_destacados || []) {
    const r=index.records.get(recordId('ortografia',q,element.posicion));
    if(!r || validateProfessorRecord(r,index.rules.get(r.ruleId),'ortografia',q,element.posicion).length || r.status==='anomaly')return null;
    const pos=q.frase.indexOf(element.texto,cursor);
    if(pos<0)return null;
    result+=q.frase.slice(cursor,pos)+r.correctedText;cursor=pos+element.texto.length;
  }
  return result+q.frase.slice(cursor);
}
// Count failed responses in the latest local attempts, never neutral/anomalous items.
export function recurrentConceptFailures(attempts,index,module,limit=10) {
  const counts={};
  for(const attempt of attempts.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,limit)) {
    const attemptModule=attempt.mode?.startsWith('academic_ortografia_')?'ortografia':attempt.mode?.startsWith('academic_gramatica_')?'gramatica':'english';
    if(attemptModule!==module)continue;
    (attempt.questions || []).forEach((q,i)=>{
      const positions=module==='ortografia'?(q.elementos_destacados || []).map(e=>e.posicion):[undefined];
      for(const position of positions){
        const answer=module==='ortografia'?attempt.answers?.[i]?.[position-1]:attempt.answers?.[i];
        const view=professorView(index,module,q,answer,position);
        if(!q.neutralized && !['anomaly','unavailable'].includes(view.status) && !view.correct)counts[view.conceptId]=(counts[view.conceptId] || 0)+1;
      }
    });
  }
  return counts;
}
