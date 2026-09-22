import fs from 'node:fs';
import {loadBanks,read} from './banks.mjs';
const {groups}=loadBanks(),byId=new Map(groups.englishOfficial.map(q=>[q.id,q]));
const approved=['oficial-6-17','oficial-10-8','oficial-11-1','oficial-11-6','oficial-11-7','oficial-13-9','oficial-14-6','oficial-14-7','oficial-18-11','oficial-19-18','oficial-19-29'];
const multiple=['oficial-10-9','oficial-10-11'],unresolved=['oficial-13-15'];
const write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const summary={reviewed:14,approvedSingleAnswer:11,multipleValidAnswers:2,noUnequivocalAnswer:1,approved:approved.map(id=>({id,answer:byId.get(id).respuesta_correcta,source:'Deducción lingüística aprobada por el usuario; no plantilla oficial verificada'})),multiple:multiple.map(id=>({id,validAnswers:byId.get(id).validAnswers,neutralized:true})),unresolved:unresolved.map(id=>({id,originalAnswer:byId.get(id).originalAnswer,rejectedAnswer:'c',neutralized:true}))};
write('reports/official-human-review.json',summary);
const inventory=read('reports/english-audit-inventory.json');
for(const row of inventory){
 if(approved.includes(row.id))row.humanDecision='approved-single-answer';
 if(![...multiple,...unresolved].includes(row.id))continue;
 const q=byId.get(row.id);
 Object.assign(row,{status:q.answerStatus,current:q.respuesta_correcta,excluded:true,neutralized:true,note:q.reviewNote,confidence:q.reviewConfidence,humanDecision:multiple.includes(q.id)?'multiple-valid-answers':'no-unequivocal-answer',sourceVerified:false});
 delete row.validAnswers;if(q.validAnswers)row.validAnswers=q.validAnswers;
 if(q.rejectedAnswer)row.rejectedAnswer=q.rejectedAnswer;
}
write('reports/english-audit-inventory.json',inventory);
const changes=inventory.filter(q=>q.current!==q.previous);
write('reports/answer-changes.json',changes);
write('reports/ambiguous-questions.json',inventory.filter(q=>q.status.includes('ambiguous')||q.candidateAnswers?.length>1||unresolved.includes(q.id)));
const section=`## Dictamen humano de las 14 oficiales\n\n**11 cambios de clave validados; 2 preguntas con múltiples respuestas gramaticalmente válidas; 1 sin opción inequívocamente correcta.** Ninguna se acredita mediante plantilla oficial: son dictámenes lingüísticos aprobados por el usuario.\n\n| ID | Dictamen | Tratamiento |\n|---|---|---|\n${approved.map(id=>`| ${id} | Clave ${byId.get(id).respuesta_correcta} validada | Se conserva |`).join('\n')}\n| oficial-10-9 | b y d válidas | Excluida de aleatorios; anulada en histórico |\n| oficial-10-11 | a y b válidas | Excluida de aleatorios; anulada en histórico |\n| oficial-13-15 | No hay opción inequívoca; c rechazada | b solo como clave histórica; anulada |\n\nLas tres anomalías permanecen en sus modelos originales. Cualquier opción o blanco tiene efecto cero: no suma, no resta ni entra en el denominador. La revisión muestra una advertencia y nunca las etiqueta como fallo del usuario. Los enunciados, opciones y procedencia permanecen intactos. El resto de preguntas oficiales y todo Stanley no se modifican en este paso.\n\nLa cuenta de cambios de campo respecto a bed694d pasa de 212 a 211: 198 Stanley sin cambios en este paso y 13 oficiales (11 validadas y 2 valores representativos de preguntas anuladas). La corrección c de oficial-13-15 se retira, restaurando b únicamente como registro histórico. Esto no convierte b en respuesta válida.\n`;
fs.writeFileSync('reports/official-human-review.md','# Revisión humana de respuestas oficiales\n\n'+section);
const p='reports/english-bank-audit.md';let markdown=fs.readFileSync(p,'utf8');
markdown=markdown.replace(/\n## Dictamen humano de las 14 oficiales[\s\S]*$/,'');
markdown=markdown.replace(/## Claves realmente cambiadas \(\d+\)/,`## Claves realmente cambiadas (${changes.length})`);
markdown=markdown.replace(/^\| oficial-13-15 \|.*\r?\n/gm,'');
for(const id of multiple){const row=inventory.find(q=>q.id===id);markdown=markdown.replace(new RegExp('^\\| '+id+' \\|.*$','m'),`| ${id} | ${row.previous} | ${row.current} (representativa; anulada) | ${row.note} | ${row.confidence} |`);}
fs.writeFileSync(p,markdown+'\n'+section);
