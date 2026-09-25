// Development-only materialization. No production-bank writes or network calls.
import fs from 'node:fs';
import {loadBanks} from './banks.mjs';
import {professorBanks} from './validate-professor.mjs';
import {recordId,sourceSignature} from '../assets/js/services/professor.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const rules=['english','spanish'].flatMap(language=>{const file=read(`data/professor/${language}-rules.json`);return Array.isArray(file)?file:file.rules;});
if(new Set(rules.map(r=>r.id)).size!==rules.length)throw Error('Duplicate rule ID');
fs.writeFileSync('data/professor/rules.json',JSON.stringify({version:1,rules},null,2)+'\n');
for(const [module,questions] of Object.entries(professorBanks(loadBanks().groups))){
  const file=`data/professor/${module==='english'?'english':module==='ortografia'?'orthography':'grammar'}.json`;
  const data=read(file),records=new Map(data.records.map(r=>[r.id,r]));
  for(const q of questions)for(const position of module==='ortografia'?q.elementos_destacados.map(e=>e.posicion):[undefined]){
    const r=records.get(recordId(module,q,position));if(!r)throw Error('Missing '+q.id);
    r.sourceSignature=sourceSignature(module,q,position);
  }
  fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
}
console.log('Professor sidecars assembled; banks untouched.');
