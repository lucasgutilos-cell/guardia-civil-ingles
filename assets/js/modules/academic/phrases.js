import { esc } from '../../core/html.js';
export function academicNormalizeText(text) {
  return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-ES');
}
export function academicFindElementRange(source, target, fromOriginal) {
  const s = String(source || ''),
    t = String(target || '');
  if (!t) return null;
  const exact = s.toLocaleLowerCase('es-ES').indexOf(t.toLocaleLowerCase('es-ES'), fromOriginal || 0);
  if (exact >= 0) return [exact, exact + t.length];
  const normSource = academicNormalizeText(s),
    normTarget = academicNormalizeText(t);
  const startNorm = academicNormalizeText(s.slice(0, fromOriginal || 0)).length;
  let at = normSource.indexOf(normTarget, startNorm);
  while (at >= 0) {
    const before = at > 0 ? normSource[at - 1] : '';
    const after = at + normTarget.length < normSource.length ? normSource[at + normTarget.length] : '';
    const letter = /[\p{L}\p{N}]/u;
    if ((!letter.test(normTarget[0]) || !letter.test(before)) && (!letter.test(normTarget[normTarget.length - 1]) || !letter.test(after))) {
      const map = [];
      let ni = 0;
      for (let oi = 0; oi < s.length; oi++) {
        const n = academicNormalizeText(s[oi]);
        for (let k = 0; k < n.length; k++) map[ni++] = oi;
      }
      const os = map[at];
      const oe = map[at + normTarget.length - 1];
      if (os !== undefined && oe !== undefined) return [os, oe + 1];
    }
    at = normSource.indexOf(normTarget, at + 1);
  }
  return null;
}
export function renderAcademicPhrase(q, review = false, userAnswers = []) {
  const source = q.frase || '';
  const els = (q.elementos_destacados || []).slice().sort((a, b) => (a.posicion || 0) - (b.posicion || 0));
  let out = '',
    cursor = 0;
  els.forEach((e, j) => {
    const range = academicFindElementRange(source, String(e.texto || ''), cursor);
    if (!range) return;
    const [pos, end] = range;
    out += esc(source.slice(cursor, pos));
    let cls = 'academic-highlight';
    if (review) {
      // In review, highlight ONLY the element the student actually got wrong.
      const userAnswer = userAnswers[j];
      cls = userAnswer !== e.respuesta ? 'review-word-bad' : '';
    }
    out += `<span class="${cls}">${esc(source.slice(pos, end))}</span>`;
    cursor = end;
  });
  out += esc(source.slice(cursor));
  return out;
}
