export function configureDutchMathLive(MathfieldElement, computeEngine) {
  MathfieldElement.locale = 'nl';
  MathfieldElement.strings = {
    ...MathfieldElement.strings,
    nl: {
      ...MathfieldElement.strings.nl,
      'tooltip.undo': 'Ongedaan maken',
      'tooltip.redo': 'Opnieuw',
      'tooltip.copy': 'Kopiëren',
      'tooltip.cut': 'Knippen',
      'tooltip.paste': 'Plakken',
      'tooltip.toggle': 'Toetsenbord tonen of verbergen',
      'tooltip.menu': 'Menu',
      'tooltip.numeric': 'Cijfers',
      'tooltip.symbols': 'Symbolen',
      'tooltip.greek': 'Griekse letters',
    },
  };
  MathfieldElement.decimalSeparator = ',';
  computeEngine.latexOptions = { ...computeEngine.latexOptions, decimalSeparator: '{,}' };
  MathfieldElement.computeEngine = computeEngine;
}

function safeLatex(expression) {
  try { return expression.toLatex(); }
  catch { return expression.toString(); }
}

export function analyzeCortexExpression(computeEngine, latex, { operation = 'evaluate' } = {}) {
  if (!latex?.trim()) {
    return { visual: 'Leeg', parsed: 'Niet geparseerd', category: 'Geen invoer', exactLatex: '', exactText: '', numericText: '', mathJson: '' };
  }

  let parsed;
  try { parsed = computeEngine.parse(latex); }
  catch (error) {
    return { visual: 'Ingevoerd in MathLive', parsed: 'Parsefout', category: 'Parsefout', exactLatex: '', exactText: '', numericText: '', mathJson: '', detail: error.message };
  }
  const mathJson = JSON.stringify(parsed.json);
  if (!parsed.isValid) {
    return { visual: 'Ingevoerd in MathLive', parsed: 'Ongeldig', category: 'Parsefout', exactLatex: '', exactText: '', numericText: '', mathJson, detail: (parsed.errors || []).map(error => error.message || String(error)).join('; ') };
  }

  let exact;
  try {
    if (operation === 'determinant') {
      const matrix = parsed.json?.[0] === 'Matrix' ? parsed.json[1] : parsed.json?.[0] === 'Determinant' ? parsed.json[1] : null;
      if (!matrix) return { visual: 'Ingevoerd in MathLive', parsed: 'Geldig', category: 'Rekenfout', exactLatex: safeLatex(parsed), exactText: '', numericText: '', mathJson, detail: 'Selecteer een matrix om de determinant te berekenen.' };
      exact = parsed.json?.[0] === 'Determinant' ? parsed.evaluate() : computeEngine.box(['Determinant', matrix]).evaluate();
    } else exact = parsed.evaluate();
  } catch (error) {
    return { visual: 'Ingevoerd in MathLive', parsed: 'Geldig', category: 'Rekenfout', exactLatex: '', exactText: '', numericText: '', mathJson, detail: error.message };
  }

  if (!exact?.isValid) {
    return { visual: 'Ingevoerd in MathLive', parsed: 'Geldig', category: 'Rekenfout', exactLatex: safeLatex(exact), exactText: exact.toString(), numericText: '', mathJson, detail: 'Compute Engine leverde een ongeldige resultaatexpressie.' };
  }
  if (exact.isNaN || exact.isInfinity) {
    return { visual: 'Ingevoerd in MathLive', parsed: 'Geldig', category: 'Geen eindige waarde', exactLatex: safeLatex(exact), exactText: exact.toString(), numericText: '', mathJson };
  }

  const exactLatex = safeLatex(exact);
  const exactText = exact.toString();
  const numeric = exact.N();
  const numericValue = numeric?.numericValue;
  const numericText = numericValue === undefined ? '' : numeric.toString().replace(/\./g, ',');
  const symbolic = numericValue === undefined;
  const category = symbolic
    ? (exact.isCollection ? 'Geldige matrix/tensor' : 'Geldige symbolische expressie')
    : exact.isExact ? 'Exact numeriek resultaat' : 'Benaderd numeriek resultaat';

  return { visual: 'Ingevoerd in MathLive', parsed: 'Geldig', category, exactLatex, exactText, numericText, mathJson, symbolic };
}

export function createFormulaToken(document, latex, onActivate) {
  const token = document.createElement('span');
  token.className = 'text-formula-token';
  token.dataset.formulaType = 'mathlive-latex';
  token.dataset.formulaSchema = '1';
  token.dataset.latex = latex;
  token.contentEditable = 'false';
  token.setAttribute('role', 'button');
  token.setAttribute('tabindex', '0');
  token.setAttribute('aria-label', 'Formule bewerken');
  const view = document.createElement('math-field');
  view.setAttribute('read-only', '');
  view.setAttribute('tabindex', '-1');
  view.setAttribute('aria-label', 'Ingevoegde wiskundige formule');
  view.setValue(latex);
  if (onActivate) {
    const activate = (event) => {
      event.stopPropagation();
      onActivate(token);
    };
    token.addEventListener('click', activate);
    view.addEventListener('click', activate);
    token.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onActivate(token);
      }
    });
  }
  token.append(view);
  return token;
}

export function setFormulaToken(token, latex) {
  const current = readFormulaPayload(token);
  const updated = updateFormulaPayload(current, latex);
  token.dataset.formulaSchema = String(updated.schema);
  token.dataset.latex = latex;
  token.querySelector('math-field').setValue(latex);
}

export function readFormulaPayload(token) {
  return { type: token.dataset.formulaType, schema: Number(token.dataset.formulaSchema), latex: token.dataset.latex };
}

export function updateFormulaPayload(current, latex) {
  return { ...current, latex };
}
