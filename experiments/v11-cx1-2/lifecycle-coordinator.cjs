'use strict';

const { randomUUID } = require('node:crypto');

const DOCUMENT_MUTATIONS = new Set([
  'object.create', 'object.duplicate', 'object.delete', 'object.translate',
  'object.setGeometry', 'object.setProperties', 'object.patchBatch',
  'text.commit', 'text.restoreStatic', 'linear.draw', 'construction.create',
  'construction.setSumDistance', 'construction.setParallelogramParameters',
  'construction.setParameter', 'construction.setExtent', 'construction.setInputs',
  'construction.detach', 'circleDistribution.set', 'circleDistribution.delete',
  'group.create', 'group.ungroup', 'group.rename', 'layer.create', 'layer.assign',
  'layer.rename', 'layer.setVisibility', 'layer.reorder', 'layer.delete',
  'object.setLock', 'object.setVisibility', 'document.setAngleMeasurement',
  'document.setMeasurement', 'document.setMeta', 'document.setPresentation',
  'document.clear', 'document.reset', 'document.replace', 'parameter.set'
]);

function lifecycleError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function createAuthorLifecycle({ engine, commands, mutationBoundaryClosed = false, contextIdFactory = randomUUID }) {
  if (!engine || !commands || typeof commands.execute !== 'function') throw new TypeError('Engine and AuthorCommands are required.');

  let contextId = contextIdFactory();
  let documentRevision = 0;
  let validityGeneration = 0;
  let closed = false;
  let activePreview = null;
  const sourceGenerations = new Map();
  const sourcePresent = new Set();

  function currentIds() { return new Set(engine.model.objects.map(object => object.id)); }
  function reconcileSources() {
    const ids = currentIds();
    for (const id of sourcePresent) if (!ids.has(id)) sourcePresent.delete(id);
    for (const id of ids) if (!sourcePresent.has(id)) {
      sourceGenerations.set(id, (sourceGenerations.get(id) || 0) + 1);
      sourcePresent.add(id);
    }
  }
  function open() { if (closed) throw lifecycleError('HOST_CLOSED'); }
  function requireCoveredBoundary() {
    open();
    if (!mutationBoundaryClosed) throw lifecycleError('MUTATION_BOUNDARY_UNPROVEN');
  }
  function invalidateDocument(operation) {
    documentRevision += 1;
    validityGeneration += 1;
    if (operation === 'document.replace' || operation === 'document.reset' || operation === 'document.clear') sourcePresent.clear();
    reconcileSources();
    if (operation === 'document.replace' || operation === 'document.reset' || operation === 'document.clear') {
      contextId = contextIdFactory();
      validityGeneration += 1;
    }
  }
  reconcileSources();

  return Object.freeze({
    get contextId() { return contextId; },
    get documentRevision() { return documentRevision; },
    get closed() { return closed; },
    get mutationBoundaryClosed() { return mutationBoundaryClosed; },
    get coverage() {
      return Object.freeze({
        authorCommands: 'WRAPPED',
        editorHistory: 'WRAPPED_ONLY_IF_CALLED_THROUGH_HOST',
        directEngineAddUpdateRemoveLoad: 'UNOBSERVED',
        previewAndCancel: 'WRAPPED_ONLY_IF_CALLED_THROUGH_HOST'
      });
    },
    selectSource(sourceId) {
      requireCoveredBoundary();
      if (activePreview) throw lifecycleError('PREVIEW_ACTIVE');
      if (typeof sourceId !== 'string' || !sourcePresent.has(sourceId)) throw lifecycleError('SOURCE_UNAVAILABLE');
      return Object.freeze({
        contextId,
        documentRevision,
        validityGeneration,
        sourceId,
        instanceGeneration: sourceGenerations.get(sourceId)
      });
    },
    assertBindingCurrent(binding) {
      requireCoveredBoundary();
      if (!binding || binding.contextId !== contextId || binding.documentRevision !== documentRevision ||
          binding.validityGeneration !== validityGeneration || !sourcePresent.has(binding.sourceId) ||
          sourceGenerations.get(binding.sourceId) !== binding.instanceGeneration || activePreview) {
        throw lifecycleError('STALE_BINDING');
      }
      return true;
    },
    isBindingCurrent(binding) {
      try { return this.assertBindingCurrent(binding); } catch { return false; }
    },
    execute(command) {
      requireCoveredBoundary();
      const result = commands.execute(command);
      if (DOCUMENT_MUTATIONS.has(command.operation)) invalidateDocument(command.operation);
      return result;
    },
    beginPreview() {
      requireCoveredBoundary();
      if (activePreview) throw lifecycleError('PREVIEW_ACTIVE');
      validityGeneration += 1;
      activePreview = Object.freeze({ contextId, validityGeneration });
      return activePreview;
    },
    finishPreview(token, { committed = false } = {}) {
      requireCoveredBoundary();
      if (!activePreview || token !== activePreview) throw lifecycleError('STALE_PREVIEW');
      activePreview = null;
      validityGeneration += 1;
      if (committed) {
        documentRevision += 1;
        reconcileSources();
      }
    },
    undo(history) {
      requireCoveredBoundary();
      const changed = history.undo();
      if (changed) invalidateDocument('history.undo');
      return changed;
    },
    redo(history) {
      requireCoveredBoundary();
      const changed = history.redo();
      if (changed) invalidateDocument('history.redo');
      return changed;
    },
    replaceDocument(data) {
      requireCoveredBoundary();
      engine.load(data);
      invalidateDocument('document.replace');
    },
    dispose() {
      if (closed) return;
      closed = true;
      validityGeneration += 1;
      activePreview = null;
      sourcePresent.clear();
    }
  });
}

module.exports = { createAuthorLifecycle };
