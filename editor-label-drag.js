/* From Zero 2 Infinity — dedicated label dragging */
(function (global) {
  "use strict";

  const MI = global.FZI && global.FZI.MathIllustration;
  if (!MI || !MI.Engine) return;

  let activeEngine = null;
  let drag = null;

  const originalRenderSVG = MI.Engine.prototype.renderSVG;
  MI.Engine.prototype.renderSVG = function () {
    activeEngine = this;
    return originalRenderSVG.apply(this, arguments);
  };

  function findLabel(target) {
    if (!target) return null;
    if (target.closest) {
      const label = target.closest(".object-label");
      if (label) return label;
    }
    const path = typeof target.composedPath === "function" ? target.composedPath() : [];
    for (let i = 0; i < path.length; i += 1) {
      const node = path[i];
      if (node && node.classList && node.classList.contains("object-label")) return node;
    }
    return null;
  }

  function basePosition(object, engine) {
    if (object.type === "line") return {
      x: (object.x1 + object.x2) / 2,
      y: (object.y1 + object.y2) / 2
    };
    if (object.type === "circle") return { x: object.cx, y: object.cy };
    return { x: object.x, y: object.y };
  }

  function defaultOffset(object, engine) {
    const scale = engine.renderer.scale() || 1;
    const dx = object.type === "line" || object.type === "text" ? 6 : 8;
    const dy = object.type === "line" || object.type === "text" ? -6 : -8;
    return { x: dx / scale, y: -dy / scale };
  }

  function currentOffset(object, engine) {
    const fallback = defaultOffset(object, engine);
    return {
      x: Number.isFinite(Number(object.labelOffsetX)) ? Number(object.labelOffsetX) : fallback.x,
      y: Number.isFinite(Number(object.labelOffsetY)) ? Number(object.labelOffsetY) : fallback.y
    };
  }

  function setLabelPosition(label, object, engine, offset) {
    const base = basePosition(object, engine);
    const scale = engine.renderer.scale() || 1;
    label.setAttribute("x", String(engine.renderer.mapX(base.x + offset.x)));
    label.setAttribute("y", String(engine.renderer.mapY(base.y + offset.y)));
  }

  document.addEventListener("mousedown", function (event) {
    if (event.button !== 0 || !activeEngine) return;
    const label = findLabel(event.target);
    if (!label) return;
    const object = activeEngine.get(label.getAttribute("data-label-id"));
    if (!object) return;

    const offset = currentOffset(object, activeEngine);
    drag = {
      label: label,
      objectId: object.id,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
      scale: activeEngine.renderer.scale() || 1
    };

    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  document.addEventListener("mousemove", function (event) {
    if (!drag || !activeEngine) return;
    const offset = {
      x: drag.offsetX + (event.clientX - drag.startX) / drag.scale,
      y: drag.offsetY - (event.clientY - drag.startY) / drag.scale
    };
    const object = activeEngine.get(drag.objectId);
    if (!object) return;
    setLabelPosition(drag.label, object, activeEngine, offset);
  }, true);

  document.addEventListener("mouseup", function () {
    if (!drag || !activeEngine) return;
    const current = drag;
    drag = null;
    const object = activeEngine.get(current.objectId);
    if (!object) return;

    const offset = {
      x: current.offsetX + (current.label.getBoundingClientRect().left - current.label.getBoundingClientRect().left),
      y: current.offsetY
    };

    // The final mouse position is stored from the latest move event.
    // If no move occurred, the original offset is preserved.
    if (current.lastX != null) {
      offset.x = current.offsetX + (current.lastX - current.startX) / current.scale;
      offset.y = current.offsetY - (current.lastY - current.startY) / current.scale;
    }
    activeEngine.update(object.id, { labelOffsetX: offset.x, labelOffsetY: offset.y });
  }, true);

  document.addEventListener("mousemove", function (event) {
    if (drag) {
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
    }
  }, false);
})(window);
