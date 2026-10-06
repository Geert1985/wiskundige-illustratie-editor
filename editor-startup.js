/* From Zero 2 Infinity — start the editor with a fresh canvas */
(function () {
  "use strict";

  const STORAGE_KEY = "fzi.mathIllustration.draft";
  const originalGetItem = Storage.prototype.getItem;
  Storage.prototype.getItem = function (key) {
    if (key === STORAGE_KEY) return null;
    return originalGetItem.call(this, key);
  };

  // Restore normal localStorage behaviour after editor.js has initialized.
  setTimeout(function () {
    Storage.prototype.getItem = originalGetItem;
  }, 0);
})();
