export function shuffle(pool, random = Math.random) {
  const a = pool.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// Pure selection: a caller owns the transaction, and persists only on completion.
// At a boundary, pending questions close the old cycle; only new-cycle draws
// are recorded in the new cycle. No ID can occur twice in this test.
export function selectCycle(pool, previous, count, id = q => q.id, random = Math.random) {
  const unique = [...new Map(pool.map(q => [id(q), q])).values()];
  if (!Number.isInteger(count) || count < 0 || count > unique.length) throw new Error('No hay preguntas suficientes.');
  const ids = new Set(unique.map(id));
  let used = new Set((previous || []).filter(x => ids.has(x)));
  const pending = shuffle(unique.filter(q => !used.has(id(q))), random);
  let selected = pending.slice(0, count),
    advanced = false;
  if (pending.length < count) {
    const inTest = new Set(selected.map(id));
    const fresh = shuffle(unique.filter(q => !inTest.has(id(q))), random).slice(0, count - selected.length);
    selected.push(...fresh);
    used = new Set(fresh.map(id));
    advanced = true;
  } else {
    selected.forEach(q => used.add(id(q)));
    if (used.size === unique.length) {
      used.clear();
      advanced = true;
    }
  }
  return {
    questions: shuffle(selected, random),
    used: [...used],
    advanced
  };
}
export function transaction(cycles) {
  return {
    snapshot: structuredClone(cycles),
    draft: structuredClone(cycles)
  };
}
