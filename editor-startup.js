/* From Zero 2 Infinity — explicit saved-draft policy */
(function (global) {
  "use strict";

  const MI = global.FZI.MathIllustration;
  const key = "fzi.mathIllustration.draft";

  // Restore a saved draft on startup. New explicitly clears it after confirmation.
  // Read/parse/load failures are reported by the editor; recovery data is retained.
  MI.DraftStore = {
    key: key,
    restore(engine, storage) {
      const draft = storage.getItem(key);
      if (draft == null) return false;
      engine.load(JSON.parse(draft));
      return true;
    },
    save(engine, storage) { storage.setItem(key, engine.toJSONString(true)); },
    clear(storage) { storage.removeItem(key); }
  };
})(window);
