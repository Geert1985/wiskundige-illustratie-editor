const test = require('node:test');
const assert = require('node:assert/strict');
(async () => {
  const { ComputeEngine } = await import('@cortex-js/compute-engine');
  const { MockGeometrySources, createPublicationGuard } = await import('../geometry-poc.mjs');
  const { evaluateMathLiveLatex, sourceLatex } = await import('../structural-binding.mjs');
  const ce = new ComputeEngine();
  const formula1 = `${sourceLatex('wieSourceA')}^2`;
  const formula2 = `${sourceLatex('wieSourceA')}+${sourceLatex('wieSourceA')}`;
  const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
  function setup(publish) {
    const provider = new MockGeometrySources();
    const binding = provider.selectBinding('circle-1', 'wieSourceA');
    const events = [];
    const guard = createPublicationGuard(provider, publish || (event => events.push(event)));
    const input = (formulaSnapshot = formula1, formulaGeneration = 1, settings = { angleMode: 'rad' }, bindings = [binding]) => ({ formulaSnapshot, formulaGeneration, settings, bindings });
    const evaluate = (context, snapshotProvider) => evaluateMathLiveLatex(ce, context.formulaSnapshot, context.bindings, snapshotProvider, context.settings);
    return { provider, binding, guard, events, input, evaluate };
  }
  test('C3-01 immutable context captures formula identity, generation, bindings, revisions and settings', async () => {
    const { provider, guard, input, evaluate } = setup();
    const settings = { angleMode: 'deg', presentation: { unit: 'cm' } };
    let captured;
    const pending = guard.run(input(formula1, 7, settings), async (context, sources) => { captured = context; await Promise.resolve(); return evaluate(context, sources); });
    settings.presentation.unit = 'm';
    const outcome = await pending;
    assert.equal(outcome.status, 'Actueel');
    assert.equal(captured.formulaIdentity, formula1);
    assert.equal(captured.formulaGeneration, 7);
    assert.equal(captured.sourceRevision, provider.revision);
    assert.equal(captured.documentRevision, provider.documentRevision);
    assert.equal(captured.permissionEpoch, provider.permissionEpoch);
    assert.ok(Number.isSafeInteger(captured.requestGeneration));
    assert.equal(captured.settings.presentation.unit, 'cm');
    assert.ok(Object.isFrozen(captured) && Object.isFrozen(captured.settings.presentation) && Object.isFrozen(captured.bindings));
  });
  test('C3-02 rights are checked before calculation and denied details are not published', async () => {
    const events = [], { provider, binding, guard, input } = setup(event => events.push(event));
    provider.revoke(binding.sourceId);
    let called = false;
    const outcome = await guard.run(input(), async () => { called = true; });
    assert.equal(called, false);
    assert.equal(outcome.status, 'Toegang ingetrokken');
    assert.equal(events.at(-1).result, null);
    assert.doesNotMatch(JSON.stringify(events.map(({ status, result }) => ({ status, result }))), /circle-1|wieSourceA|radius|2/);
  });
  test('C3-03 CortexJS receives only the captured authorized typed source snapshot', async () => {
    const { provider, guard, input, evaluate } = setup();
    const outcome = await guard.run(input(), evaluate);
    assert.equal(outcome.status, 'Actueel');
    assert.equal(outcome.result.numericValue, .0004);
    assert.deepEqual(outcome.result.dimension, { length: 2 });
  });
  test('C3-04 source changes during delayed evaluation invalidate and clear the result', async () => {
    const { provider, guard, input, evaluate, events } = setup();
    const gate = deferred(), started = deferred();
    const pending = guard.run(input(), async (context, resolver) => { started.resolve(); await gate.promise; return evaluate(context, resolver); });
    await started.promise;
    provider.update('circle-1', { radius: 4 });
    assert.equal(events.at(-1).status, 'Verouderde berekening');
    assert.equal(events.at(-1).result, null);
    gate.resolve();
    assert.equal((await pending).published, false);
  });
  test('C3-05 deleting a source during evaluation prevents publication', async () => {
    const { provider, binding, guard, input, evaluate, events } = setup();
    const gate = deferred(), started = deferred();
    const pending = guard.run(input(), async (context, resolver) => { started.resolve(); await gate.promise; return evaluate(context, resolver); });
    await started.promise;
    provider.remove(binding.sourceId);
    gate.resolve();
    assert.equal((await pending).status, 'Verouderde berekening');
    assert.equal(events.at(-1).result, null);
  });
  test('C3-06 rights revoked while evaluation is running clear the visible result', async () => {
    const { provider, binding, guard, input, evaluate, events } = setup();
    const gate = deferred(), started = deferred();
    const pending = guard.run(input(), async (context, resolver) => { started.resolve(); await gate.promise; return evaluate(context, resolver); });
    await started.promise;
    provider.revoke(binding.sourceId);
    gate.resolve();
    assert.equal((await pending).published, false);
    assert.equal(events.at(-1).status, 'Verouderde berekening');
  });
  test('C3-07 permission epoch is captured and rechecked before publishing', async () => {
    const { provider, binding, guard, input, evaluate } = setup();
    const before = provider.permissionEpoch;
    const gate = deferred(), started = deferred();
    const pending = guard.run(input(), async (context, resolver) => { assert.equal(context.permissionEpoch, before); started.resolve(); await gate.promise; return evaluate(context, resolver); });
    await started.promise;
    provider.update(binding.sourceId, { allowed: false });
    assert.equal(provider.permissionEpoch, before + 1);
    gate.resolve();
    assert.equal((await pending).published, false);
  });
  test('C3-08 a changed formula generation supersedes an in-flight formula', async () => {
    const { guard, input, evaluate, events } = setup();
    const gate = deferred(), started = deferred();
    const oldRun = guard.run(input(formula1, 1), async (context, resolver) => { started.resolve(); await gate.promise; return evaluate(context, resolver); });
    await started.promise;
    const newRun = await guard.run(input(formula2, 2), evaluate);
    assert.equal(newRun.status, 'Actueel');
    gate.resolve();
    assert.equal((await oldRun).published, false);
    assert.equal(events.at(-1).status, 'Actueel');
  });
  test('C3-09 only the newest concurrent request can publish even when the older request returns last', async () => {
    const { guard, input, evaluate, events } = setup();
    const gate = deferred(), started = deferred();
    const oldRun = guard.run(input(formula1, 3), async (context, resolver) => { started.resolve(); await gate.promise; return evaluate(context, resolver); });
    await started.promise;
    const newest = await guard.run(input(formula2, 3), evaluate);
    assert.equal(newest.published, true);
    const publishedRequest = events.at(-1).requestGeneration;
    gate.resolve();
    assert.equal((await oldRun).published, false);
    assert.equal(events.filter(event => event.status === 'Actueel').length, 1);
    assert.equal(events.at(-1).requestGeneration, publishedRequest);
  });
  test('C3-10 removed and recreated source identity cannot satisfy an old binding', async () => {
    const { provider, binding, guard, input, evaluate, events } = setup();
    const gate = deferred(), started = deferred();
    const pending = guard.run(input(), async (context, resolver) => { started.resolve(); await gate.promise; return evaluate(context, resolver); });
    await started.promise;
    provider.remove(binding.sourceId);
    provider.restore(binding.sourceId, 9, 'cm');
    gate.resolve();
    assert.equal((await pending).published, false);
    assert.equal(events.at(-1).result, null);
    const retry = await guard.run(input(), evaluate);
    assert.equal(retry.status, 'Bron niet beschikbaar');
  });
  test('C3-11 failed replacement calculation clears a previously current result', async () => {
    const { guard, input, evaluate, events } = setup();
    assert.equal((await guard.run(input(), evaluate)).status, 'Actueel');
    assert.ok(events.at(-1).result);
    const failed = await guard.run(input('\\bad{', 2), () => { throw Object.assign(Error(), { code: 'INVALID_MATH' }); });
    assert.equal(failed.status, 'Ongeldige formule');
    assert.equal(events.at(-1).result, null);
    assert.equal(events.at(-1).status, 'Ongeldige formule');
  });
  test('C3-12 final revision check rejects a result changed after calculation', async () => {
    const { provider, binding, guard, input, evaluate, events } = setup();
    const outcome = await guard.run(input(), async (context, resolver) => {
      const result = evaluate(context, resolver);
      provider.update(binding.sourceId, { radius: 5 });
      return result;
    });
    assert.equal(outcome.status, 'Verouderde berekening');
    assert.equal(events.some(event => event.status === 'Actueel'), false);
  });
  test('C3-13 successful publication occurs only after source, document and permission checks', async () => {
    const { guard, input, evaluate, events } = setup();
    const outcome = await guard.run(input(), evaluate);
    assert.equal(outcome.status, 'Actueel');
    assert.deepEqual(events.map(event => event.status), ['Berekenen', 'Actueel']);
    assert.ok(events.at(-1).result.numericValue > 0);
  });
  test('C3-14 adapter failures become safe localized statuses without source data', async () => {
    const events = [], { binding, guard, input } = setup(event => events.push(event));
    const outcome = await guard.run(input('\\mathrm{wieSourceUnknown}', 4, {}, [binding]), (context, resolver) => evaluateMathLiveLatex(ce, context.formulaSnapshot, context.bindings, resolver, { angleMode: 'rad' }));
    assert.equal(outcome.status, 'Ongeldige formule');
    assert.doesNotMatch(JSON.stringify(events.map(({ status, result }) => ({ status, result }))), /circle-1|wieSourceA|wieSourceUnknown|radius|2/);
  });
  test('C3-15 the active UI route uses the publication guard and snapshot evaluator', () => {
    const fs = require('node:fs'), path = require('node:path');
    const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    const geometry = fs.readFileSync(path.join(__dirname, '..', 'geometry-poc.mjs'), 'utf8');
    assert.match(app, /createPublicationGuard\(geoSources/);
    assert.match(app, /geoPublicationGuard\.run\(/);
    assert.match(app, /evaluateMathLiveLatex\(ce, context\.formulaSnapshot, context\.bindings, snapshotProvider, context\.settings\)/);
    assert.match(app, /geoPublicationGuard\.invalidate\('Berekenen'\)/);
    assert.doesNotMatch(geometry, /createRevisionGuard/);
    assert.doesNotMatch(app, /geoSources\.resolveTyped\(/);
  });
})();
