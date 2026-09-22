import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {normalize} from './banks.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const html=execFileSync('git',['show','bed694d:index.html'],{encoding:'utf8',maxBuffer:8e6});
const original=name=>vm.runInNewContext(html.split(/\r?\n/).find(s=>s.startsWith('const '+name+'='))+'\n'+name);
const source=original('DATA'),seen=new Map();
const oldStanley=original('STANLEY_GLOSSARY').map(q=>{const n=(seen.get(q.id)||0)+1;seen.set(q.id,n);return {...q,id:q.id+(n>1?'-variant-'+n:'')};});
const originals=new Map([...source.examenes.flatMap(e=>e.preguntas),...source.generadas,...oldStanley].map(q=>[q.id,q]));
write('reports/original-english-keys.json',Object.fromEntries([...originals].map(([id,q])=>[id,q.respuesta_correcta])));
const decisions=read('reports/stanley-review-decisions.json'),training=read('data/english/training.json'),official=read('data/english/official.json');
const stanley=training.filter(q=>q.id.startsWith('stanley-'));
const previouslyRestored=new Set(['02-08','02-09','02-10','02-12','24-14','51-04','51-07','58-04','60-07']);
const covered=new Set(decisions.reviewedRanges.flatMap(([a,b])=>Array.from({length:b-a},(_,i)=>a+i)));
if(stanley.length!==1244||covered.size!==1244||stanley.some((q,i)=>!covered.has(i)))throw Error('Incomplete review coverage');
const rules=[
 [2,'Be concuerda con el sujeto; la negación se forma con not después del verbo.'],
 [4,'Have/has expresa posesión y concuerda con el sujeto; los adjetivos ingleses no varían en plural. Las fórmulas de saludo dependen del contexto.'],
 [6,'There is se usa con singular/incontable y there are con plural; much y many distinguen incontable y contable.'],
 [8,'Some/any dependen del sentido y polaridad. A/an se usan ante singular contable según el sonido inicial.'],
 [10,'Had es el pasado de have. Man, woman y child forman men, women y children; people tiene normalmente concordancia plural.'],
 [12,'El pasado de be concuerda en was/were. This/that son singulares y these/those plurales.'],
 [14,'There was expresa existencia singular pasada y there were existencia plural pasada.'],
 [16,'El presente simple expresa hábitos y lleva -s en tercera persona singular; las preguntas requieren el auxiliar adecuado.'],
 [18,'Do/does y don’t/doesn’t concuerdan con el sujeto; el verbo siguiente va en infinitivo sin to.'],
 [20,'Much y many distinguen incontable y contable; las palabras interrogativas y posesivas dependen de la información solicitada.'],
 [22,'El genitivo posesivo se forma con ’s o apóstrofo tras plural en -s; distinguir poseedor singular y plural.'],
 [24,'Be going to exige am/is/are + going to + infinitivo; la negación va después de be.'],
 [26,'Las preposiciones dependen de la relación espacial/temporal; sin contexto pueden existir varias lecturas.'],
 [28,'El pasado de be concuerda en was/were; otros verbos pueden requerir una forma irregular.'],
 [30,'Después de did/did not se utiliza el infinitivo sin to, no una segunda forma de pasado.'],
 [32,'Para expresar una hora deben conocerse minutos y hora completa. Tras una preposición se usa gerundio cuando sigue una acción verbal.'],
 [34,'Will y shall llevan infinitivo sin to; las preguntas invierten modal y sujeto.'],
 [36,'Do y make forman colocaciones: do homework/housework y make an effort/a noise.'],
 [38,'El imperativo usa infinitivo sin to; su negación usa don’t. El sujeto you puede ser enfático.'],
 [40,'Tell suele llevar destinatario; say no lo exige. So modifica adjetivos; so many/much distinguen contables e incontables.'],
 [42,'El presente simple expresa hábitos; el continuo puede describir acciones temporales o planes. El contexto debe fijar la lectura.'],
 [44,'El pasado continuo presenta una acción en curso; el simple un hecho completo. When no impone por sí solo una única combinación.'],
 [46,'Can/could llevan infinitivo sin to; be able requiere to. Could puede expresar capacidad pasada o petición cortés.'],
 [48,'El present perfect se forma con have/has y participio; since indica punto inicial y for duración.'],
 [50,'Who/whom remiten a personas, which a cosas, whose a posesión y what incorpora el antecedente.'],
 [52,'The one(s) selecciona referente singular/plural; la relativa necesita sujeto u objeto según el hueco. Los compuestos nominales tienen un orden léxico.'],
 [54,'El past perfect usa had + participio para un hecho anterior a otra referencia pasada.'],
 [56,'Will have + participio expresa futuro perfecto; will have been + -ing expresa duración hasta una referencia futura. By no exige siempre futuro perfecto.'],
 [58,'El comparativo exige -er o more según el adjetivo; el superlativo -est o most. Than y as delimitan la comparación.'],
 [60,'Must lleva infinitivo sin to; have to admite had to y will have to. Mustn’t prohíbe; don’t have to expresa falta de obligación.'],
 [62,'La hipótesis con pasado admite would/could y otros modales según el sentido; should también aparece en registros formales.'],
 [64,'La pasiva usa be + participio; by introduce agente y for puede introducir beneficiario. El tiempo depende del contexto.'],
 [66,'Good/bad forman better/best y worse/worst; igualdad usa as…as y desigualdad negativa también so…as.'],
 [68,'Let lleva pronombre objeto e infinitivo sin to; tell exige to ante el infinitivo. Let’s propone una acción conjunta.'],
 [70,'Los tags reutilizan auxiliar y pronombre del sujeto. La lectura confirmatoria invierte polaridad; existen tags de la misma polaridad con otro sentido.'],
 [72,'For expresa duración, since punto inicial y during un periodo. Still, already y yet dependen del sentido y la posición.']
];
for(const q of stanley){
 const id=q.id.slice(8),old=originals.get(q.id),unit=Number(id.slice(0,2));
 if(!old)throw Error(q.id);
 const candidate=decisions.corrections[id]||q.reviewedAnswer||q.respuesta_correcta;
 const options=decisions.ambiguous[id]?.split(',');
 const missing=!/_+|\.\s*\.|…/.test(q.pregunta);
 const duplicate=new Set(Object.values(q.opciones).map(normalize)).size<4;
 const malformed=decisions.invalid[id]||(missing?'No se conserva un hueco explícito; su posición no se reconstruye sin cotejo con la fuente.':null)||(duplicate?'Opciones duplicadas o indistinguibles tras normalización; revisar distractores.':null);
 const rule=rules.find(([max])=>unit<=max)?.[1]||'Revisar concordancia, contabilidad y contexto.';
 q.originalAnswer=old.respuesta_correcta;q.originalQuestion??=old.pregunta;
 q.auditReviewed=true;q.sourceVerified=false;q.answerSource='editorial-review';q.reviewCandidate=candidate;
 q.reviewConfidence=malformed?'low':options?'medium':'high';
 q.candidateAnswers=options||[candidate];
 delete q.validAnswers;
 if(malformed||options){
   if(!previouslyRestored.has(id))q.respuesta_correcta=old.respuesta_correcta;
   q.answerStatus=malformed?'reviewed-unusable':'reviewed-ambiguous';q.excludeRandom=true;q.neutralized=true;
   q.reviewNote=(malformed||'El contexto no garantiza una única respuesta; las alternativas indicadas son candidatas para cotejo, no una plantilla de corrección.')+' '+rule;
   // Candidates are evidence for human review, never automatically scored as correct.
 }else{
   q.answerStatus='editorial-reviewed';q.excludeRandom=false;delete q.neutralized;
   q.respuesta_correcta=candidate;q.reviewedAnswer=candidate;
   q.reviewNote='La opción «'+q.opciones[candidate]+'» completa el hueco conservado. '+rule;
 }
 q.regla=rule;q.explicacion=q.reviewNote;q.explicacion_profesor=q.reviewNote;
 const segments=q.opciones[candidate].split('/').map(x=>x.trim());let segment=0;
 q.ejemplo=q.excludeRandom?'Entrada conservada para cotejo: no utilizar como ejemplo resuelto.':q.pregunta.replace(/_+|(?:\.\s*){2,}|…/g,match=>segment<segments.length?segments[segment++]:match);
 q.auditFlags=[...(malformed?['malformed-import']:[]),...(options?['possible-ambiguity']:[]),...(q.excludeRandom?['excluded-random']:[])];
}
const all=[...official.examenes.flatMap(e=>e.preguntas),...training];
for(const q of all)q.originalAnswer=originals.get(q.id).respuesta_correcta;
write('data/english/official.json',official);write('data/english/training.json',training);
const inventory=all.map(q=>({id:q.id,sourceType:q.sourceType,status:q.answerStatus,previous:q.originalAnswer,current:q.respuesta_correcta,candidate:q.reviewCandidate,candidateAnswers:q.candidateAnswers,validAnswers:q.validAnswers,excluded:!!q.excludeRandom,neutralized:!!q.neutralized,note:q.reviewNote||'Lectura editorial; plantilla de origen no verificada.',confidence:q.reviewConfidence||'not-source-certified',question:q.pregunta,options:q.opciones}));
write('reports/english-audit-inventory.json',inventory);
const changes=inventory.filter(q=>q.previous!==q.current),ambiguous=inventory.filter(q=>q.status.includes('ambiguous')||q.candidateAnswers?.length>1);
write('reports/answer-changes.json',changes);write('reports/ambiguous-questions.json',ambiguous);
write('reports/stanley-audit-summary.json',{total:1244,reviewed:1244,pendingEditorialReading:0,sourceVerified:0,statuses:Object.fromEntries(Object.entries(Object.groupBy(stanley,q=>q.answerStatus)).map(([k,v])=>[k,v.length])),changedKeys:changes.filter(q=>q.id.startsWith('stanley')).length,sourceReviewRequired:stanley.filter(q=>q.excludeRandom).length});
const table=rows=>rows.map(q=>`| ${q.id} | ${q.previous} | ${q.current} | ${q.note.replaceAll('|','/')} | ${q.confidence} |`).join('\n');
fs.writeFileSync('reports/english-bank-audit.md',`# Auditoría editorial de inglés\n\nLectura final: 401 oficiales, 500 generadas (20 familias) y **1.244/1.244 Stanley**. Se completó la lectura de las 1.235 Stanley pendientes. El dictamen por entrada no equivale a reparación ni a certificación de la plantilla fuente: el PDF original no está disponible.\n\nStanley: ${stanley.filter(q=>!q.excludeRandom).length} utilizables; ${stanley.filter(q=>q.excludeRandom).length} conservadas y excluidas por problemas de importación o unicidad. No quedan entradas sin dictamen editorial. Las alternativas candidateAnswers son hipótesis para revisión humana y NO respuestas aceptadas en puntuación. Solo validAnswers de oficiales revisadas admiten varias claves. Las neutralizadas no puntúan.\n\nSe corrigió además el registro de claves base: los IDs Stanley repetidos se comparan por ocurrencia, usando los sufijos de id-migrations.json. El informe previo atribuía cuatro cambios inexistentes a colisiones de IDs.\n\n## Claves realmente cambiadas (${changes.length})\n\n| ID | Original | Actual | Motivo | Confianza |\n|---|---|---|---|---|\n${table(changes)}\n\n## Ambigüedades y cotejo\n\n${ambiguous.length} entradas con alternativas: detalle íntegro en ambiguous-questions.json. Todas las entradas, incluidos los enunciados dañados y candidatos de corrección que no se aplicaron, están en english-audit-inventory.json. Las claves de entradas inutilizables se conservan; una candidata no se publica como corrección segura.\n\nLos textos/opciones oficiales no se modificaron. Se conservan las 11 variantes de IDs Stanley y todos los bancos, modelos y reservas. En entrenamiento se conservan los originales de las plantillas reparadas y de los nueve huecos restaurados antes de esta continuación; esas restauraciones requieren revisión humana por no tener fuente contrastada.\n\n## Criterio y límites\n\nLectura individual de enunciado, cuatro opciones y clave. Una referencia temporal no impone automáticamente un tiempo verbal; un modal puede cambiar el significado sin ser agramatical. La selección conservadora excluye también lecturas poco naturales que exigen más contexto. candidateAnswers no pretende ser una lista exhaustiva de todas las interpretaciones posibles.\n\nReferencias de contraste: [Cambridge: will/shall](https://dictionary.cambridge.org/grammar/british-grammar/future-will-and-shall), [Cambridge: tags](https://dictionary.cambridge.org/grammar/british-grammar/tags), [British Council: past perfect](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/past-perfect). Estas referencias explican estructuras generales; no autentican ninguna clave Stanley ni oficial.\n\nAntes de publicar, un docente debe revisar las claves cambiadas y resolver exclusiones contra el PDF/plantilla. No se inventaron huecos adicionales para aumentar el banco utilizable.\n`);
console.log(read('reports/stanley-audit-summary.json'));
