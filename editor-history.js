/* Session-only document history. Engine mutations remain independent of history. */
(function(global) {
  'use strict';
  const MI = global.FZI.MathIllustration;
  class EditorHistory {
    constructor(app, { limit = 100, maxBytes = 16 * 1024 * 1024 } = {}) { this.app = app; this.limit = limit; this.maxBytes = maxBytes; this.clear(); }
    clear() { this.entries = []; this.cursor = 0; }
    capture() {
      const document = this.app.engine.toJSON(), grid = this.app.services && this.app.services.grid;
      if (grid) document.presentation.axisStep = grid.step(this.app.engine.renderer);
      return { document: JSON.stringify(document), selectedId: this.app.selectedId, selectedIds: this.app.selectedIds && this.app.selectedIds.slice() };
    }
    record(before) {
      const after = this.capture();
      if (before.document === after.document) return false;
      this.entries.splice(this.cursor);
      this.entries.push({ before, after });
      let bytes = this.entries.reduce((sum, entry) => sum + 2 * (entry.before.document.length + entry.after.document.length), 0);
      // Retain at least the most recent command, even if one document exceeds the budget.
      while (this.entries.length > 1 && (this.entries.length > this.limit || bytes > this.maxBytes)) {
        const entry = this.entries.shift(); bytes -= 2 * (entry.before.document.length + entry.after.document.length);
      }
      this.cursor = this.entries.length; return true;
    }
    get canUndo() { return this.cursor > 0; }
    get canRedo() { return this.cursor < this.entries.length; }
    restore(snapshot) {
      this.app.engine.load(JSON.parse(snapshot.document));
      if(this.app.selectedIds) { this.app.selectedIds=(snapshot.selectedIds || [snapshot.selectedId]).filter(id=>id&&this.app.engine.get(id)); return; }
      this.app.selectedId = snapshot.selectedId && this.app.engine.get(snapshot.selectedId) ? snapshot.selectedId : null;
    }
    undo() { if (!this.canUndo) return false; this.restore(this.entries[this.cursor - 1].before); this.cursor--; return true; }
    redo() { if (!this.canRedo) return false; this.restore(this.entries[this.cursor].after); this.cursor++; return true; }
  }
  MI.EditorHistory = EditorHistory;
  class RuntimeHistory {
    constructor(app) { this.app=app; }
    capture() { return Object.freeze({revision:this.app.runtime.documentRevision}); }
    record() { return false; }
    clear() {}
    get entries() { return Object.freeze([]); }
    get canUndo() { return this.app.runtime.canUndo; }
    get canRedo() { return this.app.runtime.canRedo; }
    restore() { throw new MI.PermissionError('UNTRUSTED_HISTORY'); }
    undo() { if(!this.canUndo)return false;this.app.execute('history.undo');return true; }
    redo() { if(!this.canRedo)return false;this.app.execute('history.redo');return true; }
  }
  MI.RuntimeHistory=RuntimeHistory;
})(window);
