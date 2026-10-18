import 'mathlive';
import { ComputeEngine } from '@cortex-js/compute-engine';
import { compactFormattedResult } from './display-format.mjs';

const { ExpressionEngine } = globalThis.FZI.MathIllustration;
const ce = new ComputeEngine();
const field = document.querySelector('#formula');
const nodes = Object.fromEntries(['result-a', 'result-b', 'status-a', 'status-b', 'latex-value', 'json-a', 'ascii-value', 'wie-value'].map(id => [id, document.getElementById(id)]));

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

function initialize() {
  field.addEventListener('input', render);
  document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => {
    field.setValue(button.dataset.example);
    field.focus();
    render();
  }));
  document.getElementById('keyboard-toggle').addEventListener('click', () => {
    if (window.mathVirtualKeyboard.visible) window.mathVirtualKeyboard.hide();
    else window.mathVirtualKeyboard.show();
  });
  customElements.whenDefined('math-field').then(render);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
else initialize();
