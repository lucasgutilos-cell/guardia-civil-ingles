import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {loadBanks} from './banks.mjs';
import {createProfessorIndex,validateProfessorRecord,recordId,safeSourceURL,BANNED_TEXT} from '../assets/js/services/professor.js';
export function professorBanks(groups) {
  return {
    english:[...groups.englishOfficial,...groups.englishTraining.filter(q=>q.id.startsWith('generada-') || q.answerStatus==='editorial-reviewed' && q.reviewConfidence==='high')],
    ortografia:[...groups.orthographyOfficial,...groups.orthographyTraining],
    gramatica:[...groups.grammarOfficial,...groups.grammarTraining]
  };
}
export function validateProfessor({groups=loadBanks().groups,data,rules}={}) {
  const errors=[],coverage={},anomalies=[];
  rules ||= JSON.parse(fs.readFileSync('data/professor/rules.json'));
  const ruleList=Array.isArray(rules)?rules:rules.rules;
  const known=new Set();
  for(const r of ruleList){
    if(known.has(r.id))errors.push({id:r.id,error:'duplicate-rule'});known.add(r.id);
    if(!r.id || !r.title?.trim() || !r.plain?.trim() || !r.sourceRefs?.length || r.sourceRefs.some(s=>!s.name?.trim() || !safeSourceURL(s.url)))errors.push({id:r.id,error:'invalid-rule'});
    if(BANNED_TEXT.test(JSON.stringify(r)) || /<\/?[a-z][^>]*>/i.test(JSON.stringify(r)))errors.push({id:r.id,error:'unsafe-rule-text'});
  }
  for(const [module,questions] of Object.entries(professorBanks(groups))){
    const file=module==='english'?'english':module==='ortografia'?'orthography':'grammar';
    const payload=data?.[module] || JSON.parse(fs.readFileSync(`data/professor/${file}.json`));
    let index;
    try{index=createProfessorIndex(payload,rules);}catch(error){errors.push({module,error:error.message});continue;}
    const expected=new Map(questions.flatMap(q=>module==='ortografia'?q.elementos_destacados.map(e=>[recordId(module,q,e.posicion),{q,position:e.posicion}]):[[q.id,{q}]]));
    coverage[module]={expected:expected.size,records:payload.records.length,byStatus:{},bySource:{},sourceVerified:0};
    for(const [id,{q,position}] of expected){
      const r=index.records.get(id),rule=index.rules.get(r?.ruleId);
      for(const error of validateProfessorRecord(r,rule,module,q,position))errors.push({module,id,error});
      if(!r)continue;
      const counts=coverage[module];
      counts.byStatus[r.status]=(counts.byStatus[r.status] || 0)+1;
      counts.bySource[r.source] ||= {total:0,byStatus:{}};
      counts.bySource[r.source].total++;
      counts.bySource[r.source].byStatus[r.status]=(counts.bySource[r.source].byStatus[r.status] || 0)+1;
      if(r.sourceVerified===true)counts.sourceVerified++;
      if(r.status==='anomaly')anomalies.push({module,id,source:r.source,reason:r.anomalyReason,neutralized:!!q.neutralized});
    }
    for(const id of index.records.keys())if(!expected.has(id))errors.push({module,id,error:'unknown-id'});
  }
  return {
    schemaVersion:1,structuralValidation:{passed:errors.length===0,errors},coverage,anomalies,
    linguisticReview:'Dictámenes y anomalías documentados en los informes pedagógicos. Pasar el esquema no demuestra que una clave sea lingüísticamente inequívoca.',
    officialTemplateVerification:'Solo sourceVerified:true constituye cotejo de plantilla. Las referencias gramaticales no verifican por sí mismas la clave histórica.',
    unavailablePolicy:'Únicamente snapshots incompatibles/antiguos o entradas excluidas sin ficha; ninguna entrada cubierta puede carecer de ficha completa.',
    runtime:'Determinista y local; sin IA remota ni peticiones a las fuentes durante ejecución o tests.'
  };
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const report=validateProfessor();
    fs.writeFileSync('reports/professor-validation.json',JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({coverage:report.coverage,errors:report.structuralValidation.errors.length},null,2));
    if(!report.structuralValidation.passed){console.error(JSON.stringify(report.structuralValidation.errors.slice(0,50),null,2));process.exitCode=1;}
  }catch(error){console.error(error.stack);process.exitCode=1;}
}
