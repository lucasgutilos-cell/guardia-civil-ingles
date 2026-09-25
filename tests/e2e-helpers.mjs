import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {getBrowser} from './browser.mjs';

// Isolated fake Supabase. No authentication request or learner answer leaves
// the browser; assertions can inspect the same-shaped in-memory rows.
export function installMockCloud() {
  window.__remote = {profiles: [], attempts: [], failure_bank: []};
  window.__cloudCalls = [];
  window.__cloudUser = null;
  let callback;
  class Query {
    constructor(table) {this.table = table; this.filters = []; this.op = 'select';}
    select() {return this;}
    eq(key, value) {this.filters.push(row => row[key] === value); return this;}
    order() {return this;}
    limit() {return this;}
    maybeSingle() {this.single = true; return this;}
    upsert(data) {this.op = 'upsert'; this.payload = data; return this;}
    insert(data) {this.op = 'insert'; this.payload = data; return this;}
    update(data) {this.op = 'update'; this.payload = data; return this;}
    delete() {this.op = 'delete'; return this;}
    then(resolve, reject) {
      return Promise.resolve().then(() => {
        window.__cloudCalls.push({table: this.table, op: this.op, filters: this.filters.length});
        if (window.__networkError) return {data: null, error: {message: 'Mock network error'}};
        const rows = window.__remote[this.table], matches = row => this.filters.every(filter => filter(row));
        let data;
        if (this.op === 'select') {data = rows.filter(matches); if (this.single) data = data[0] || null;}
        if (this.op === 'insert') {rows.push(structuredClone(this.payload)); data = this.payload;}
        if (this.op === 'upsert') for (const row of Array.isArray(this.payload) ? this.payload : [this.payload]) {
          const previous = rows.find(other => this.table === 'profiles' ? other.id === row.id : other.user_id === row.user_id && other.question_id === row.question_id);
          if (previous) Object.assign(previous, structuredClone(row)); else rows.push(structuredClone(row));
        }
        if (this.op === 'update') rows.filter(matches).forEach(row => Object.assign(row, structuredClone(this.payload)));
        if (this.op === 'delete') window.__remote[this.table] = rows.filter(row => !matches(row));
        return {data, error: null};
      }).then(resolve, reject);
    }
  }
  const client = {
    from: table => new Query(table),
    auth: {
      getSession: async () => ({data: {session: window.__cloudUser ? {user: window.__cloudUser} : null}, error: null}),
      onAuthStateChange: fn => {callback = fn; return {data: {subscription: {unsubscribe() {}}}};},
      signInWithPassword: async ({email}) => {
        window.__cloudUser = {id: email, email};
        callback?.('SIGNED_IN', {user: window.__cloudUser});
        return {data: {user: window.__cloudUser}, error: null};
      },
      signUp: async () => ({data: {session: null}, error: null}),
      signOut: async () => {window.__cloudUser = null; callback?.('SIGNED_OUT', null); return {error: null};}
    }
  };
  window.supabase = {createClient: () => client};
}

export async function createE2EHarness(port) {
  const url = `http://127.0.0.1:${port}/guardia-civil-ingles/`;
  const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    env: {...process.env, PORT: String(port)}, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true
  });
  await new Promise((resolve, reject) => {
    server.stdout.once('data', resolve);
    server.once('error', reject);
    server.once('exit', code => reject(Error(`Local test server exited with ${code}`)));
  });
  const browser = await getBrowser();
  return {
    url,
    async close() {await browser.close(); server.kill();},
    async setup(t, options = {}) {
      const context = await browser.newContext({viewport: options.viewport || {width: 390, height: 844}, serviceWorkers: options.worker ? 'allow' : 'block'});
      const page = await context.newPage(), errors = [], externalRequests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
      page.on('request', request => {if (!request.url().startsWith(new URL(url).origin)) externalRequests.push(request.url());});
      await page.addInitScript(installMockCloud);
      if (options.seed) await page.addInitScript(options.seed);
      page.on('dialog', dialog => dialog.accept());
      t.after(async () => {
        try {assert.deepEqual(errors, [], 'No console or page errors'); assert.deepEqual(externalRequests, [], 'No request to real cloud/AI services');}
        finally {await context.close();}
      });
      await page.goto(url);
      await page.getByRole('heading', {name: 'Elige el módulo'}).waitFor();
      return {page, context};
    }
  };
}

export const activeExam = page => page.evaluate(() => JSON.parse(localStorage.getItem('gcActiveExamV1')));
export const readLocal = (page, key) => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
export async function enterModule(page, module) {
  await page.evaluate(() => home());
  const names = {english: 'Inglés', ortografia: 'Ortografía', gramatica: 'Gramática'};
  await page.getByRole('button', {name: `Entrar en ${names[module]}`, exact: true}).click();
  await page.getByRole('heading', {name: 'Entrenamiento por contenidos', exact: true}).waitFor();
}
export async function loginMock(page, email = 'topics@example.test') {
  await page.getByRole('button', {name: '👤 Entrar / Registrarme'}).click();
  await page.getByLabel('Email', {exact: true}).fill(email);
  await page.getByLabel('Contraseña', {exact: true}).fill('password-test');
  await page.getByRole('button', {name: 'Entrar', exact: true}).click();
  await page.getByRole('button', {name: 'Cerrar sesión'}).waitFor();
}
