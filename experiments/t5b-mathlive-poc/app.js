import 'mathlive';
import { ComputeEngine } from '@cortex-js/compute-engine';
import { compactFormattedResult } from './display-format.mjs';

const { ExpressionEngine } = globalThis.FZI.MathIllustration;
const ce = new ComputeEngine();
const field = document.querySelector('#formula');
const customKeyboard = document.querySelector('#custom-keyboard');
const keyboardToggle = document.querySelector('#keyboard-toggle');
let keyboardVariant = 'standard';
let keyboardOpen = false;
let shifted = false;
const nodes = Object.fromEntries(['result-a', 'result-b', 'status-a', 'status-b', 'latex-value', 'json-a', 'ascii-value', 'wie-value'].map(id => [id, document.getElementById(id)]));
const mathfieldCommands = Object.freeze({
  left: 'moveToPreviousChar', right: 'moveToNextChar', up: 'moveUp', down: 'moveDown', backspace: 'deleteBackward',
});

function errorText(error) {
  return error?.code || error?.message || String(error);
}

function evaluateA(latex) {
  const expression = ce.parse(latex);
  const evaluated = expression.N();
  if (evaluated.isNaN || evaluated.isInfinity) throw new Error('Geen eindige numerieke uitkomst');
  const value = evaluated.valueOf();
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Geen eindige numerieke uitkomst');
  return { value: String(value), mathJson: JSON.stringify(expression.json) };
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
  try {
    const result = evaluateA(latex);
    nodes['result-a'].textContent = result.value;
    nodes['json-a'].textContent = result.mathJson;
  } catch (error) {
    nodes['result-a'].textContent = 'Niet berekend';
    nodes['status-a'].textContent = errorText(error);
    nodes['json-a'].textContent = '—';
  }
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
  customKeyboard.hidden = keyboardVariant !== 'wie' || !keyboardOpen;
  keyboardToggle.setAttribute('aria-expanded', String(keyboardOpen));
  keyboardToggle.textContent = keyboardOpen ? 'Toetsenbord sluiten' : 'Toetsenbord openen';
  if (keyboardVariant === 'standard') {
    window.mathVirtualKeyboard.layouts = 'default';
    if (keyboardOpen) window.mathVirtualKeyboard.show();
    else window.mathVirtualKeyboard.hide();
  } else {
    window.mathVirtualKeyboard.hide();
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

function initialize() {
  field.addEventListener('input', render);
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
