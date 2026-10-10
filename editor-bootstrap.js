/* All dependencies are ready before the first editor render. */
(function(global) {
  "use strict";
  const MI = global.FZI.MathIllustration;
  MI.bootstrapEditor = function(options = {}) {
    const runtime=options.runtimeSession;
    if ('runtimeSession' in options && !MI.RuntimeSession.isSession(runtime)) throw new MI.PermissionError('INVALID_POLICY');
    if (MI.editor) MI.editor.dispose();
    const document = options.document || global.document, window = options.window || global;
    const engine = runtime ? runtime.engine : options.engine || new MI.Engine({objects:[],meta:{measurement:{...MI.MeasurementUnits.defaults}}}, { width: 1000, padding: 30, showGrid: true, bounds: { xMin: -5, xMax: 5, yMin: -3, yMax: 3 }, background: "#f7f7f4" });
    const storage = options.storage || (() => { try { return global.localStorage; } catch (e) { return { getItem() { throw e; } }; } })();
    const services = {...(options.services || { history: MI.EditorHistory, transform: MI.CoordinateTransform, snap: MI.SnapService, resolver: MI.InteractionResolver, draft: MI.DraftStore, grid: MI.adaptiveGridStep && { step: MI.adaptiveGridStep, maxScale: MI.adaptiveGridMaxScale }, labels: MI.LabelOffsets, overlays: MI.EditorOverlays, feedback: MI.SnapFeedback, color: MI.EditorColor, axis: MI.AxisSettings })};
    if(runtime){services.runtime=runtime;services.draft=null;services.grid=null;}
    let startupStatus = null;
    if (!services.selection) services.selection = MI.RectangleSelection;
    if (!runtime && options.restoreDraft !== false && services.draft) try { if (services.draft.restore(engine, storage)) startupStatus = "Opgeslagen concept geladen."; } catch (e) { startupStatus = "Concept kon niet worden geladen; opgeslagen gegevens zijn behouden: " + e.message; }
    const app = new MI.EditorApp({ engine, services, document, window, storage });
    MI.editor = app; MI.activeEngine = engine; // Compatibility reference; never used for discovery by the app.
    app.init(); if (startupStatus) app.status(startupStatus);
    return app;
  };
  MI.bootstrapRestrictedEditor=function(options={}) { if(!MI.RuntimeSession.isSession(options.runtimeSession))throw new MI.PermissionError('INVALID_POLICY');return MI.bootstrapEditor(options); };
  if (global.document && global.document.getElementById("canvas")) MI.bootstrapEditor();
})(window);
