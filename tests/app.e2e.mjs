import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {getBrowser} from './browser.mjs';
import {loadBanks} from '../scripts/banks.mjs';
import fs from 'node:fs';
let browser,server;
const URL='http://127.0.0.1:4184/guardia-civil-ingles/';
const {groups,english}=loadBanks();
before(async()=>{
 server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4184'},stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
 browser=await getBrowser();
});
after(async()=>{await browser?.close();server?.kill();});
async function setup(t,options={}){
 const context=await browser.newContext({viewport:options.viewport||{width:390,height:844},serviceWorkers:options.worker?'allow':'block'});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 await page.addInitScript(()=>{
  window.__remote={profiles:[],attempts:[],failure_bank:[]};window.__cloudCalls=[];window.__cloudUser=null;
  let callback;
  class Query{
   constructor(table){this.table=table;this.filters=[];this.op='select';}
   select(){return this;}eq(k,v){this.filters.push(row=>row[k]===v);return this;}order(){return this;}limit(){return this;}maybeSingle(){this.single=true;return this;}
   upsert(data){this.op='upsert';this.payload=data;return this;}insert(data){this.op='insert';this.payload=data;return this;}update(data){this.op='update';this.payload=data;return this;}delete(){this.op='delete';return this;}
   then(resolve,reject){return Promise.resolve().then(()=>{
    window.__cloudCalls.push({table:this.table,op:this.op,filters:this.filters.length});
    if(window.__networkError)return {data:null,error:{message:'Mock network error'}};
    const table=window.__remote[this.table];const matches=row=>this.filters.every(f=>f(row));let data;
    if(this.op==='select'){data=table.filter(matches);if(this.single)data=data[0]||null;}
    if(this.op==='insert'){table.push(structuredClone(this.payload));data=this.payload;}
    if(this.op==='upsert'){for(const row of Array.isArray(this.payload)?this.payload:[this.payload]){const existing=table.find(x=>this.table==='profiles'?x.id===row.id:x.user_id===row.user_id&&x.question_id===row.question_id);if(existing)Object.assign(existing,structuredClone(row));else table.push(structuredClone(row));}}
    if(this.op==='update')table.filter(matches).forEach(row=>Object.assign(row,structuredClone(this.payload)));
    if(this.op==='delete')window.__remote[this.table]=table.filter(row=>!matches(row));
    return {data,error:null};
   }).then(resolve,reject);}
  }
  const client={from:table=>new Query(table),auth:{getSession:async()=>({data:{session:window.__cloudUser?{user:window.__cloudUser}:null},error:null}),onAuthStateChange:cb=>{callback=cb;return {data:{subscription:{unsubscribe(){}}}};},signInWithPassword:async({email})=>{window.__cloudUser={id:email,email};callback?.('SIGNED_IN',{user:window.__cloudUser});return {data:{user:window.__cloudUser},error:null};},signUp:async()=>({data:{session:null},error:null}),signOut:async()=>{window.__cloudUser=null;callback?.('SIGNED_OUT',null);return {error:null};}}};
  window.supabase={createClient:()=>client};
 });
 if(options.seed)await page.addInitScript(options.seed);
 page.on('dialog',dialog=>dialog.accept());
 await page.goto(URL);await page.getByRole('heading',{name:'Elige el módulo'}).waitFor();
 t.after(async()=>{assert.deepEqual(errors,[]);await context.close();});
 return {page,context};
}
async function englishHome(page){await page.getByRole('button',{name:'Entrar en Inglés',exact:true}).click();await page.getByRole('button',{name:'Empezar simulacro real'}).waitFor();}
async function active(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('gcActiveExamV1')));}
test('mobile load is lazy; official 20 / 15 min, score, blank, numbers and review',async t=>{
 const {page}=await setup(t);assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/data/')).length),0);
 await englishHome(page);assert.ok((await page.locator('body').innerText()).includes('Formato oficial: 20 preguntas · 15 min'));
 await page.getByRole('button',{name:'Empezar simulacro real'}).click();await page.locator('.qcard').waitFor();
 const saved=await active(page);assert.equal(saved.questionIds.length,20);assert.equal(saved.deadline-saved.startedAt,900000);
 const q=groups.englishOfficial.find(q=>q.id===saved.questionIds[0]);await page.locator('input[value="'+q.respuesta_correcta+'"]').check();
 await page.getByRole('button',{name:'Pregunta 3, en blanco',exact:true}).click();assert.ok((await page.locator('.qmeta').innerText()).includes('3 de 20'));
 await page.getByRole('button',{name:'Finalizar',exact:true}).click();await page.locator('.result').waitFor();
 const result=await page.evaluate(()=>window.__lastResult);assert.equal(result.correct,1);assert.equal(result.blank,19);assert.equal(result.score,1);
 assert.equal(await active(page),null);assert.ok((await page.evaluate(()=>JSON.parse(localStorage.getItem('gcEnglishQuestionCycles')))).official.length===20);
 await page.getByRole('button',{name:'🔎 Ver revisión',exact:true}).click();assert.equal(await page.locator('.review .item').count(),20);
 await page.screenshot({path:'reports/mobile-review.png',fullPage:true});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
});
test('abandon leaves cycles byte-for-byte unchanged, including mixed failure path',async t=>{
 const {page}=await setup(t,{seed:()=>localStorage.setItem('gcEnglishQuestionCycles','{"official":["oficial-1-1"],"other":["x"]}')});await englishHome(page);
 const before=await page.evaluate(()=>localStorage.getItem('gcEnglishQuestionCycles'));await page.evaluate(()=>start('mixed',100));await page.locator('.qcard').waitFor();assert.equal((await active(page)).questionIds.length,100);
 assert.equal(await page.evaluate(()=>localStorage.getItem('gcEnglishQuestionCycles')),before);
 await page.getByRole('button',{name:'Abandonar',exact:true}).click();await page.getByRole('button',{name:'Empezar simulacro real'}).waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('gcEnglishQuestionCycles')),before);assert.equal(await active(page),null);
 await page.evaluate(()=>{setDifficulty('missing');start('mixed',100);});assert.equal(await page.evaluate(()=>localStorage.getItem('gcEnglishQuestionCycles')),before);
});
test('reload restores answers, position and deadline; expiry submits once',async t=>{
 const {page}=await setup(t);await englishHome(page);await page.evaluate(()=>start('new',20));await page.locator('.qcard').waitFor();
 await page.locator('input[value="a"]').check();await page.getByRole('button',{name:'Pregunta 5, en blanco',exact:true}).click();const initial=await active(page);
 await page.reload();await page.locator('.qcard').waitFor();const restored=await active(page);assert.equal(restored.deadline,initial.deadline);assert.equal(restored.idx,4);assert.equal(restored.answers[0],'a');
 await page.addInitScript(()=>{const now=Date.now;Date.now=()=>now()+901000;});
 await page.reload();await page.locator('.result').waitFor();assert.equal(await page.evaluate(()=>window.__lastResult.elapsed),900);assert.equal(await active(page),null);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('gcEnglishHistory')).length),1);
});
test('all English intensive sizes and difficulties, historical excludes loose official',async t=>{
 const {page}=await setup(t);await englishHome(page);
 for(const size of [20,40,60,100])for(const mode of ['official','new','mixed'])for(const difficulty of mode==='official'?['Media']:['Fácil','Media','Difícil']){
  await page.evaluate(({mode,size,difficulty})=>{setDifficulty(difficulty);start(mode,size);},{mode,size,difficulty});await page.locator('.qcard').waitFor();const saved=await active(page);assert.equal(saved.questionIds.length,size);assert.equal(new Set(saved.questionIds).size,size);assert.equal(saved.deadline-saved.startedAt,size*45000);await page.getByRole('button',{name:'Abandonar',exact:true}).click();await page.getByRole('button',{name:'Empezar simulacro real'}).waitFor();
 }
 assert.equal(await page.locator('#examSel option').count(),18);assert.equal(await page.locator('#examSel option[value="19"]').count(),0);
 await page.locator('#examSel').selectOption('2');await page.getByRole('button',{name:'Empezar modelo histórico'}).click();await page.locator('.qcard').waitFor();assert.deepEqual((await active(page)).questionIds,english.examenes[1].preguntas.map(q=>q.id));
 await page.getByRole('button',{name:'Finalizar',exact:true}).click();await page.locator('.result').waitFor();const result=await page.evaluate(()=>window.__lastResult);assert.equal(result.neutral,2);
});
test('academic official, training, reload, rollback and history review',async t=>{
 const {page}=await setup(t);
 for(const module of ['ortografia','gramatica']){
  await page.evaluate(module=>moduleHome(module),module);await page.getByRole('button',{name:'Comenzar simulacro',exact:true}).waitFor();
  const before=await page.evaluate(()=>localStorage.getItem('gcEnglishQuestionCycles'));await page.getByRole('button',{name:'Comenzar simulacro',exact:true}).click();await page.locator('.academic-test').waitFor();const saved=await active(page);assert.equal(saved.deadline-saved.startedAt,module==='ortografia'?420000:720000);
  await page.getByRole('button',{name:'Abandonar',exact:true}).click();await page.getByRole('button',{name:'Practicar preguntas nuevas'}).click();await page.locator('.academic-test').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('gcEnglishQuestionCycles')),before);
  const testState=await active(page);await page.reload();await page.locator('.academic-test').waitFor();assert.equal((await active(page)).deadline,testState.deadline);
  await page.addInitScript(()=>{const now=Date.now;Date.now=()=>now()+800000;});await page.reload();await page.locator('.academic-result').waitFor();
  assert.equal(await page.evaluate(()=>window.__lastAcademicResult.total),20);await page.getByRole('button',{name:'🔎 Ver revisión',exact:true}).click();await page.locator('#academicReview h2').waitFor();assert.ok((await page.locator('#academicReview').innerText()).length>100);
  await page.evaluate(()=>home());await page.getByRole('heading',{name:'Elige el módulo'}).waitFor();
 }
});
test('failure bank unlocks at 20 distinct questions and mastery removes one',async t=>{
 const {page}=await setup(t);await englishHome(page);const bank=groups.englishTraining.filter(q=>!q.excludeRandom).slice(0,20);
 await page.evaluate(bank=>{localStorage.setItem('gcEnglishFailures',JSON.stringify(bank));renderFailureStatus();},bank);
 assert.equal(await page.locator('#failureBtn').isDisabled(),false);await page.locator('#failureBtn').click();await page.locator('.qcard').waitFor();const saved=await active(page);const q=bank.find(q=>q.id===saved.questionIds[0]);await page.locator('input[value="'+q.respuesta_correcta+'"]').check();await page.getByRole('button',{name:'Finalizar',exact:true}).click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('gcEnglishFailures')).length),19);
 await page.evaluate(()=>showGeneralStats());await page.getByRole('heading',{name:'Detalle de práctica'}).waitFor();assert.ok((await page.locator('body').innerText()).includes('precisión'));
});
test('mock login preserves/merges local data; selective failure sync and logout archive',async t=>{
 const {page}=await setup(t);await englishHome(page);await page.evaluate(()=>start('official',20));await page.locator('.qcard').waitFor();await page.getByRole('button',{name:'Finalizar',exact:true}).click();await page.evaluate(()=>home());
 await page.getByRole('button',{name:'👤 Entrar / Registrarme'}).click();await page.getByLabel('Email',{exact:true}).fill('test@example.test');await page.getByLabel('Contraseña',{exact:true}).fill('password-test');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByRole('button',{name:'Cerrar sesión'}).waitFor();
 await page.waitForFunction(()=>window.__remote.attempts.length===1);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('gcEnglishHistory')).length),1);
 const q=groups.englishTraining[0];await page.evaluate(q=>{localStorage.setItem('gcEnglishFailures',JSON.stringify([q]));},q);await page.evaluate(()=>syncFailuresCloud());await page.evaluate(()=>clearFailures());await page.waitForFunction(()=>window.__cloudCalls.some(c=>c.op==='delete'));
 assert.ok(await page.evaluate(()=>window.__cloudCalls.filter(c=>c.op==='delete').every(c=>c.filters===2)));
 await page.getByRole('button',{name:'Cerrar sesión'}).click();await page.getByRole('button',{name:'👤 Entrar / Registrarme'}).waitFor();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('gcAccountArchive:test@example.test')).gcEnglishHistory.length),1);
});
test('modal focus, Escape, keyboard shortcuts and XSS-safe bank rendering',async t=>{
 const {page}=await setup(t);await page.getByRole('button',{name:'👤 Entrar / Registrarme'}).click();assert.equal(await page.locator('#authEmail').evaluate(el=>el===document.activeElement),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#authModal').count(),0);
 await englishHome(page);await page.evaluate(()=>start('official',20));await page.locator('.qcard').waitFor();await page.locator('.qmeta').click();await page.keyboard.press('b');assert.equal((await active(page)).answers[0],'b');await page.keyboard.press('ArrowRight');assert.equal((await active(page)).idx,1);
 assert.equal(await page.locator('[aria-current="step"]').count(),1);assert.equal(await page.locator('[onclick],[onchange]').count(),0);
});
test('install assets and offline module test work under Pages subpath',async t=>{
 const {page,context}=await setup(t,{worker:true});await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.getByRole('button',{name:'Preparar todos los bancos sin conexión'}).click();await page.waitForFunction(()=>document.getElementById('appNotice')?.textContent.includes('disponibles sin conexión'));
 await context.setOffline(true);await page.reload();await page.getByRole('heading',{name:'Elige el módulo'}).waitFor();await englishHome(page);await page.getByRole('button',{name:'Empezar simulacro real'}).click();await page.locator('.qcard').waitFor();assert.equal((await active(page)).questionIds.length,20);
});

test('desktop network failure retains local attempt and reconnect uploads once',async t=>{
 const {page}=await setup(t,{viewport:{width:1440,height:900}});
 await page.getByRole('button',{name:'👤 Entrar / Registrarme'}).click();
 await page.getByLabel('Email',{exact:true}).fill('retry@example.test');await page.getByLabel('Contraseña',{exact:true}).fill('password-test');
 await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByRole('button',{name:'Cerrar sesión'}).waitFor();
 await englishHome(page);await page.evaluate(()=>{window.__networkError=true;start('new',20);});await page.locator('.qcard').waitFor();
 await page.getByRole('button',{name:'Finalizar',exact:true}).click();await page.locator('.result').waitFor();
 await page.waitForFunction(()=>document.body.innerText.includes('Mock network error'));
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('gcEnglishHistory')).length),1);
 assert.equal(await page.evaluate(()=>window.__remote.attempts.length),0);
 await page.evaluate(()=>{window.__networkError=false;window.dispatchEvent(new Event('online'));});
 await page.waitForFunction(()=>window.__remote.attempts.length===1);
 await page.evaluate(()=>window.dispatchEvent(new Event('online')));
 await page.waitForFunction(()=>document.body.innerText.includes('Sincronizado'));
 assert.equal(await page.evaluate(()=>window.__remote.attempts.length),1);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
});
