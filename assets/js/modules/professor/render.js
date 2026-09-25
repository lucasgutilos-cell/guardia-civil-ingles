import { esc } from '../../core/html.js';
import { SAFE_FALLBACK, safeSourceURL, textDiff } from '../../services/professor.js';
import { topicMode } from '../../services/topics.js';
export function renderDifference(before,after) {
  return textDiff(before,after).map(p=>p.type==='equal'?esc(p.text):p.type==='delete'?`<del aria-label="Se elimina: ${esc(p.text)}">${esc(p.text)}</del>`:`<ins aria-label="Se añade: ${esc(p.text)}">${esc(p.text)}</ins>`).join('');
}
export function renderProfessor(view,{repeated=0}={}) {
  if(!view || view.status==='unavailable')return `<p class="professor-fallback">${esc(SAFE_FALLBACK)}</p>`;
  const anomaly=view.status==='anomaly';
  const name=anomaly?'Entender la anomalía':view.correct?'Por qué está bien':'Entender este fallo';
  const section=(title,text)=>text?`<section><h5>${esc(title)}</h5><p>${esc(text)}</p></section>`:'';
  const practice=topicMode(view.module,view.topicId);
  const action=view.module==='english'?`startEnglishTopic('${view.topicId}')`:`startAcademicTopic('${view.module}','${view.topicId}')`;
  const details=`${section('Tu respuesta',view.userAnswer)}${view.acceptedAnswers.length?section(anomaly?'Alternativas admitidas (sin solución única)':'Respuesta utilizada para corregir',view.acceptedAnswers.join(' / ')):''}
    ${view.correctedText?(view.correctionKind==='answer'?`<section><h5>Respuesta modelo</h5><p>${esc(view.correctedText)}</p></section>`:`<section><h5>Texto corregido · diferencias</h5><p class="professor-diff">${renderDifference(view.originalText,view.correctedText)}</p></section>`):''}
    ${section(anomaly?'Problema del ítem':view.correct?'Tu razonamiento':'Por qué tu respuesta falla',view.userDiagnosis)}
    ${section(view.ruleTitle,view.rulePlain)}${section(anomaly?'Lectura prudente':'Por qué funciona la solución',view.whyCorrect)}
    ${view.module==='english'?`<section><h5>Cómo descartar las demás opciones</h5><ul>${Object.entries(view.optionReasons).map(([k,v])=>`<li><b>${esc(k.toUpperCase())}:</b> ${esc(v)}</li>`).join('')}</ul></section>`:''}
    ${section('Trampa típica de examen',view.examTrap)}${section('Truco para recordarlo',view.memoryTip)}${section('Ejemplo nuevo',view.exampleGood)}${section('Contraste',view.exampleContrast)}
    <details class="professor-sources"><summary>Base normativa</summary><ul>${view.sourceRefs.filter(s=>safeSourceURL(s.url)).map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)}</a></li>`).join('')}</ul></details>
    ${practice?`<button class="secondary" data-click-action="${esc(action)}">Practicar este contenido</button>`:''}`;
  const summary=`<div class="professor-quick"><b>En 10 segundos</b><p>${esc(view.quick)}</p></div>`;
  return `<article class="professor ${anomaly?'professor-neutral':view.correct?'professor-correct':'professor-wrong'}" data-professor-status="${esc(view.status)}" data-concept-id="${esc(view.conceptId)}"><p class="small">Profesor IA · local · ${esc(view.provenanceLabel)}</p>${anomaly?'<p class="notice">⚠ Anomalía: no se afirma una respuesta única.</p>':''}${repeated>=2&&!anomaly?`<p class="notice">Patrón recurrente: ${Number(repeated)} fallos en tus últimos intentos.</p>`:''}${view.correct?`<details><summary>${name}</summary>${summary}${details}</details>`:`${summary}<details><summary>${name}</summary>${details}</details>`}</article>`;
}
