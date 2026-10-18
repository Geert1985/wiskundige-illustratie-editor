import 'mathlive';
import { ComputeEngine } from '@cortex-js/compute-engine';
import { compactFormattedResult } from './display-format.mjs';
import { analyzeCortexExpression, configureDutchMathLive, createFormulaToken, setFormulaToken } from './cortex-analysis.mjs';
import { MockGeometrySources, addDimensions, multiplyDimensions } from './geometry-poc.mjs';

const { ExpressionEngine } = globalThis.FZI.MathIllustration;
const ce = new ComputeEngine();
configureDutchMathLive(customElements.get('math-field'), ce);
const field = document.querySelector('#formula');
const customKeyboard = document.querySelector('#custom-keyboard');
const keyboardToggle = document.querySelector('#keyboard-toggle');
const textEditor = document.querySelector('#text-editor');
const formulaDialog = document.querySelector('#formula-dialog');
const textFormulaField = document.querySelector('#text-formula-field');
let keyboardVariant = 'standard';
let keyboardOpen = false;
let shifted = false;
let activeOperation = 'evaluate';
let editingToken = null;
let textInsertionRange = null;
const nodes = Object.fromEntries(['result-a', 'result-b', 'status-a', 'status-b', 'latex-value', 'json-a', 'ascii-value', 'wie-value', 'visual-status', 'parse-status', 'compute-status', 'compute-detail', 'cortex-exact-result', 'cortex-numeric-result'].map(id => [id, document.getElementById(id)]));
const mathfieldCommands = Object.freeze({
  left: 'moveToPreviousChar', right: 'moveToNextChar', up: 'moveUp', down: 'moveDown', backspace: 'deleteBackward',
});

function errorText(error) {
  return error?.code || error?.message || String(error);
}

function evaluateB(asciiMath) {
  // This POC adapter deliberately accepts only the existing T5a expression grammar.
  const normalized = asciiMath.replace(/\bd\s+e\s+g\b/gi, 'deg').replace(/π/g, 'pi');
  const ast = ExpressionEngine.parse(normalized);
  const result = ExpressionEngine.evaluate(ast, { angleMode: 'deg' });
  const formatted = ExpressionEngine.format(result.quantity, { precision: 8 });
  return { formatted: compactFormattedResult(formatted), canonical: ExpressionEngine.print(ast).text };
}

function render() {
  const latex = field.getValue('latex-expanded').trim();
  const asciiMath = field.getValue('ascii-math').trim();
  nodes['latex-value'].textContent = latex || '—';
  nodes['ascii-value'].textContent = asciiMath || '—';
  nodes['result-a'].textContent = '…';
  nodes['result-b'].textContent = '…';
  nodes['status-a'].textContent = '';
  nodes['status-b'].textContent = '';
  const cortex = analyzeCortexExpression(ce, latex, { operation: activeOperation });
  nodes['visual-status'].textContent = cortex.visual;
  nodes['parse-status'].textContent = cortex.parsed;
  nodes['compute-status'].textContent = cortex.category;
  nodes['compute-detail'].textContent = cortex.detail || '';
  nodes['cortex-exact-result'].setValue(cortex.exactLatex || '');
  nodes['cortex-numeric-result'].textContent = cortex.numericText
    ? `${cortex.category === 'Exact numeriek resultaat' && !cortex.numericText.includes(',') ? '' : '≈'}${cortex.numericText}`
    : '—';
  nodes['result-a'].textContent = cortex.exactText || (cortex.category === 'Parsefout' ? 'Parsefout' : '—');
  nodes['status-a'].textContent = [cortex.parsed, cortex.category, cortex.detail].filter(Boolean).join(' · ');
  nodes['json-a'].textContent = cortex.mathJson || '—';
  try {
    const result = evaluateB(asciiMath);
    nodes['result-b'].textContent = result.formatted;
    nodes['wie-value'].textContent = result.canonical;
  } catch (error) {
    nodes['result-b'].textContent = 'Niet ondersteund';
    nodes['status-b'].textContent = errorText(error);
    nodes['wie-value'].textContent = '—';
  }
}

function captureTextSelection() {
  const selection = window.getSelection();
  if (selection?.rangeCount && textEditor.contains(selection.anchorNode)) textInsertionRange = selection.getRangeAt(0).cloneRange();
}

function placeFormulaAtTextCursor(latex) {
  const token = createFormulaToken(document, latex, openFormulaEditor);
  let range = textInsertionRange?.cloneRange();
  if (!range || !textEditor.contains(range.startContainer)) {
    range = document.createRange();
    range.selectNodeContents(textEditor);
    range.collapse(false);
  }
  range.deleteContents();
  range.insertNode(token);
  const trailingSpace = document.createTextNode('\u00a0');
  token.after(trailingSpace);
  range = document.createRange();
  range.setStartAfter(trailingSpace);
  range.collapse(true);
  textInsertionRange = range.cloneRange();
  textEditor.focus();
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function openFormulaEditor(token) {
  editingToken = token;
  textFormulaField.setValue(token.dataset.latex);
  formulaDialog.hidden = false;
  syncKeyboardVisibility();
  formulaDialog.scrollIntoView({ block: 'nearest' });
  textFormulaField.focus();
}

function closeFormulaEditor() {
  formulaDialog.hidden = true;
  editingToken = null;
  syncKeyboardVisibility();
  textEditor.focus();
}

function formulaTokenFromEvent(event) {
  return event.composedPath().find(node => node instanceof HTMLElement && node.matches('.text-formula-token')) || null;
}

function updateShiftState() {
  const shiftButton = customKeyboard.querySelector('[data-key="shift"]');
  shifted = !shifted;
  shiftButton.setAttribute('aria-pressed', String(shifted));
  shiftButton.classList.toggle('is-active', shifted);
  customKeyboard.querySelectorAll('[data-shift-label]').forEach(button => {
    button.textContent = shifted ? button.dataset.shiftLabel : button.dataset.key;
    button.setAttribute('aria-label', shifted ? `${button.dataset.shiftLabel} invoegen` : `${button.dataset.key} invoegen`);
  });
}

function setShifted(value) {
  if (shifted !== value) updateShiftState();
}

function syncKeyboardVisibility() {
  document.body.classList.toggle('keyboard-wie', keyboardVariant === 'wie');
  customKeyboard.hidden = keyboardVariant !== 'wie' || !keyboardOpen || !formulaDialog.hidden;
  keyboardToggle.setAttribute('aria-expanded', String(keyboardOpen));
  keyboardToggle.textContent = keyboardOpen ? 'Toetsenbord sluiten' : 'Toetsenbord openen';
  if (keyboardVariant === 'standard') {
    window.mathVirtualKeyboard.layouts = 'default';
    if (keyboardOpen && formulaDialog.hidden) window.mathVirtualKeyboard.show();
    else window.mathVirtualKeyboard.hide();
  } else if (formulaDialog.hidden) {
    window.mathVirtualKeyboard.hide();
  } else {
    window.mathVirtualKeyboard.layouts = 'default';
  }
}

function activateKey(button) {
  const key = button.dataset.key;
  if (key === 'shift') {
    updateShiftState();
    field.focus();
    return;
  }

  const secondaryTemplate = shifted ? button.dataset.shiftTemplate : undefined;
  const template = secondaryTemplate || button.dataset.template;
  const insertion = button.dataset.insert;
  const command = mathfieldCommands[key];
  if (!template && !insertion && !command) return;

  field.focus();
  if (command) field.executeCommand(command);
  else field.executeCommand(['insert', template || insertion, { selectionMode: template ? 'placeholder' : 'after' }]);

  if (secondaryTemplate) setShifted(false);
}

const geoSources = new MockGeometrySources();
const geoBinding = Object.freeze({ sourceId: 'circle-1', property: 'radius', type: 'geometry-source' });
let geoRequest = 0, geoKind = 'area';
async function renderGeometry() {
 const request=++geoRequest, status=document.querySelector('#geo-source-status'), exactOut=document.querySelector('#geo-result-exact'), approxOut=document.querySelector('#geo-result-approx'), revOut=document.querySelector('#geo-revision-status');
 const state=document.querySelector('#geo-state').value, radius=Number(document.querySelector('#geo-radius').value), unit=document.querySelector('#geo-unit').value;
 if(state==='removed') geoSources.remove(geoBinding.sourceId); else geoSources.update(geoBinding.sourceId,{radius,unit,valid:state!=='invalid',accessible:state!=='denied'});
 const revision=geoSources.revision;
 try {
  const source=geoSources.resolve(geoBinding); status.textContent=`Geldig · revisie ${revision}`;
  let dim={length:1}; if(geoKind==='area')dim=multiplyDimensions(dim,dim); if(geoKind==='dimension-conflict')throw new Error('Eenheden/dimensies zijn niet compatibel');
  const latex=document.querySelector('#geo-formula').getValue('latex-expanded').replace(/(?<![A-Za-z])r(?![A-Za-z])/g,`(${source.value})`);
  const result=ce.parse(latex).evaluate(); await Promise.resolve();
  if(request!==geoRequest||revision!==geoSources.revision){revOut.textContent='Verouderde berekening genegeerd';return;}
  if(!result.isValid||result.isNaN||result.isInfinity)throw new Error('Ongeldige formule');
  exactOut.textContent=`${result.toString()} ${dim.length===2?'cm²':'cm'}`;
  const n=result.N().numericValue; approxOut.textContent=n===undefined?'Geen numerieke waarde':`≈${String(n).replace('.',',')} ${dim.length===2?'cm²':'cm'}`; revOut.textContent=`Actueel · revisie ${revision}`;
 } catch(error){status.textContent='Bron of dimensie niet beschikbaar';exactOut.textContent='—';approxOut.textContent='—';revOut.textContent=error.message==='Eenheden/dimensies zijn niet compatibel'?error.message:'Geen actuele uitkomst';}
}
function initialize() {
  field.addEventListener('input', () => {
    activeOperation = 'evaluate';
    render();
  });
  textFormulaField.addEventListener('input', render);
  document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => {
    field.setValue(button.dataset.example);
    field.focus();
    render();
  }));
  document.querySelectorAll('input[name="keyboard-variant"]').forEach(radio => radio.addEventListener('change', () => {
    keyboardVariant = radio.value;
    setShifted(false);
    syncKeyboardVisibility();
    field.focus();
  }));
  keyboardToggle.addEventListener('click', () => {
    keyboardOpen = !keyboardOpen;
    syncKeyboardVisibility();
    field.focus();
  });
  document.addEventListener('selectionchange', captureTextSelection);
  textEditor.addEventListener('click', event => {
    const token = formulaTokenFromEvent(event);
    if (token) openFormulaEditor(token);
  });
  textEditor.addEventListener('keydown', event => {
    const token = formulaTokenFromEvent(event);
    if ((event.key === 'Enter' || event.key === ' ') && token) {
      event.preventDefault();
      openFormulaEditor(token);
    }
  });
  document.querySelector('#insert-formula').addEventListener('pointerdown', captureTextSelection);
  document.querySelector('#insert-formula').addEventListener('click', () => {
    const latex = field.getValue('latex-expanded').trim();
    if (latex) placeFormulaAtTextCursor(latex);
  });
  document.querySelector('#multiple-formulas-example').addEventListener('click', () => {
    textEditor.replaceChildren(
      document.createTextNode('Som: '),
      createFormulaToken(document, '2+3\\times4', openFormulaEditor),
      document.createTextNode(' en wortel: '),
      createFormulaToken(document, '\\sqrt{81}', openFormulaEditor),
      document.createTextNode('.'),
    );
    textInsertionRange = null;
  });
  document.querySelector('#cancel-formula-edit').addEventListener('click', closeFormulaEditor);
  document.querySelector('#formula-edit-form').addEventListener('submit', event => {
    event.preventDefault();
    if (editingToken) setFormulaToken(editingToken, textFormulaField.getValue('latex-expanded'));
    closeFormulaEditor();
    render();
  });
  document.querySelector('#cortex-angle-mode').addEventListener('change', event => {
    ce.angularUnit = event.target.value;
    render();
  });
  document.querySelectorAll('[data-cortex-example]').forEach(button => button.addEventListener('click', () => {
    activeOperation = 'evaluate';
    field.setValue(button.dataset.cortexExample);
    field.focus();
    render();
  }));
  document.querySelector('#determinant-button').addEventListener('click', () => {
    activeOperation = 'determinant';
    render();
  });
  document.querySelectorAll('[data-geo-example]').forEach(button => button.addEventListener('click', () => {
    geoKind=button.dataset.geoExample;
    const formulas={area:'\\pi r^2',circumference:'2\\pi r','length-sum':'r+r','dimension-conflict':'r+\\pi r^2'};
    document.querySelector('#geo-formula').setValue(formulas[geoKind]); renderGeometry();
  }));
  ['geo-radius','geo-unit','geo-state','geo-formula'].forEach(id=>document.querySelector(`#${id}`).addEventListener(id==='geo-formula'?'input':'change',renderGeometry));
  document.querySelector('#geo-insert').addEventListener('click',()=>{document.querySelector('#geo-formula').executeCommand(['insert','r',{selectionMode:'after'}]);renderGeometry();});
  renderGeometry();
  customKeyboard.addEventListener('pointerdown', event => {
    if (event.target.closest('button')) event.preventDefault();
  });
  customKeyboard.addEventListener('click', event => {
    const button = event.target.closest('button[data-key]');
    if (button) activateKey(button);
  });
  syncKeyboardVisibility();
  customElements.whenDefined('math-field').then(render);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
else initialize();
