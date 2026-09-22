import { esc } from '../../core/html.js';
export function typeBadge(q) {
  return q.tipo === 'oficial' ? '<span class="badge official-badge">🏛️ OFICIAL</span>' : q.tipo === 'generada' ? '<span class="badge new-badge">🤖 NUEVA</span>' : '';
}
export function explainGenerated(q, a) {
  if (q.neutralized) return `<div class="ai-box"><div class="ai-title">Pregunta excluida de puntuación</div><p>${esc(q.reviewNote || 'Pendiente de cotejo editorial.')}</p><p>La clave importada se conserva como dato histórico; no se presenta como respuesta verificada.</p></div>`;
  const chosen = a ? q.opciones[a] : 'en blanco';
  const correct = q.opciones[q.respuesta_correcta];
  const example = q.ejemplo || '';
  return `<div class="ai-box">
<div class="ai-title">Profesor · explicaciones · Te lo explico</div>
<div class="ai-section"><div class="ai-label">Tu respuesta</div><div>${a ? esc(a.toUpperCase() + ') ' + chosen) : 'En blanco'}</div></div>
<div class="ai-section correct-box"><div class="ai-label">✅ Respuesta correcta</div><div><b>${esc(q.respuesta_correcta.toUpperCase() + ') ' + correct)}</b></div></div>
<div class="ai-section rule-box"><div class="ai-label">📚 Regla que tienes que recordar</div><div><b>${esc(q.regla || '')}</b></div><p>${esc(q.explicacion || '')}</p></div>
${example ? `<div class="ai-example"><div class="ai-label">Ejemplo práctico</div><div class="example-en">${esc(example)}</div></div>` : ''}
</div>`;
}
export function officialRule(q) {
  return {
    name: q.reviewedAnswer ? 'Respuesta revisada' : 'Clave importada · procedencia no verificada',
    rule: q.reviewNote || 'El repositorio no aporta una explicación verificada para esta pregunta. La clave importada no equivale a una plantilla oficial comprobada.',
    example: q.reviewedExample || ''
  };
}
export function officialAnomaly(q) {
  const vals = Object.values(q.opciones || {});
  const issues = [];
  if (vals.length !== 4) issues.push('La pregunta no tiene exactamente cuatro opciones.');
  if (new Set(vals.map(v => String(v).trim().toLowerCase())).size !== vals.length) issues.push('Hay dos opciones idénticas o prácticamente duplicadas.');
  if (!q.respuesta_correcta || !q.opciones?.[q.respuesta_correcta]) issues.push('Falta una respuesta oficial válida.');
  if (q.anotacion) issues.push(q.anotacion);
  return issues;
}
export function explainOfficial(q, a) {
  if (q.neutralized) return `<div class="ai-box"><div class="ai-title">Pregunta anulada en esta revisión</div><p>${esc(q.reviewNote || 'No existe una clave inequívoca contrastada.')}</p></div>`;
  const chosen = a ? q.opciones[a] : 'en blanco',
    correct = q.opciones[q.respuesta_correcta],
    info = officialRule(q),
    issues = officialAnomaly(q);
  return `<div class="ai-box"><div class="ai-title">Profesor · explicaciones · Te lo explico</div>
 <div class="ai-section"><div class="ai-label">Tu respuesta</div><div>${a ? esc(a.toUpperCase() + ') ' + chosen) : 'En blanco'}</div></div>
 <div class="ai-section correct-box"><div class="ai-label">✅ Respuesta correcta</div><div><b>${esc(q.respuesta_correcta.toUpperCase() + ') ' + correct)}</b></div></div>
 <div class="ai-section rule-box"><div class="ai-label">📚 Regla que tienes que recordar</div><div><b>${esc(info.name)}</b></div><p>${esc(info.rule)}</p></div>
 ${info.example ? `<div class="ai-example"><div class="ai-label">Ejemplo práctico</div><div class="example-en">${esc(info.example)}</div></div>` : ''}
 ${issues.length ? `<div class="ai-anomaly"><b>⚠️ Posible anomalía detectada:</b> ${issues.map(esc).join(' ')}</div>` : ''}</div>`;
}
