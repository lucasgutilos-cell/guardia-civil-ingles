import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const html=execFileSync('git',['show','bed694d:index.html'],{maxBuffer:8e6,encoding:'utf8'});
function legacy(){
 const mem=new Map();
 const ctx=vm.createContext({window:{supabase:{createClient:()=>({})}},document:{getElementById:()=>({})},localStorage:{getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)},console:{warn(){}},btoa:s=>Buffer.from(s).toString('base64')});
 const js=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].at(-1)[1].split('(async function initAuth()')[0];
 vm.runInContext(js,ctx);return {run:s=>vm.runInContext(s,ctx),mem};
}
test('baseline banks and historical models are characterized before edits',()=>{
 const c=legacy(); assert.equal(c.run('OFICIALES.length'),401);assert.equal(c.run('GENERADAS.length'),1744);
 assert.equal(c.run('DATA.examenes.filter(e=>e.historico!==false).length'),18);
});
test('legacy storage loads full-question history and module-separated failures',()=>{
 const c=legacy();c.mem.set('gcEnglishHistory','[{"questions":[{"id":"old"}],"answers":{"0":"a"}}]');
 assert.equal(c.run('history()[0].questions[0].id'),'old');assert.equal(c.run('academicFailureKey("ortografia")'),'gcAcademicFailures_ortografia');
});
test('legacy cycle reproduces no English snapshot and insufficient mixed consumption',()=>{
 const c=legacy();assert.equal(c.run('state.cycleSnapshot'),null);
 c.run('stateTarget=20;state.difficulty="missing";pickPool("mixed")');
 assert.equal(c.run('questionCycles().mixed_official.length'),10);
});
test('legacy academic boundary can duplicate questions',()=>{
 const c=legacy();c.run('saveQuestionCycles({t:["b","c"]});shuffle=a=>a');
 const ids=c.run('academicTake([{id:"a"},{id:"b"},{id:"c"}],"t",3).map(q=>q.id)');
 assert.equal(new Set(ids).size,2);
});
