/* Pure source-pair dispatch for the existing persistent intersection recipes. */
(function (global) {
  'use strict';
  const MI = global.FZI.MathIllustration;

  function isSameReference(a, b) {
    if (!a || !b) return false;
    if (MI.AxisReferences.isAxis(a) || MI.AxisReferences.isAxis(b))
      return MI.AxisReferences.isAxis(a) && MI.AxisReferences.isAxis(b) && a.frame === b.frame && a.axis === b.axis;
    return a.objectId === b.objectId && (a.part ?? null) === (b.part ?? null) && (a.index ?? null) === (b.index ?? null);
  }

  function accepts(source, role, kind, index, objects) {
    if (MI.AxisReferences.isAxis(source)) return role === 'line' && MI.AxisReferences.supports(kind, index);
    const object = objects.get(source?.objectId);
    return !!object && MI.ConstructionService.referencesForRole(object, role, kind)
      .some(reference => isSameReference(source, { ...reference, objectId: object.id }));
  }

  function classify(sources, objects) {
    if (!Array.isArray(sources) || sources.length !== 2 || !objects || typeof objects.get !== 'function')
      return { supported: false, reasonCode: 'INVALID_REFERENCE' };
    const original = sources.map(source => source && { ...source });
    if (accepts(original[0], 'line', 'lineIntersection', 0, objects) &&
        accepts(original[1], 'line', 'lineIntersection', 1, objects))
      return { supported: true, kind: 'lineIntersection', sources: original };

    if (accepts(original[0], 'line', 'lineCircleIntersection', 0, objects) &&
        accepts(original[1], 'circle', 'lineCircleIntersection', 1, objects))
      return { supported: true, kind: 'lineCircleIntersection', sources: original };
    if (accepts(original[1], 'line', 'lineCircleIntersection', 0, objects) &&
        accepts(original[0], 'circle', 'lineCircleIntersection', 1, objects))
      return { supported: true, kind: 'lineCircleIntersection', sources: [original[1], original[0]] };

    if (accepts(original[0], 'line', 'lineEllipseIntersection', 0, objects) &&
        accepts(original[1], 'ellipse', 'lineEllipseIntersection', 1, objects))
      return { supported: true, kind: 'lineEllipseIntersection', sources: original };
    if (accepts(original[1], 'line', 'lineEllipseIntersection', 0, objects) &&
        accepts(original[0], 'ellipse', 'lineEllipseIntersection', 1, objects))
      return { supported: true, kind: 'lineEllipseIntersection', sources: [original[1], original[0]] };

    if (accepts(original[0], 'circle', 'circleCircleIntersection', 0, objects) &&
        accepts(original[1], 'circle', 'circleCircleIntersection', 1, objects))
      return { supported: true, kind: 'circleCircleIntersection', sources: original };
    return { supported: false, reasonCode: 'UNSUPPORTED_PAIR' };
  }

  function evaluate(sources, objects) {
    const pair = classify(sources, objects);
    if (!pair.supported) return { ...pair, candidates: [] };
    try { MI.ConstructionService.validateReferences({ kind: pair.kind, sources: pair.sources, ...(pair.kind==='lineEllipseIntersection'?{branch:0}:{}) }, objects); }
    catch (error) { return { ...pair, supported: false, reasonCode: error.code || 'INVALID_REFERENCE', candidates: [] }; }
    const branches = pair.kind === 'lineIntersection' ? [undefined] : [0, 1];
    const evaluations = branches.map(branch => {
      const recipe = { kind: pair.kind, sources: pair.sources.map(source => ({ ...source })), ...(branch == null ? {} : { branch }) };
      const result = MI.ConstructionService.evaluate(recipe, objects);
      return { recipe, evaluation: result };
    });
    const candidates = evaluations.filter(item => item.evaluation.valid && item.evaluation.geometry)
      .map(({ recipe, evaluation: result }) => ({
        ...(recipe.branch == null ? {} : { branch: recipe.branch }),
        x: result.geometry.x, y: result.geometry.y, recipe,
      }));
    const reasonCode = candidates.length ? 'VALID' : evaluations.find(item => item.evaluation.reasonCode && item.evaluation.reasonCode !== 'VALID')?.evaluation.reasonCode || 'NO_REAL_INTERSECTION';
    return { ...pair, candidates, reasonCode };
  }

  MI.IntersectionDispatcher = Object.freeze({ classify, evaluate });
})(window);
