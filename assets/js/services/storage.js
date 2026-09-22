export const HISTORY_KEY = 'gcEnglishHistory';
export const ACTIVE_KEY = 'gcActiveExamV1';
const memory = new Map();
let onError = () => {};
export function onStorageError(callback) {
  onError = callback;
}
export function readJSON(key, fallback) {
  try {
    const raw = memory.has(key) ? memory.get(key) : localStorage.getItem(key);
    return raw ? JSON.parse(raw) : structuredClone(fallback);
  } catch (error) {
    onError('No se pueden leer los datos locales. Conservamos el original.', error);
    return structuredClone(fallback);
  }
}
export function writeJSON(key, value) {
  const raw = JSON.stringify(value);
  try {
    const previous = localStorage.getItem(key);
    if (previous) {
      let corrupt = false;
      try {
        const old = JSON.parse(previous);
        corrupt = Array.isArray(value) !== Array.isArray(old);
      } catch {
        corrupt = true;
      }
      if (corrupt) localStorage.setItem('gcCorruptBackup:' + key + ':' + Date.now(), previous);
    }
    localStorage.setItem(key, raw);
    memory.delete(key);
    return true;
  } catch (error) {
    memory.set(key, raw);
    onError('Almacenamiento lleno o bloqueado. Los cambios siguen en esta pestaña; exporta una copia antes de cerrarla.', error);
    return false;
  }
}
export function dumpStorage() {
  const keys = new Set([...Object.keys(localStorage), ...memory.keys()]);
  return Object.fromEntries([...keys].filter(k => k.startsWith('gc')).map(k => {
    const raw = memory.has(k) ? memory.get(k) : localStorage.getItem(k);
    try {
      return [k, JSON.parse(raw)];
    } catch {
      return [k, {
        rawCorruptValue: raw
      }];
    }
  }));
}
export function removeStored(key) {
  memory.delete(key);
  try {
    localStorage.removeItem(key);
  } catch (error) {
    onError('No se pudo limpiar el estado guardado.', error);
  }
}
export function attemptKey(x) {
  return x.attemptId || [x.date, x.mode, x.label].join('|');
}
export function mergeHistory(local, remote) {
  const entries = new Map();
  for (const x of [...remote, ...local]) entries.set(attemptKey(x), x);
  return [...entries.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(-50);
}
export function compactAttempt(entry) {
  if (entry.schemaVersion === 2) return entry;
  const academic = String(entry.mode).startsWith('academic_');
  if (academic) return entry; // Academic historical text/details must still travel to old clients.
  const snapshots = readJSON('gcQuestionSnapshotsV1', {});
  const questions = (entry.questions || []).map(q => {
    const payload = JSON.stringify(q);
    let hash = 14695981039346656037n;
    for (const character of payload) hash = BigInt.asUintN(64, (hash ^ BigInt(character.codePointAt(0))) * 1099511628211n);
    let snapshotId = q.id + ':' + hash.toString(16);
    // An unlikely hash collision must never overwrite an older review.
    while (snapshots[snapshotId] && JSON.stringify(snapshots[snapshotId]) !== payload) snapshotId += 'x';
    snapshots[snapshotId] = q;
    return {
      id: q.id,
      snapshotId,
      respuesta_correcta: q.respuesta_correcta,
      validAnswers: q.validAnswers,
      bankVersion: 1
    };
  });
  if (!writeJSON('gcQuestionSnapshotsV1', snapshots)) return entry;
  return {
    ...entry,
    schemaVersion: 2,
    questions
  };
}
export function hydrateAttempt(entry, lookup) {
  const snapshots = readJSON('gcQuestionSnapshotsV1', {});
  return {
    ...entry,
    questions: (entry.questions || []).map(q => q.pregunta || q.frase ? q : {
      ...(snapshots[q.snapshotId] || lookup(q.id)),
      ...q
    })
  };
}
